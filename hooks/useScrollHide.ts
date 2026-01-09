import { useState, useEffect } from "react";

interface UseScrollHideOptions {
  /** Scroll threshold in pixels before hiding starts (default: 80) */
  threshold?: number;
}

/**
 * Hook that hides an element when scrolling down and shows it when scrolling up.
 * Useful for headers that should hide on scroll.
 *
 * @param options - Configuration options
 * @returns isHidden - Whether the element should be hidden
 */
export function useScrollHide(options: UseScrollHideOptions = {}): boolean {
  const { threshold = 80 } = options;
  const [isHidden, setIsHidden] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > lastScrollY && currentScrollY > threshold) {
        // Scrolling down & past threshold
        setIsHidden(true);
      } else {
        // Scrolling up
        setIsHidden(false);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY, threshold]);

  return isHidden;
}
