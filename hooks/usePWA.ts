"use client";

import { useState, useEffect, useCallback } from "react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

const DISMISSED_KEY = "pwa-install-dismissed";
const DISMISSED_DURATION = 24 * 60 * 60 * 1000; // 1 day in ms

// Helper to check localStorage fresh (not stale closure value)
function wasRecentlyDismissed(): boolean {
  const dismissedAt = localStorage.getItem(DISMISSED_KEY);
  return !!dismissedAt && Date.now() - parseInt(dismissedAt, 10) < DISMISSED_DURATION;
}

export function usePWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Check if running in standalone mode (already installed)
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches
      || (window.navigator as { standalone?: boolean }).standalone === true;

    setIsInstalled(isStandalone);

    // Check if iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent) && !("MSStream" in window);
    setIsIOS(isIOSDevice);

    // Handle beforeinstallprompt event (Android/Chrome)
    const handleBeforeInstall = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);

      // Show prompt if not recently dismissed and not already installed
      // Check localStorage fresh each time (not stale closure value)
      if (!wasRecentlyDismissed() && !isStandalone) {
        // Small delay to not show immediately on page load
        setTimeout(() => {
          // Double-check before showing (user might have dismissed in the meantime)
          if (!wasRecentlyDismissed()) {
            setShowPrompt(true);
          }
        }, 3000);
      }
    };

    // Handle app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      setShowPrompt(false);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleAppInstalled);

    // For iOS, show prompt if not dismissed and not installed
    if (isIOSDevice && !isStandalone && !wasRecentlyDismissed()) {
      setTimeout(() => {
        // Double-check before showing (user might have dismissed in the meantime)
        if (!wasRecentlyDismissed()) {
          setIsInstallable(true);
          setShowPrompt(true);
        }
      }, 3000);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return false;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === "accepted") {
        setIsInstalled(true);
      }

      setDeferredPrompt(null);
      setShowPrompt(false);
      return outcome === "accepted";
    } catch {
      return false;
    }
  }, [deferredPrompt]);

  const dismissPrompt = useCallback(() => {
    localStorage.setItem(DISMISSED_KEY, Date.now().toString());
    setShowPrompt(false);
  }, []);

  return {
    isInstallable,
    isInstalled,
    isIOS,
    showPrompt,
    promptInstall,
    dismissPrompt,
  };
}
