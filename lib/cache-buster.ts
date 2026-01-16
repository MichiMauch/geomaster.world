/**
 * Cache Buster - Automatically clears caches when app version changes
 * Increment CACHE_VERSION to force all clients to clear their caches
 */

const CACHE_VERSION = "v2"; // Increment this to bust caches
const CACHE_VERSION_KEY = "geomaster-cache-version";

/**
 * Check if caches need to be cleared and clear them if necessary
 * Call this on app startup (e.g., in layout or a provider)
 */
export async function checkAndClearCaches(): Promise<boolean> {
  if (typeof window === "undefined") return false;

  try {
    const storedVersion = localStorage.getItem(CACHE_VERSION_KEY);

    // If version matches, no need to clear
    if (storedVersion === CACHE_VERSION) {
      return false;
    }

    console.log(`[CacheBuster] Version changed from ${storedVersion} to ${CACHE_VERSION}, clearing caches...`);

    // Clear all caches
    if ("caches" in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map((cacheName) => {
          console.log(`[CacheBuster] Deleting cache: ${cacheName}`);
          return caches.delete(cacheName);
        })
      );
    }

    // Unregister all service workers and re-register
    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        console.log(`[CacheBuster] Unregistering service worker`);
        await registration.unregister();
      }
    }

    // Update stored version
    localStorage.setItem(CACHE_VERSION_KEY, CACHE_VERSION);

    console.log(`[CacheBuster] Caches cleared successfully`);
    return true;
  } catch (error) {
    console.error("[CacheBuster] Error clearing caches:", error);
    return false;
  }
}

/**
 * Get the current cache version
 */
export function getCacheVersion(): string {
  return CACHE_VERSION;
}
