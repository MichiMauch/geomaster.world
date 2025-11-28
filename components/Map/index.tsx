"use client";

import dynamic from "next/dynamic";

// Dynamic import to avoid SSR issues with Leaflet
const SwitzerlandMap = dynamic(() => import("./SwitzerlandMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] bg-gray-100 rounded-lg flex items-center justify-center">
      <span className="text-gray-500">Karte wird geladen...</span>
    </div>
  ),
});

export default SwitzerlandMap;
