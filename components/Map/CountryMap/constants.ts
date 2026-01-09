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

// Style for country GeoJSON - Dark Gaming Theme
export const getGeoStyle = (isWorldMap: boolean) => ({
  color: "#00D9FF", // Cyan border with glow effect
  weight: isWorldMap ? 1 : 2,
  fillColor: "#2E3744", // Dark surface fill
  fillOpacity: isWorldMap ? 0.8 : 1,
});

// Hint circle style
export const hintCircleStyle = {
  color: "#00D9FF",
  fillColor: "#00D9FF",
  fillOpacity: 0.1,
  weight: 2,
  dashArray: "8, 12",
  interactive: false,
};

// Connection line style
export const connectionLineStyle = {
  color: "#F59E0B",
  weight: 2,
  opacity: 0.8,
  dashArray: "5, 10",
};
