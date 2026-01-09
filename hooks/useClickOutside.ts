import { useEffect, RefObject } from "react";

/**
 * Hook that calls a callback when clicking outside of the specified element.
 *
 * @param ref - React ref to the element to detect clicks outside of
 * @param callback - Function to call when clicking outside
 */
export function useClickOutside<T extends HTMLElement>(
  ref: RefObject<T | null>,
  callback: () => void
): void {
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        callback();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [ref, callback]);
}
