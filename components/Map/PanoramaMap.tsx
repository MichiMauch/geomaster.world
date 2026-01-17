"use client";

import { useEffect, useState, useRef } from "react";
import { MapContainer, Marker, Popup, useMapEvents, GeoJSON, Polyline, ZoomControl, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Viewer } from "mapillary-js";
import "mapillary-js/dist/mapillary.css";
import { logger } from "@/lib/logger";

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

interface MarkerPosition {
  lat: number;
  lng: number;
}

interface PanoramaMapProps {
  mapillaryImageKey: string;
  heading?: number;
  pitch?: number;
  onMarkerPlace?: (position: MarkerPosition) => void;
  markerPosition?: MarkerPosition | null;
  targetPosition?: MarkerPosition | null;
  showTarget?: boolean;
  interactive?: boolean;
  height?: string;
  onReady?: () => void;
  roundId?: string; // Unique ID per round to trigger onReady reset
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

// Hook to detect mobile screen
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return isMobile;
}

// Component to fit bounds when showing results
function FitBoundsOnResult({
  markerPosition,
  targetPosition,
  showTarget
}: {
  markerPosition: MarkerPosition | null | undefined;
  targetPosition: MarkerPosition | null | undefined;
  showTarget: boolean;
}) {
  const map = useMap();

  useEffect(() => {
    if (showTarget && markerPosition && targetPosition) {
      const bounds = L.latLngBounds([
        [markerPosition.lat, markerPosition.lng],
        [targetPosition.lat, targetPosition.lng],
      ]);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 10 });
    }
  }, [map, showTarget, markerPosition, targetPosition]);

  return null;
}

