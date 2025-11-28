"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import SwitzerlandMap from "@/components/Map";
import { calculateDistance } from "@/lib/distance";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface Location {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
}

export default function TrainPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = use(params);
  const routeParams = useParams();
  const locale = routeParams.locale as string;
  const t = useTranslations("train");
  const tCommon = useTranslations("common");
  const [locations, setLocations] = useState<Location[]>([]);
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [markerPosition, setMarkerPosition] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [distance, setDistance] = useState<number | null>(null);
  const [totalDistance, setTotalDistance] = useState(0);
  const [roundCount, setRoundCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLocations();
  }, [groupId]);

  const fetchLocations = async () => {
    try {
      const response = await fetch(`/api/locations?groupId=${groupId}`);
      if (response.ok) {
        const data = await response.json();
        setLocations(data);
        if (data.length > 0) {
          pickRandomLocation(data);
        }
      }
    } catch (err) {
      console.error("Error fetching locations:", err);
    } finally {
      setLoading(false);
    }
  };

  const pickRandomLocation = (locs: Location[]) => {
    const randomIndex = Math.floor(Math.random() * locs.length);
    setCurrentLocation(locs[randomIndex]);
    setMarkerPosition(null);
    setShowResult(false);
    setDistance(null);
  };

  const handleGuess = () => {
    if (!markerPosition || !currentLocation) return;

    const dist = calculateDistance(
      markerPosition.lat,
      markerPosition.lng,
      currentLocation.latitude,
      currentLocation.longitude
    );

    setDistance(dist);
    setTotalDistance((prev) => prev + dist);
    setRoundCount((prev) => prev + 1);
    setShowResult(true);
  };

  const handleNextRound = () => {
    pickRandomLocation(locations);
  };

  const handleReset = () => {
    setTotalDistance(0);
    setRoundCount(0);
    pickRandomLocation(locations);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-3 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-text-secondary">{tCommon("loading")}</p>
        </div>
      </div>
    );
  }

  // No locations
  if (locations.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 border-b border-glass-border bg-surface-1/80 backdrop-blur-xl">
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-4">
            <Link
              href={`/${locale}/groups/${groupId}`}
              className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="hidden sm:inline">{tCommon("back")}</span>
            </Link>
            <h1 className="text-h3 text-accent">{t("title")}</h1>
          </div>
        </header>
        <main className="max-w-xl mx-auto px-4 py-8">
          <Card variant="elevated" padding="xl" className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-surface-3 flex items-center justify-center">
              <svg className="w-8 h-8 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <p className="text-text-secondary mb-6">{t("noLocations")}</p>
            <Link href={`/${locale}/groups/${groupId}`}>
              <Button variant="secondary" size="md">
                {t("backToGroup")}
              </Button>
            </Link>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-glass-border bg-surface-1/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href={`/${locale}/groups/${groupId}`}
              className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="hidden sm:inline">{tCommon("back")}</span>
            </Link>
            <h1 className="text-h3 text-accent">{t("title")}</h1>
          </div>
          {roundCount > 0 && (
            <div className="text-right">
              <p className="text-body-small text-text-secondary">
                {t("rounds", { count: roundCount, distance: totalDistance.toFixed(1) })}
              </p>
              <p className="text-caption text-text-muted">
                {t("average", { distance: (totalDistance / roundCount).toFixed(1) })}
              </p>
            </div>
          )}
        </div>
      </header>

      {currentLocation && (
        <>
          {/* Location Card */}
          <div className="p-4">
            <Card variant="glass-elevated" padding="lg" className="text-center">
              <p className="text-caption text-text-muted mb-1">{t("whereIs")}</p>
              <h2 className="text-h2 text-text-primary">{currentLocation.name}</h2>
            </Card>
          </div>

          {/* Map */}
          <div className="flex-1 relative">
            <SwitzerlandMap
              onMarkerPlace={showResult ? undefined : setMarkerPosition}
              markerPosition={markerPosition}
              targetPosition={
                showResult
                  ? {
                      lat: currentLocation.latitude,
                      lng: currentLocation.longitude,
                    }
                  : null
              }
              showTarget={showResult}
              interactive={!showResult}
              height="100%"
            />
          </div>

          {/* Result or Action */}
          {showResult && distance !== null ? (
            <div className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-background via-background/95 to-transparent pt-8 pb-4 px-4 safe-area-bottom">
              <div className="max-w-lg mx-auto">
                <Card variant="elevated" padding="lg" className="text-center space-y-4">
                  <div>
                    <p className="text-caption text-text-muted mb-1">{t("yourDistance")}</p>
                    <p
                      className={cn(
                        "text-display font-bold tabular-nums",
                        distance < 10
                          ? "text-success"
                          : distance < 30
                          ? "text-accent"
                          : "text-error"
                      )}
                    >
                      {distance.toFixed(1)} km
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      variant="secondary"
                      size="lg"
                      onClick={handleReset}
                      className="flex-1"
                    >
                      {t("resetStats")}
                    </Button>
                    <Button
                      variant="accent"
                      size="lg"
                      onClick={handleNextRound}
                      className="flex-1"
                    >
                      {t("nextLocation")}
                    </Button>
                  </div>
                </Card>
              </div>
            </div>
          ) : (
            <div className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-background via-background/95 to-transparent pt-8 pb-4 px-4 safe-area-bottom">
              <div className="max-w-lg mx-auto space-y-3">
                <Button
                  variant="accent"
                  size="xl"
                  fullWidth
                  onClick={handleGuess}
                  disabled={!markerPosition}
                  className="shadow-lg"
                >
                  {markerPosition ? t("submit") : t("placeMarker")}
                </Button>
                {!markerPosition && (
                  <p className="text-center text-caption text-text-muted">
                    {t("placeMarkerHint")}
                  </p>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
