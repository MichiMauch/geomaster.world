"use client";

import { motion, useMotionValue, useSpring } from "framer-motion";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export function CursorGlow() {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(false);

  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);

  const springConfig = { stiffness: 150, damping: 25, mass: 0.5 };
  const springX = useSpring(cursorX, springConfig);
  const springY = useSpring(cursorY, springConfig);

  // Hide on play pages (where markers are set on the map)
  const isPlayPage = pathname?.includes("/play/");
  const isTrainPage = pathname?.includes("/train/");
  const shouldHide = isPlayPage || isTrainPage;

  useEffect(() => {
    // Only show on desktop (no touch)
    const isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    if (isTouchDevice || shouldHide) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Sync visibility with touch detection
      setIsVisible(false);
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
      if (!isVisible) setIsVisible(true);
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    const handleMouseEnter = () => {
      setIsVisible(true);
    };

    window.addEventListener("mousemove", handleMouseMove);
    document.body.addEventListener("mouseleave", handleMouseLeave);
    document.body.addEventListener("mouseenter", handleMouseEnter);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      document.body.removeEventListener("mouseleave", handleMouseLeave);
      document.body.removeEventListener("mouseenter", handleMouseEnter);
    };
  }, [cursorX, cursorY, isVisible, shouldHide]);

  if (shouldHide) return null;

  return (
    <motion.div
      className="fixed pointer-events-none z-[9999]"
      style={{
        x: springX,
        y: springY,
        translateX: "-50%",
        translateY: "-50%",
      }}
      animate={{
        opacity: isVisible ? 1 : 0,
      }}
      transition={{ duration: 0.2 }}
    >
      {/* Outer glow */}
      <div className="w-32 h-32 rounded-full bg-primary/20 blur-3xl" />
      {/* Inner glow */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-16 h-16 rounded-full bg-primary/30 blur-2xl" />
      </div>
    </motion.div>
  );
}
