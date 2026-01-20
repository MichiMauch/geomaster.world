import L from "leaflet";

// Fix for default markers
export const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export const targetIcon = L.icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Colors for different modes
const COLORS = {
  solo: "#00D9FF", // Cyan
  duel: "#FF6B35", // Orange/Accent
};

// Style for country GeoJSON - Dark Gaming Theme
export const getGeoStyle = (isWorldMap: boolean, isDuel: boolean = false) => ({
  color: isDuel ? COLORS.duel : COLORS.solo,
  weight: isWorldMap ? 1 : 2,
  fillColor: "#2E3744", // Dark surface fill
  fillOpacity: isWorldMap ? 0.8 : 1,
});

// Hint circle style
export const getHintCircleStyle = (isDuel: boolean = false) => ({
  color: isDuel ? COLORS.duel : COLORS.solo,
  fillColor: isDuel ? COLORS.duel : COLORS.solo,
  fillOpacity: 0.1,
  weight: 2,
  dashArray: "8, 12",
  interactive: false,
});

// Legacy export for backwards compatibility
export const hintCircleStyle = getHintCircleStyle(false);

// Connection line style
export const connectionLineStyle = {
  color: "#F59E0B",
  weight: 2,
  opacity: 0.8,
  dashArray: "5, 10",
};

// Crosshair SVG als Data-URL Generator
const createCrosshairIcon = (color: string) => {
  const svg = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="${color}">
    <path d="m12 22c-5.514 0-10-4.486-10-10s4.486-10 10-10 10 4.486 10 10-4.486 10-10 10zm0-18.5c-4.687 0-8.5 3.813-8.5 8.5s3.813 8.5 8.5 8.5 8.5-3.813 8.5-8.5-3.813-8.5-8.5-8.5z"/>
    <path d="m12 5c-.414 0-.75-.336-.75-.75v-3.5c0-.414.336-.75.75-.75s.75.336.75.75v3.5c0 .414-.336.75-.75.75z"/>
    <path d="m23.25 12.75h-3.5c-.414 0-.75-.336-.75-.75s.336-.75.75-.75h3.5c.414 0 .75.336.75.75s-.336.75-.75.75z"/>
    <path d="m12 24c-.414 0-.75-.336-.75-.75v-3.5c0-.414.336-.75.75-.75s.75.336.75.75v3.5c0 .414-.336.75-.75.75z"/>
    <path d="m4.25 12.75h-3.5c-.414 0-.75-.336-.75-.75s.336-.75.75-.75h3.5c.414 0 .75.336.75.75s-.336.75-.75.75z"/>
    <path d="m12 15c-1.654 0-3-1.346-3-3s1.346-3 3-3 3 1.346 3 3-1.346 3-3 3zm0-4.5c-.827 0-1.5.673-1.5 1.5s.673 1.5 1.5 1.5 1.5-.673 1.5-1.5-.673-1.5-1.5-1.5z"/>
  </svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
};

// Dynamisches Marker-Icon basierend auf Modus
export const getMarkerIcon = (isDuel: boolean = false) => L.icon({
  iconUrl: createCrosshairIcon(isDuel ? COLORS.duel : COLORS.solo),
  iconSize: [32, 32],
  iconAnchor: [16, 16], // Zentriert (Mitte des Fadenkreuzes)
  popupAnchor: [0, -16],
});

// Vorberechnete Icons für Performance
export const soloMarkerIcon = getMarkerIcon(false);
export const duelMarkerIcon = getMarkerIcon(true);
