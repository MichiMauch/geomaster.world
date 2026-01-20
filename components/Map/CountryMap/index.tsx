"use client";

import { useEffect, useRef } from "react";
import { MapContainer, Marker, Popup, GeoJSON, Circle, Polyline, ZoomControl } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { getGameTypeConfig, DEFAULT_GAME_TYPE, isImageGameType } from "@/lib/game-types";
import ImageMap from "../ImageMap";
import { useIsMobile, useGeoData } from "./hooks";
import { MapClickHandler, HintCirclePane } from "./MapHelpers";
import { defaultIcon, targetIcon, getGeoStyle, getHintCircleStyle, connectionLineStyle, soloMarkerIcon, duelMarkerIcon } from "./constants";
import type { CountryMapProps } from "./types";

// Set default marker icon
L.Marker.prototype.options.icon = defaultIcon;

export default function CountryMap({
  gameType,
  country,
  dynamicCountry,
  dynamicWorldQuiz,
  onMarkerPlace,
  markerPosition,
  targetPosition,
  showTarget = false,
  interactive = true,
  height = "400px",
  hintCircle = null,
  onReady,
  roundId,
  isDuel = false,
}: CountryMapProps) {
  const isMobile = useIsMobile();
  const onReadyCalledRef = useRef(false);

  // For dynamic countries/world quizzes, we use a different approach
  const useDynamicCountry = !!dynamicCountry;
  const useDynamicWorldQuiz = !!dynamicWorldQuiz;

  // Determine the effective game type (only used if not dynamic)
  const effectiveGameType = gameType ?? (country ? `country:${country}` : DEFAULT_GAME_TYPE);
  const gameTypeConfig = (useDynamicCountry || useDynamicWorldQuiz) ? null : getGameTypeConfig(effectiveGameType);

  // World maps: either dynamicWorldQuiz or static config with bounds === null
  const isWorldMap = useDynamicWorldQuiz || (!useDynamicCountry && gameTypeConfig?.bounds === null);
  const isImageMap = (useDynamicCountry || useDynamicWorldQuiz) ? false : isImageGameType(effectiveGameType);

  const { mounted, geoData } = useGeoData({ dynamicCountry, dynamicWorldQuiz, gameTypeConfig });

  // Reset onReady flag when round changes (MUST be defined BEFORE the call effect!)
  useEffect(() => {
    onReadyCalledRef.current = false;
  }, [dynamicCountry?.id, dynamicWorldQuiz?.id, gameType, roundId]);

  // Call onReady when map is fully loaded (only once per round)
  // WICHTIG: roundId muss in den Dependencies sein damit der Effect bei Rundenwechsel läuft!
  useEffect(() => {
    if (mounted && geoData && onReady && !onReadyCalledRef.current) {
      onReadyCalledRef.current = true;
      onReady();
    }
  }, [mounted, geoData, onReady, roundId]);

  // If this is an image-based map, delegate to ImageMap component
  if (isImageMap && gameTypeConfig) {
    return (
      <ImageMap
        gameType={effectiveGameType}
        onMarkerPlace={onMarkerPlace}
        markerPosition={markerPosition}
        targetPosition={targetPosition}
        showTarget={showTarget}
        interactive={interactive}
        height={height}
        onReady={onReady}
      />
    );
  }

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

  // Build bounds - handle both dynamic and static configs
  let bounds: L.LatLngBounds | undefined;
  if (useDynamicCountry && dynamicCountry!.boundsNorth !== null && dynamicCountry!.boundsSouth !== null &&
      dynamicCountry!.boundsEast !== null && dynamicCountry!.boundsWest !== null) {
    bounds = L.latLngBounds(
      [dynamicCountry!.boundsSouth, dynamicCountry!.boundsWest],
      [dynamicCountry!.boundsNorth, dynamicCountry!.boundsEast]
    );
  } else if (!isWorldMap && gameTypeConfig?.bounds) {
    bounds = L.latLngBounds(
      [gameTypeConfig.bounds.southWest.lat, gameTypeConfig.bounds.southWest.lng],
      [gameTypeConfig.bounds.northEast.lat, gameTypeConfig.bounds.northEast.lng]
    );
  }

  // Reduce zoom by 1 on mobile for better overview
  const mobileZoomOffset = isMobile ? -1 : 0;

  // Determine center and zoom
  const center: [number, number] = useDynamicWorldQuiz
    ? [dynamicWorldQuiz!.centerLat, dynamicWorldQuiz!.centerLng]
    : useDynamicCountry
      ? [dynamicCountry!.centerLat, dynamicCountry!.centerLng]
      : [gameTypeConfig!.defaultCenter.lat, gameTypeConfig!.defaultCenter.lng];

  const zoom = useDynamicWorldQuiz
    ? dynamicWorldQuiz!.defaultZoom + mobileZoomOffset
    : useDynamicCountry
      ? dynamicCountry!.defaultZoom + mobileZoomOffset
      : gameTypeConfig!.defaultZoom + mobileZoomOffset;

  const minZoom = useDynamicWorldQuiz
    ? dynamicWorldQuiz!.minZoom + mobileZoomOffset
    : useDynamicCountry
      ? dynamicCountry!.minZoom + mobileZoomOffset
      : gameTypeConfig!.minZoom + mobileZoomOffset;

  // Custom cursor class for interactive maps (overrides Leaflet's grab cursor)
  const cursorClass = interactive
    ? isDuel ? "leaflet-cursor-duel" : "leaflet-cursor-solo"
    : "";

  // Map container props
  const mapContainerProps: Record<string, unknown> = {
    center,
    zoom,
    style: { height, width: "100%", backgroundColor: "transparent" },
    className: `rounded-lg ${cursorClass}`,
    minZoom,
    zoomControl: false,
  };

  // Only add maxBounds for country maps
  if (bounds) {
    mapContainerProps.maxBounds = bounds;
    mapContainerProps.maxBoundsViscosity = 1.0;
  }

  // Create a unique key for the map container
  const mapKey = useDynamicCountry
    ? `dynamic-${dynamicCountry!.id}-${isMobile ? "mobile" : "desktop"}`
    : `${effectiveGameType}-${isMobile ? "mobile" : "desktop"}`;

  return (
    <MapContainer {...mapContainerProps} key={mapKey}>
      <ZoomControl key="zoom-control" position="bottomleft" />
      <HintCirclePane key="hint-pane" />

      {geoData && (
        <GeoJSON key="geo-json" data={geoData} style={getGeoStyle(isWorldMap, isDuel)} />
      )}

      {hintCircle && (
        <Circle
          key="hint-circle"
          center={[hintCircle.lat, hintCircle.lng]}
          radius={hintCircle.radiusKm * 1000}
          pane="hintCirclePane"
          pathOptions={getHintCircleStyle(isDuel)}
        />
      )}

      {interactive && <MapClickHandler key="click-handler" onMarkerPlace={onMarkerPlace} />}

      {markerPosition && (
        <Marker key="user-marker" position={[markerPosition.lat, markerPosition.lng]} icon={isDuel ? duelMarkerIcon : soloMarkerIcon} />
      )}

      {showTarget && targetPosition && (
        <Marker key="target-marker" position={[targetPosition.lat, targetPosition.lng]} icon={targetIcon}>
          <Popup>Korrekter Ort</Popup>
        </Marker>
      )}

      {showTarget && markerPosition && targetPosition && (
        <Polyline
          key="connection-line"
          positions={[
            [markerPosition.lat, markerPosition.lng],
            [targetPosition.lat, targetPosition.lng],
          ]}
          pathOptions={connectionLineStyle}
        />
      )}
    </MapContainer>
  );
}

// Re-export types
export type { CountryMapProps, MarkerPosition, HintCircle, DynamicCountryConfig, DynamicWorldQuizConfig } from "./types";
