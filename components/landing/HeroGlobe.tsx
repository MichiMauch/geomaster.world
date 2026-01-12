"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

// Dynamically import Globe to avoid SSR issues (three.js doesn't work on server)
const Globe = dynamic(() => import("react-globe.gl"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>
  ),
});

// Connection routes between cities (with glow layer)
const ARC_ROUTES = [
  // Transatlantic
  { startLat: 51.5, startLng: -0.1, endLat: 40.7, endLng: -74.0 },   // London-NYC
  { startLat: 48.9, startLng: 2.3, endLat: -23.5, endLng: -46.6 },   // Paris-São Paulo
  { startLat: 52.5, startLng: 13.4, endLat: 34.0, endLng: -118.2 },  // Berlin-LA
  { startLat: 40.4, startLng: -3.7, endLat: 19.4, endLng: -99.1 },   // Madrid-Mexico City
  // Europe-Asia
  { startLat: 48.9, startLng: 2.3, endLat: 35.7, endLng: 139.7 },    // Paris-Tokyo
  { startLat: 51.5, startLng: -0.1, endLat: 25.3, endLng: 55.3 },    // London-Dubai
  { startLat: 55.8, startLng: 37.6, endLat: 39.9, endLng: 116.4 },   // Moscow-Beijing
  { startLat: 52.5, startLng: 13.4, endLat: 1.3, endLng: 103.8 },    // Berlin-Singapore
  // Asia-Pacific
  { startLat: 35.7, startLng: 139.7, endLat: -33.9, endLng: 151.2 }, // Tokyo-Sydney
  { startLat: 37.6, startLng: 127.0, endLat: 1.3, endLng: 103.8 },   // Seoul-Singapore
  { startLat: 22.3, startLng: 114.2, endLat: -37.8, endLng: 144.9 }, // Hong Kong-Melbourne
  { startLat: 31.2, startLng: 121.5, endLat: 13.8, endLng: 100.5 },  // Shanghai-Bangkok
  // Americas
  { startLat: 40.7, startLng: -74.0, endLat: 34.0, endLng: -118.2 }, // NYC-LA
  { startLat: 43.7, startLng: -79.4, endLat: 49.3, endLng: -123.1 }, // Toronto-Vancouver
  { startLat: -23.5, startLng: -46.6, endLat: -34.6, endLng: -58.4 },// São Paulo-Buenos Aires
  // Africa/Middle East
  { startLat: 25.3, startLng: 55.3, endLat: 28.6, endLng: 77.2 },    // Dubai-Delhi
  { startLat: 30.0, startLng: 31.2, endLat: -1.3, endLng: 36.8 },    // Cairo-Nairobi
  { startLat: 6.5, startLng: 3.4, endLat: -33.9, endLng: 18.4 },     // Lagos-Cape Town
  // Trans-Pacific
  { startLat: 34.0, startLng: -118.2, endLat: 35.7, endLng: 139.7 }, // LA-Tokyo
  { startLat: 49.3, startLng: -123.1, endLat: 22.3, endLng: 114.2 }, // Vancouver-Hong Kong
];

// Arc colors from styleguide
const ARC_COLORS = ["#00D9FF", "#00FF88", "#FFD700"]; // Cyan, Green, Gold

// Create arcs with glow effect and colors
const ARCS = [
  // Glow layer (thicker, more transparent)
  ...ARC_ROUTES.map((arc, i) => ({ ...arc, layer: "glow", color: ARC_COLORS[i % ARC_COLORS.length] })),
  // Core layer (thinner, brighter)
  ...ARC_ROUTES.map((arc, i) => ({ ...arc, layer: "core", color: ARC_COLORS[i % ARC_COLORS.length] })),
];

// Cities data for markers
const CITIES = [
  // Europe
  { name: "London", lat: 51.5, lng: -0.1 },
  { name: "Paris", lat: 48.9, lng: 2.3 },
  { name: "Berlin", lat: 52.5, lng: 13.4 },
  { name: "Rome", lat: 41.9, lng: 12.5 },
  { name: "Madrid", lat: 40.4, lng: -3.7 },
  { name: "Stockholm", lat: 59.3, lng: 18.1 },
  { name: "Vienna", lat: 48.2, lng: 16.4 },
  { name: "Amsterdam", lat: 52.4, lng: 4.9 },
  { name: "Moscow", lat: 55.8, lng: 37.6 },
  // Americas
  { name: "New York", lat: 40.7, lng: -74.0 },
  { name: "Los Angeles", lat: 34.0, lng: -118.2 },
  { name: "Chicago", lat: 41.9, lng: -87.6 },
  { name: "Miami", lat: 25.8, lng: -80.2 },
  { name: "Toronto", lat: 43.7, lng: -79.4 },
  { name: "Mexico City", lat: 19.4, lng: -99.1 },
  { name: "São Paulo", lat: -23.5, lng: -46.6 },
  { name: "Buenos Aires", lat: -34.6, lng: -58.4 },
  { name: "Vancouver", lat: 49.3, lng: -123.1 },
  // Asia
  { name: "Tokyo", lat: 35.7, lng: 139.7 },
  { name: "Beijing", lat: 39.9, lng: 116.4 },
  { name: "Shanghai", lat: 31.2, lng: 121.5 },
  { name: "Hong Kong", lat: 22.3, lng: 114.2 },
  { name: "Singapore", lat: 1.3, lng: 103.8 },
  { name: "Seoul", lat: 37.6, lng: 127.0 },
  { name: "Mumbai", lat: 19.1, lng: 72.9 },
  { name: "Delhi", lat: 28.6, lng: 77.2 },
  { name: "Dubai", lat: 25.3, lng: 55.3 },
  { name: "Bangkok", lat: 13.8, lng: 100.5 },
  // Africa & Oceania
  { name: "Cairo", lat: 30.0, lng: 31.2 },
  { name: "Lagos", lat: 6.5, lng: 3.4 },
  { name: "Nairobi", lat: -1.3, lng: 36.8 },
  { name: "Cape Town", lat: -33.9, lng: 18.4 },
  { name: "Sydney", lat: -33.9, lng: 151.2 },
  { name: "Melbourne", lat: -37.8, lng: 144.9 },
  { name: "Auckland", lat: -36.8, lng: 174.8 },
];

