"use client";

import { useState, useEffect } from "react";
import { X, Copy, Check, Share2, Swords, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { buildChallengeUrl } from "@/lib/duel-utils";

interface ShareDuelChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  locale: string;
  gameType: string;
  encodedChallenge: string;
  challengerScore: number;
  challengerTime: number;
  gameTypeName?: string;
}

const labels = {
  de: {
    title: "Duell teilen",
    subtitle: "Teile diesen Link mit einem Freund, um ihn herauszufordern!",
    yourScore: "Dein Ergebnis",
    points: "Punkte",
    time: "Sek.",
    copyLink: "Link kopieren",
    copied: "Kopiert!",
    share: "Teilen",
    whatsapp: "WhatsApp",
    shareText: (score: number, gameName: string) =>
      `Ich habe ${score} Punkte im GeoMaster Duell (${gameName}) erreicht! Kannst du mich schlagen?`,
    close: "Schliessen",
  },
  en: {
    title: "Share Duel",
    subtitle: "Share this link with a friend to challenge them!",
    yourScore: "Your Score",
    points: "Points",
    time: "Sec.",
    copyLink: "Copy Link",
    copied: "Copied!",
    share: "Share",
    whatsapp: "WhatsApp",
    shareText: (score: number, gameName: string) =>
      `I scored ${score} points in GeoMaster Duel (${gameName})! Can you beat me?`,
    close: "Close",
  },
  sl: {
    title: "Deli dvoboj",
    subtitle: "Deli to povezavo s prijateljem, da ga izzoveš!",
    yourScore: "Tvoj rezultat",
    points: "Točk",
    time: "Sek.",
    copyLink: "Kopiraj povezavo",
    copied: "Kopirano!",
    share: "Deli",
    whatsapp: "WhatsApp",
    shareText: (score: number, gameName: string) =>
      `Dosegel sem ${score} točk v GeoMaster dvoboju (${gameName})! Me lahko premagas?`,
    close: "Zapri",
  },
};

export function ShareDuelChallengeModal({
  isOpen,
  onClose,
  locale,
  gameType,
  encodedChallenge,
  challengerScore,
  challengerTime,
  gameTypeName,
}: ShareDuelChallengeModalProps) {
  const [copied, setCopied] = useState(false);
  const t = labels[locale as keyof typeof labels] || labels.de;

  // Build challenge URL
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const challengeUrl = buildChallengeUrl(baseUrl, locale, gameType, encodedChallenge);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(challengeUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = challengeUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    const gameName = gameTypeName || gameType;
    const text = t.shareText(challengerScore, gameName);

    if (navigator.share) {
      try {
        await navigator.share({
          title: "GeoMaster Duell",
          text,
          url: challengeUrl,
        });
      } catch {
        // User cancelled or share failed
      }
    } else {
      // Fallback: copy to clipboard
      await handleCopyLink();
    }
  };

  const handleWhatsApp = () => {
    const gameName = gameTypeName || gameType;
    const text = t.shareText(challengerScore, gameName);
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${text} ${challengeUrl}`)}`;
    window.open(whatsappUrl, "_blank");
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-white/10 animate-fade-in"
        style={{ backgroundColor: "rgba(0, 0, 0, 0.4)", backdropFilter: "blur(12px)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-glass-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
              <Swords className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h2 className="text-lg font-heading font-semibold text-text-primary">
                {t.title}
              </h2>
              <p className="text-sm text-text-muted">{t.subtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-surface-2 transition-colors text-text-muted hover:text-text-primary"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Score Display */}
          <div className="flex justify-center gap-8 py-4 bg-surface-2/50 rounded-xl">
            <div className="text-center">
              <p className="text-3xl font-bold text-accent">{challengerScore.toLocaleString()}</p>
              <p className="text-sm text-text-muted">{t.points}</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">{challengerTime.toFixed(1)}</p>
              <p className="text-sm text-text-muted">{t.time}</p>
            </div>
          </div>

          {/* Challenge Link */}
          <div className="bg-surface-2 rounded-lg p-3 break-all text-sm text-text-secondary font-mono">
            {challengeUrl.length > 80 ? `${challengeUrl.substring(0, 80)}...` : challengeUrl}
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={handleCopyLink}
              variant={copied ? "success" : "outline"}
              size="lg"
              className="w-full"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  {t.copied}
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  {t.copyLink}
                </>
              )}
            </Button>

            <Button
              onClick={handleWhatsApp}
              variant="success"
              size="lg"
              className="w-full"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              {t.whatsapp}
            </Button>
          </div>

          {/* Native Share (if available) */}
          {typeof navigator !== "undefined" && navigator.share && (
            <Button
              onClick={handleShare}
              variant="primary"
              size="lg"
              className="w-full"
            >
              <Share2 className="w-4 h-4 mr-2" />
              {t.share}
            </Button>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-glass-border">
          <Button
            onClick={onClose}
            variant="ghost"
            size="md"
            className="w-full text-text-muted"
          >
            {t.close}
          </Button>
        </div>
      </div>
    </div>
  );
}
