"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface Point {
  id: string;
  x: number; // percentage (0-100)
  y: number; // percentage (0-100)
  delay: number; // animation delay in ms
  duration: number; // pulse duration in ms
}

interface Connection {
  from: Point;
  to: Point;
  startTime: number;
  duration: number;
}

export default function MissionControlBackground() {
  const [points, setPoints] = useState<Point[]>([]);
  const [isClient, setIsClient] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const connectionsRef = useRef<Connection[]>([]);
  const animationFrameRef = useRef<number | null>(null);

  // Initialize points on client mount (avoid hydration mismatch)
  useEffect(() => {
    setIsClient(true);

    const numPoints = Math.floor(Math.random() * 11) + 15; // 15-25 points
    const generatedPoints: Point[] = [];

    for (let i = 0; i < numPoints; i++) {
      generatedPoints.push({
        id: `point-${i}`,
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: Math.random() * 3000,
        duration: 2000 + Math.random() * 2000, // 2-4s
      });
    }

    setPoints(generatedPoints);

    // Create initial connections (5-8 connections)
    const numConnections = Math.floor(Math.random() * 4) + 5;
    const initialConnections: Connection[] = [];

    for (let i = 0; i < numConnections; i++) {
      const fromIdx = Math.floor(Math.random() * generatedPoints.length);
      let toIdx = Math.floor(Math.random() * generatedPoints.length);

      // Ensure different points
      while (toIdx === fromIdx && generatedPoints.length > 1) {
        toIdx = Math.floor(Math.random() * generatedPoints.length);
      }

      initialConnections.push({
        from: generatedPoints[fromIdx],
        to: generatedPoints[toIdx],
        startTime: Date.now() + Math.random() * 2000,
        duration: 3000 + Math.random() * 2000, // 3-5s draw duration
      });
    }

    connectionsRef.current = initialConnections;
  }, []);

  // Canvas animation loop for drawing lines
  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || points.length === 0) {
      return; // Just return without scheduling another frame
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const now = Date.now();

    connectionsRef.current.forEach((conn, index) => {
      if (now < conn.startTime) return;

      const elapsed = now - conn.startTime;
      const progress = Math.min(elapsed / conn.duration, 1);

      const fromX = (conn.from.x / 100) * canvas.width;
      const fromY = (conn.from.y / 100) * canvas.height;
      const toX = (conn.to.x / 100) * canvas.width;
      const toY = (conn.to.y / 100) * canvas.height;

      const currentX = fromX + (toX - fromX) * progress;
      const currentY = fromY + (toY - fromY) * progress;

      // Draw gradient line
      const gradient = ctx.createLinearGradient(fromX, fromY, currentX, currentY);
      gradient.addColorStop(0, "rgba(0, 217, 255, 0.1)");
      gradient.addColorStop(1, "rgba(0, 217, 255, 0.4)");

      ctx.strokeStyle = gradient;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(fromX, fromY);
      ctx.lineTo(currentX, currentY);
      ctx.stroke();

      // Draw small glow at the drawing tip
      if (progress < 1) {
        ctx.beginPath();
        ctx.arc(currentX, currentY, 3, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(0, 217, 255, 0.6)";
        ctx.fill();
      }

      // If complete + fade delay, regenerate connection
      if (progress >= 1 && now > conn.startTime + conn.duration + 2000) {
        const fromIdx = Math.floor(Math.random() * points.length);
        let toIdx = Math.floor(Math.random() * points.length);

        while (toIdx === fromIdx && points.length > 1) {
          toIdx = Math.floor(Math.random() * points.length);
        }

        connectionsRef.current[index] = {
          from: points[fromIdx],
          to: points[toIdx],
          startTime: now + Math.random() * 1000,
          duration: 3000 + Math.random() * 2000,
        };
      }
    });

    // eslint-disable-next-line react-hooks/immutability
    animationFrameRef.current = requestAnimationFrame(animate);
  }, [points]);

  // Set up canvas and animation loop
  useEffect(() => {
    if (!isClient) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas size
    const resizeCanvas = () => {
      if (canvas) {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
      }
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Start animation loop
    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isClient, animate]);

  // Don't render until client-side initialization
  if (!isClient || points.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Canvas for lines */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ opacity: 0.8 }}
      />

      {/* Pulsating points */}
      {points.map((point) => (
        <div
          key={point.id}
          className="absolute mission-control-point"
          style={{
            left: `${point.x}%`,
            top: `${point.y}%`,
            animationDelay: `${point.delay}ms`,
            animationDuration: `${point.duration}ms`,
          }}
        />
      ))}

      {/* CSS Keyframes */}
      <style jsx>{`
        .mission-control-point {
          width: 4px;
          height: 4px;
          background: #00D9FF;
          border-radius: 50%;
          box-shadow: 0 0 8px rgba(0, 217, 255, 0.8), 0 0 16px rgba(0, 217, 255, 0.4);
          animation: point-pulse infinite ease-in-out;
          transform: translate(-50%, -50%);
        }

        @keyframes point-pulse {
          0%, 100% {
            opacity: 0.3;
            transform: translate(-50%, -50%) scale(1);
          }
          50% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(2);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .mission-control-point {
            animation: none;
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
}
