"use client";

import { useEffect, useState } from "react";
import { X, Download, Share } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { usePWA } from "@/hooks/usePWA";
import { cn } from "@/lib/utils";

const DISMISSED_KEY = "pwa-install-dismissed";
const DISMISSED_DURATION = 24 * 60 * 60 * 1000; // 1 day in ms

// Final safety check - if localStorage says dismissed, don't show
function wasRecentlyDismissed(): boolean {
  if (typeof window === "undefined") return true;
  const dismissedAt = localStorage.getItem(DISMISSED_KEY);
  return !!dismissedAt && Date.now() - parseInt(dismissedAt, 10) < DISMISSED_DURATION;
}

export function PWAInstallPrompt() {
  const { isInstallable, isInstalled, isIOS, showPrompt, promptInstall, dismissPrompt } = usePWA();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (showPrompt && !isInstalled && !wasRecentlyDismissed()) {
      // Small delay to ensure smooth animation
      const timer = setTimeout(() => setIsVisible(true), 100);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [showPrompt, isInstalled]);

  // Triple check: hook state + installed check + localStorage check
  if (!showPrompt || isInstalled || !isInstallable || wasRecentlyDismissed()) {
    return null;
  }

  const handleInstall = async () => {
    if (isIOS) {
      // iOS doesn't support programmatic install, just close the prompt
      dismissPrompt();
    } else {
      await promptInstall();
    }
  };

  return (
    <div
      className={cn(
        "fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96",
        "transition-all duration-500 ease-out",
        isVisible
          ? "translate-y-0 opacity-100"
          : "translate-y-full opacity-0"
      )}
    >
      <Card variant="glass-elevated" padding="md" className="relative overflow-hidden">
        {/* Glow effect at top */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent to-primary opacity-80" />

        {/* Close button */}
        <button
          onClick={dismissPrompt}
          className="absolute top-3 right-3 p-1 rounded-full text-text-muted hover:text-text-primary hover:bg-surface-2 transition-colors"
          aria-label="Schließen"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-4 pr-8">
          {/* App icon */}
          <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-primary-dark p-0.5">
            <div className="w-full h-full rounded-xl bg-surface-2 flex items-center justify-center">
              <img
                src="/android-chrome-96x96.png"
                alt="GeoMaster"
                className="w-10 h-10 rounded-lg"
              />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="font-heading font-semibold text-text-primary mb-1">
              GeoMaster installieren
            </h3>
            <p className="text-sm text-text-secondary mb-4">
              {isIOS
                ? "Füge die App zu deinem Home-Bildschirm hinzu für schnelleren Zugriff."
                : "Installiere die App für schnelleren Zugriff und bessere Performance."}
            </p>

            {isIOS ? (
              // iOS instructions
              <div className="space-y-2 text-sm text-text-muted mb-4">
                <div className="flex items-center gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-surface-3 flex items-center justify-center text-xs">1</span>
                  <span className="flex items-center gap-1">
                    Tippe auf <Share className="w-4 h-4 text-primary" />
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-surface-3 flex items-center justify-center text-xs">2</span>
                  <span>Wähle &quot;Zum Home-Bildschirm&quot;</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-surface-3 flex items-center justify-center text-xs">3</span>
                  <span>Tippe &quot;Hinzufügen&quot;</span>
                </div>
              </div>
            ) : null}

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={dismissPrompt}
                className="text-text-muted"
              >
                Später
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleInstall}
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                {isIOS ? "Verstanden" : "Installieren"}
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
