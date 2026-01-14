"use client";

import { useEffect, useState, useMemo } from "react";
import dynamic from "next/dynamic";

// Dynamically import map components to avoid SSR issues
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
const GeoJSON = dynamic(
  () => import("react-leaflet").then((mod) => mod.GeoJSON),
  { ssr: false }
);

interface GeoJSONPreviewProps {
  /** GeoJSON data as string or parsed object */
  geoJsonData?: string | GeoJSON.FeatureCollection | null;
  /** Country ID for fetching from API (used in table view) */
  countryId?: string;
  /** Height of the preview map */
  height?: string;
  /** Custom class name */
  className?: string;
}

// Style for GeoJSON rendering
const geoStyle = {
  fillColor: "#00D9FF",
  fillOpacity: 0.2,
  color: "#00D9FF",
  weight: 2,
  opacity: 0.8,
};

export function GeoJSONPreview({
  geoJsonData,
  countryId,
  height = "250px",
  className = "",
}: GeoJSONPreviewProps) {
  const [mounted, setMounted] = useState(false);
  const [fetchedData, setFetchedData] = useState<GeoJSON.FeatureCollection | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch GeoJSON from API if countryId is provided and no direct data
  useEffect(() => {
    if (countryId && !geoJsonData) {
      setLoading(true);
      setError(null);
      fetch(`/api/countries/${countryId}/geojson`)
        .then((res) => {
          if (!res.ok) throw new Error("GeoJSON nicht verfügbar");
          return res.json();
        })
        .then((data) => {
          setFetchedData(data);
          setLoading(false);
        })
        .catch((err) => {
          setError(err.message);
          setLoading(false);
        });
    }
  }, [countryId, geoJsonData]);

  // Parse GeoJSON data
  const parsedGeoJson = useMemo<GeoJSON.FeatureCollection | null>(() => {
    if (typeof geoJsonData === "string" && geoJsonData) {
      try {
        return JSON.parse(geoJsonData);
      } catch {
        return null;
      }
    }
    if (geoJsonData && typeof geoJsonData === "object") {
      return geoJsonData;
    }
    return fetchedData;
  }, [geoJsonData, fetchedData]);

  // Calculate bounds from GeoJSON
  const bounds = useMemo(() => {
    if (!parsedGeoJson) return null;

    const coords: [number, number][] = [];

    const extractCoords = (obj: unknown): void => {
      if (Array.isArray(obj)) {
        if (obj.length >= 2 && typeof obj[0] === "number" && typeof obj[1] === "number") {
          coords.push([obj[1], obj[0]]); // [lat, lng] for Leaflet
        } else {
          obj.forEach(extractCoords);
        }
      } else if (obj && typeof obj === "object") {
        Object.values(obj).forEach(extractCoords);
      }
    };

    extractCoords(parsedGeoJson);

    if (coords.length === 0) return null;

    let minLat = Infinity, maxLat = -Infinity;
    let minLng = Infinity, maxLng = -Infinity;

    for (const [lat, lng] of coords) {
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
      minLng = Math.min(minLng, lng);
      maxLng = Math.max(maxLng, lng);
    }

    return {
      center: [(minLat + maxLat) / 2, (minLng + maxLng) / 2] as [number, number],
      bounds: [[minLat, minLng], [maxLat, maxLng]] as [[number, number], [number, number]],
    };
  }, [parsedGeoJson]);

  // Loading state
  if (!mounted || loading) {
    return (
      <div
        className={`bg-surface-1 rounded-lg flex items-center justify-center ${className}`}
        style={{ height }}
      >
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div
        className={`bg-surface-1 rounded-lg flex items-center justify-center ${className}`}
        style={{ height }}
      >
        <p className="text-text-muted text-sm">{error}</p>
      </div>
    );
  }

  // No data state
  if (!parsedGeoJson || !bounds) {
    return (
      <div
        className={`bg-surface-1 rounded-lg flex items-center justify-center border border-dashed border-glass-border ${className}`}
        style={{ height }}
      >
        <p className="text-text-muted text-sm">Keine Vorschau verfügbar</p>
      </div>
    );
  }

  return (
    <div className={`rounded-lg overflow-hidden ${className}`} style={{ height }}>
      <MapContainer
        center={bounds.center}
        bounds={bounds.bounds}
        style={{ height: "100%", width: "100%", backgroundColor: "#1A1F26" }}
        zoomControl={false}
        dragging={false}
        scrollWheelZoom={false}
        doubleClickZoom={false}
        touchZoom={false}
        attributionControl={false}
      >
        <GeoJSON
          key={JSON.stringify(parsedGeoJson).slice(0, 100)}
          data={parsedGeoJson}
          style={geoStyle}
        />
      </MapContainer>
    </div>
  );
}
