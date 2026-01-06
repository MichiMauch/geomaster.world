"use client";

import dynamic from "next/dynamic";

// Dynamic import to avoid SSR issues with Leaflet
export const CountryMap = dynamic(() => import("./CountryMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] bg-surface-1 rounded-lg flex items-center justify-center">
      <span className="text-text-muted">Karte wird geladen...</span>
    </div>
  ),
});

// Legacy alias for backwards compatibility
const SwitzerlandMap = CountryMap;

export const SummaryMap = dynamic(() => import("./SummaryMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[300px] bg-surface-1 rounded-lg flex items-center justify-center">
      <span className="text-text-muted">Karte wird geladen...</span>
    </div>
  ),
});

export const PanoramaMap = dynamic(() => import("./PanoramaMap"), {
  ssr: false,
  loading: () => (
    <div className="h-full bg-surface-1 flex items-center justify-center">
      <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  ),
});

export default SwitzerlandMap;