interface HeroGlobeProps {
  className?: string;
}

// Arc data type for callbacks
interface ArcData {
  layer: string;
  color: string;
}

export default function HeroGlobe({ className }: HeroGlobeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const globeRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cloudsGlobeRef = useRef<any>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isClient, setIsClient] = useState(false);
  const [globeReady, setGlobeReady] = useState(false);
  const [cloudsReady, setCloudsReady] = useState(false);

  // Handle client-side mounting
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Handle responsive sizing
  useEffect(() => {
    if (!containerRef.current) return;

    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setDimensions({ width, height });
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);

    return () => window.removeEventListener("resize", updateDimensions);
  }, [isClient]);

  // Enable auto-rotation after globe is ready
  useEffect(() => {
    if (!globeReady || !globeRef.current) return;

    // Set initial view to Europe (lat ~50, lng ~10)
    globeRef.current.pointOfView({ lat: 50, lng: 10, altitude: 1.8 }, 0);

    // Set up auto-rotation
    const controls = globeRef.current.controls();
    if (controls) {
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.5;
      controls.enableZoom = false;
    }

    // Animation loop to keep rotation going
    let animationId: number;
    const animate = () => {
      if (controls) {
        controls.update();
      }
      animationId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [globeReady]);

  // Enable auto-rotation for clouds (slightly faster for parallax effect)
  useEffect(() => {
    if (!cloudsReady || !cloudsGlobeRef.current) return;

    // Set initial view to match main globe (Europe)
    cloudsGlobeRef.current.pointOfView({ lat: 50, lng: 10, altitude: 1.8 }, 0);

    const controls = cloudsGlobeRef.current.controls();
    if (controls) {
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.3; // Slower than earth for realistic drift
      controls.enableZoom = false;
      controls.enableRotate = false; // Disable user interaction on clouds
      controls.enablePan = false;
    }

    let animationId: number;
    const animate = () => {
      if (controls) {
        controls.update();
      }
      animationId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [cloudsReady]);

  if (!isClient) {
    return (
      <div ref={containerRef} className={className}>
        <div className="w-full h-full flex items-center justify-center">
          <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`${className} relative`}>
      {/* Main Earth Globe */}
      {dimensions.width > 0 && dimensions.height > 0 && (
        <Globe
          ref={globeRef}
          onGlobeReady={() => setGlobeReady(true)}
          // Globe appearance - custom night lights texture
          globeImageUrl="/images/earth-night-lights.webp"
          backgroundColor="rgba(0,0,0,0)"
          atmosphereColor="#00D9FF"
          atmosphereAltitude={0.15}
          // Interaction
          enablePointerInteraction={false}
          // Size
          width={dimensions.width}
          height={dimensions.height}
          // Animated rings (pulse effect)
          ringsData={CITIES}
          ringLat="lat"
          ringLng="lng"
          ringColor={() => "#FF6B35"}
          ringMaxRadius={8}
          ringPropagationSpeed={3}
          ringRepeatPeriod={1500}
          // Points at city centers
          pointsData={CITIES}
          pointLat="lat"
          pointLng="lng"
          pointColor={() => "#FF6B35"}
          pointRadius={0.8}
          pointAltitude={0.02}
          // Animated connection lines with glow
          arcsData={ARCS}
          arcColor={(d: ArcData) => {
            if (d.layer === "glow") {
              // Convert hex to rgba with 0.5 opacity for glow
              const hex = d.color || "#00D9FF";
              const r = parseInt(hex.slice(1, 3), 16);
              const g = parseInt(hex.slice(3, 5), 16);
              const b = parseInt(hex.slice(5, 7), 16);
              return `rgba(${r}, ${g}, ${b}, 0.5)`;
            }
            return d.color || "#00D9FF";
          }}
          arcStroke={(d: ArcData) => d.layer === "glow" ? 2 : 0.8}
          arcAltitude={0.15}
          arcDashLength={1}
          arcDashGap={1}
          arcDashInitialGap={() => Math.random()}
          arcDashAnimateTime={4000}
        />
      )}

      {/* Clouds Layer - overlaid globe with cloud texture */}
      {dimensions.width > 0 && dimensions.height > 0 && globeReady && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            transform: "scale(1.02)", // Slightly larger to appear above earth
            opacity: 0.5,
            mixBlendMode: "screen", // Makes black background transparent
          }}
        >
          <Globe
            ref={cloudsGlobeRef}
            onGlobeReady={() => setCloudsReady(true)}
            globeImageUrl="/images/earth-clouds.png"
            backgroundColor="rgba(0,0,0,0)"
            showAtmosphere={false}
            enablePointerInteraction={false}
            width={dimensions.width}
            height={dimensions.height}
          />
        </div>
      )}

    </div>
  );
}