export default function PanoramaMap({
  mapillaryImageKey,
  heading,
  pitch,
  onMarkerPlace,
  markerPosition,
  targetPosition,
  showTarget = false,
  interactive = true,
  height = "100%",
  onReady,
  roundId,
}: PanoramaMapProps) {
  const [mounted, setMounted] = useState(false);
  const [geoData, setGeoData] = useState<GeoJSON.FeatureCollection | null>(null);
  const [viewerReady, setViewerReady] = useState(false);
  const viewerContainerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Viewer | null>(null);
  const currentImageKeyRef = useRef<string | null>(null);
  const onReadyCalledRef = useRef(false);
  const isMobile = useIsMobile();

  // Initialize component
  useEffect(() => {
    setMounted(true);

    // Load world GeoJSON
    fetch("/world.geojson")
      .then((res) => res.json())
      .then((data) => setGeoData(data))
      .catch((err) => logger.error("Error loading GeoJSON", err));
  }, []);

  // Initialize Mapillary viewer
  useEffect(() => {
    if (!mounted || !viewerContainerRef.current || viewerRef.current) return;

    const accessToken = process.env.NEXT_PUBLIC_MAPILLARY_ACCESS_TOKEN;
    if (!accessToken) {
      logger.error("Mapillary access token not configured");
      return;
    }

    const viewer = new Viewer({
      accessToken,
      container: viewerContainerRef.current,
      imageId: mapillaryImageKey,
      component: {
        // Enable navigation for movement
        sequence: true,
        direction: true,
        // Disable cover (auto-start)
        cover: false,
        // Disable attribution for cleaner look (optional)
        attribution: true,
      },
    });

    viewerRef.current = viewer;
    currentImageKeyRef.current = mapillaryImageKey;

    // Set viewerReady when image loads
    viewer.on("image", () => {
      setViewerReady(true);
      // Set initial camera position if provided
      if (heading !== undefined || pitch !== undefined) {
        // Mapillary uses bearing (0-360) and tilt (-90 to 90)
        const bearing = heading ?? 0;
        const tilt = pitch ?? 0;
        viewer.setCenter([0.5, 0.5]); // Center
        // Note: setBearing and setTilt may need to be called after image loads
      }
    });

    return () => {
      if (viewerRef.current) {
        viewerRef.current.remove();
        viewerRef.current = null;
      }
    };
  }, [mounted, mapillaryImageKey, heading, pitch]);

  // Update image when mapillaryImageKey changes (only if different from current)
  useEffect(() => {
    if (viewerRef.current && mapillaryImageKey && currentImageKeyRef.current !== mapillaryImageKey) {
      currentImageKeyRef.current = mapillaryImageKey;
      setViewerReady(false); // Reset viewer ready state for new image
      viewerRef.current.moveTo(mapillaryImageKey).catch((err) => {
        logger.error("Error moving to image", err);
      });
    }
  }, [mapillaryImageKey]);

  // Reset onReady flag when image key or round changes (MUST be defined BEFORE the call effect!)
  useEffect(() => {
    onReadyCalledRef.current = false;
  }, [mapillaryImageKey, roundId]);

  // Call onReady when both geoData is loaded and viewer is ready (only once per round)
  // WICHTIG: roundId muss in den Dependencies sein damit der Effect bei Rundenwechsel läuft!
  useEffect(() => {
    if (mounted && geoData && viewerReady && onReady && !onReadyCalledRef.current) {
      onReadyCalledRef.current = true;
      onReady();
    }
  }, [mounted, geoData, viewerReady, onReady, roundId]);

  if (!mounted) {
    return (
      <div
        className="bg-surface-1 rounded-lg flex items-center justify-center"
        style={{ height }}
      >
        <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Style for world GeoJSON
  const geoStyle = {
    color: "#00D9FF",
    weight: 1,
    fillColor: "#2E3744",
    fillOpacity: 0.8,
  };

  // Mobile: Stack vertically, Desktop: Side by side
  const containerClass = isMobile
    ? "flex flex-col"
    : "flex flex-row";

  const panelClass = isMobile
    ? "h-1/2"
    : "w-1/2 h-full";

  return (
    <div className={containerClass} style={{ height, width: "100%" }}>
      {/* Left: Mapillary Panorama Viewer */}
      <div className={`${panelClass} relative`}>
        <div
          ref={viewerContainerRef}
          className="w-full h-full bg-black"
          style={{ minHeight: "200px" }}
        />
        {/* Loading overlay if no access token */}
        {!process.env.NEXT_PUBLIC_MAPILLARY_ACCESS_TOKEN && (
          <div className="absolute inset-0 bg-surface-1 flex items-center justify-center">
            <div className="text-center text-text-muted">
              <p className="text-lg font-semibold">Mapillary nicht konfiguriert</p>
              <p className="text-sm mt-2">NEXT_PUBLIC_MAPILLARY_ACCESS_TOKEN fehlt</p>
            </div>
          </div>
        )}
      </div>

      {/* Right: Leaflet World Map for guessing */}
      <div className={panelClass}>
        {geoData ? (
          <MapContainer
            key={`panorama-map-${isMobile ? 'mobile' : 'desktop'}`}
            center={[20, 0]}
            zoom={isMobile ? 1 : 2}
            minZoom={1}
            style={{ height: "100%", width: "100%", backgroundColor: "transparent" }}
            zoomControl={false}
            worldCopyJump={true}
          >
            <ZoomControl position="bottomleft" />

            {/* World map background */}
            <GeoJSON data={geoData} style={geoStyle} />

            {/* Click handler for marker placement */}
            {interactive && <MapClickHandler onMarkerPlace={onMarkerPlace} />}

            {/* User's guess marker */}
            {markerPosition && (
              <Marker position={[markerPosition.lat, markerPosition.lng]} icon={defaultIcon}>
                <Popup>Dein Tipp</Popup>
              </Marker>
            )}

            {/* Target marker (shown after guess) */}
            {showTarget && targetPosition && (
              <Marker position={[targetPosition.lat, targetPosition.lng]} icon={targetIcon}>
                <Popup>Korrekter Ort</Popup>
              </Marker>
            )}

            {/* Connection line between guess and target */}
            {showTarget && markerPosition && targetPosition && (
              <Polyline
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

            {/* Auto-fit bounds when showing result */}
            <FitBoundsOnResult
              markerPosition={markerPosition}
              targetPosition={targetPosition}
              showTarget={showTarget}
            />
          </MapContainer>
        ) : (
          <div className="w-full h-full bg-surface-1 flex items-center justify-center">
            <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
}
