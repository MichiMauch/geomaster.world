"use client";

import { useEffect, useState } from "react";
import { MapContainer, Marker, Popup, useMapEvents, useMap, GeoJSON, Circle, Polyline, ZoomControl } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { getGameTypeConfig, DEFAULT_GAME_TYPE, isImageGameType } from "@/lib/game-types";
import ImageMap from "./ImageMap";

// Hook to detect mobile screen
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return isMobile;
}

// Fix for default markers
const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const targetIcon = L.icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = defaultIcon;

interface MarkerPosition {
  lat: number;
  lng: number;
}

interface HintCircle {
  lat: number;
  lng: number;
  radiusKm: number;
}

interface CountryMapProps {
  gameType?: string;
  country?: string; // Legacy support - will be converted to gameType
  onMarkerPlace?: (position: MarkerPosition) => void;
  markerPosition?: MarkerPosition | null;
  targetPosition?: MarkerPosition | null;
  showTarget?: boolean;
  interactive?: boolean;
  height?: string;
  hintCircle?: HintCircle | null;
}

function MapClickHandler({ onMarkerPlace }: { onMarkerPlace?: (position: MarkerPosition) => void }) {
  useMapEvents({
    click(e) {
      if (onMarkerPlace) {
        onMarkerPlace({ lat: e.latlng.lat, lng: e.latlng.lng });
      }
    },
  });
  return null;
}

// Custom pane for hint circle to ensure it renders above GeoJSON
function HintCirclePane() {
  const map = useMap();
  useEffect(() => {
    if (!map.getPane('hintCirclePane')) {
      const pane = map.createPane('hintCirclePane');
      pane.style.zIndex = '450'; // Above overlayPane (400) but below markers (600)
    }
  }, [map]);
  return null;
}

export default function CountryMap({
  gameType,
  country,
  onMarkerPlace,
  markerPosition,
  targetPosition,
  showTarget = false,
  interactive = true,
  height = "400px",
  hintCircle = null,
}: CountryMapProps) {
  const [mounted, setMounted] = useState(false);
  const [geoData, setGeoData] = useState<GeoJSON.FeatureCollection | null>(null);
  const isMobile = useIsMobile();

  // Determine the effective game type
  const effectiveGameType = gameType ?? (country ? `country:${country}` : DEFAULT_GAME_TYPE);
  const gameTypeConfig = getGameTypeConfig(effectiveGameType);

  const isWorldMap = gameTypeConfig.bounds === null;
  const isImageMap = isImageGameType(effectiveGameType);

  // If this is an image-based map, delegate to ImageMap component
  if (isImageMap) {
    return (
      <ImageMap
        gameType={effectiveGameType}
        onMarkerPlace={onMarkerPlace}
        markerPosition={markerPosition}
        targetPosition={targetPosition}
        showTarget={showTarget}
        interactive={interactive}
        height={height}
      />
    );
  }

  useEffect(() => {
    setMounted(true);
    setGeoData(null); // Reset geoData to ensure fresh load on gameType change
    // Load GeoJSON data for the selected game type
    fetch(gameTypeConfig.geoJsonFile)
      .then((res) => res.json())
      .then((data) => setGeoData(data))
      .catch((err) => console.error("Error loading GeoJSON:", err));
  }, [gameTypeConfig.geoJsonFile]);

  if (!mounted || !geoData) {
    return (
      <div
        className="bg-surface-1 rounded-lg flex items-center justify-center"
        style={{ height }}
      >
        <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Build bounds only for country maps
  const bounds = isWorldMap
    ? undefined
    : L.latLngBounds(
        [gameTypeConfig.bounds!.southWest.lat, gameTypeConfig.bounds!.southWest.lng],
        [gameTypeConfig.bounds!.northEast.lat, gameTypeConfig.bounds!.northEast.lng]
      );

  // Style for country GeoJSON - Dark Gaming Theme
  const geoStyle = {
    color: "#00D9FF",      // Cyan border with glow effect
    weight: isWorldMap ? 1 : 2,
    fillColor: isWorldMap ? "#2E3744" : "#2E3744",  // Dark surface fill
    fillOpacity: isWorldMap ? 0.8 : 1,
  };

  // Reduce zoom by 1 on mobile for better overview
  const mobileZoomOffset = isMobile ? -1 : 0;

  // Map container props
  const mapContainerProps: Record<string, unknown> = {
    center: [gameTypeConfig.defaultCenter.lat, gameTypeConfig.defaultCenter.lng],
    zoom: gameTypeConfig.defaultZoom + mobileZoomOffset,
    style: { height, width: "100%", backgroundColor: "#1A1F26" },
    className: "rounded-lg",
    minZoom: gameTypeConfig.minZoom + mobileZoomOffset,
    zoomControl: false, // We'll add custom positioned zoom control
  };

  // Only add maxBounds for country maps
  if (!isWorldMap && bounds) {
    mapContainerProps.maxBounds = bounds;
    mapContainerProps.maxBoundsViscosity = 1.0;
  }

  return (
    <MapContainer {...mapContainerProps} key={`${effectiveGameType}-${isMobile ? 'mobile' : 'desktop'}`}>
      {/* Zoom controls - positioned bottom left to avoid badge bar */}
      <ZoomControl position="bottomleft" />

      {/* Custom pane for hint circle - must be created before Circle is rendered */}
      <HintCirclePane key="hint-pane" />

      {/* Country border - no TileLayer for clean look */}
      {geoData && (
        <GeoJSON key="geo-json" data={geoData} style={geoStyle} />
      )}

      {/* Hint circle for players with hint enabled */}
      {hintCircle && (
        <Circle
          key="hint-circle"
          center={[hintCircle.lat, hintCircle.lng]}
          radius={hintCircle.radiusKm * 1000}
          pane="hintCirclePane"
          pathOptions={{
            color: "#00D9FF",
            fillColor: "#00D9FF",
            fillOpacity: 0.1,
            weight: 2,
            dashArray: "8, 12",
            interactive: false,
          }}
        />
      )}

      {interactive && <MapClickHandler key="click-handler" onMarkerPlace={onMarkerPlace} />}

      {markerPosition && (
        <Marker key="user-marker" position={[markerPosition.lat, markerPosition.lng]} icon={defaultIcon} />
      )}

      {showTarget && targetPosition && (
        <Marker key="target-marker" position={[targetPosition.lat, targetPosition.lng]} icon={targetIcon}>
          <Popup>Korrekter Ort</Popup>
        </Marker>
      )}

      {/* Connection line between guess and target */}
      {showTarget && markerPosition && targetPosition && (
        <Polyline
          key="connection-line"
          positions={[
            [markerPosition.lat, markerPosition.lng],
            [targetPosition.lat, targetPosition.lng],
          ]}
          pathOptions={{
            color: "#F59E0B",
            weight: 2,
            opacity: 0.8,
            dashArray: "5, 10",
          }}
        />
      )}
    </MapContainer>
  );
}
