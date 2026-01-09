"use client";

import { useEffect } from "react";
import { useMapEvents, useMap } from "react-leaflet";
import type { MarkerPosition } from "./types";

interface MapClickHandlerProps {
  onMarkerPlace?: (position: MarkerPosition) => void;
}

export function MapClickHandler({ onMarkerPlace }: MapClickHandlerProps) {
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
export function HintCirclePane() {
  const map = useMap();
  useEffect(() => {
    if (!map.getPane("hintCirclePane")) {
      const pane = map.createPane("hintCirclePane");
      pane.style.zIndex = "450"; // Above overlayPane (400) but below markers (600)
    }
  }, [map]);
  return null;
}
