"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { X, Copy, Check, Share2, Swords, MessageCircle, UserPlus, Search, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { buildChallengeUrl } from "@/lib/duel-utils";

interface SearchUser {
  id: string;
  displayName: string;
  image: string | null;
}

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
    invitePlayer: "Spieler einladen",
    searchPlayer: "Spieler suchen...",
    sendInvite: "Einladung senden",
    inviteSent: "Einladung gesendet!",
    inviteError: "Fehler beim Senden",
    noResults: "Keine Spieler gefunden",
    sending: "Sende...",
    challengeSent: (name: string) => `Herausforderung an ${name} gesendet!`,
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
    invitePlayer: "Invite Player",
    searchPlayer: "Search player...",
    sendInvite: "Send Invite",
    inviteSent: "Invite sent!",
    inviteError: "Error sending invite",
    noResults: "No players found",
    sending: "Sending...",
    challengeSent: (name: string) => `Challenge sent to ${name}!`,
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
    invitePlayer: "Povabi igralca",
    searchPlayer: "Išči igralca...",
    sendInvite: "Pošlji povabilo",
    inviteSent: "Povabilo poslano!",
    inviteError: "Napaka pri pošiljanju",
    noResults: "Noben igralec ni najden",
    sending: "Pošiljanje...",
    challengeSent: (name: string) => `Izziv poslan ${name}!`,
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
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<SearchUser | null>(null);
  const [isSendingInvite, setIsSendingInvite] = useState(false);
  const [inviteStatus, setInviteStatus] = useState<"idle" | "success" | "error">("idle");
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  const t = labels[locale as keyof typeof labels] || labels.de;

  // Build challenge URL
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const challengeUrl = buildChallengeUrl(baseUrl, locale, gameType, encodedChallenge);

  // Search users with debounce
  const searchUsers = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data);
        setShowDropdown(data.length > 0);
      }
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Handle search input change with debounce
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setSelectedUser(null);
    setInviteStatus("idle");

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      searchUsers(value);
    }, 300);
  };

  // Handle user selection
  const handleSelectUser = (user: SearchUser) => {
    setSelectedUser(user);
    setSearchQuery(user.displayName);
    setShowDropdown(false);
    setInviteStatus("idle");
  };

  // Send invite
  const handleSendInvite = async () => {
    if (!selectedUser) return;

    setIsSendingInvite(true);
    setInviteStatus("idle");

    try {
      const res = await fetch("/api/ranked/games/duel/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUserId: selectedUser.id,
          challengeUrl,
          gameType,
          gameName: gameTypeName || gameType,
          locale,
        }),
      });

      if (res.ok) {
        // Toast anzeigen
        toast.success(t.challengeSent(selectedUser.displayName), {
          duration: 3000,
        });
        // Modal schliessen
        onClose();
        // Zur Spieleübersicht navigieren
        router.push(`/${locale}/guesser/${gameType}`);
      } else {
        setInviteStatus("error");
      }
    } catch {
      setInviteStatus("error");
    } finally {
      setIsSendingInvite(false);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
          {typeof navigator !== "undefined" && typeof navigator.share === "function" && (
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

          {/* Divider */}
          <div className="flex items-center gap-3 pt-2">
            <div className="h-px flex-1 bg-glass-border" />
            <span className="text-xs text-text-muted uppercase tracking-wider">{t.invitePlayer}</span>
            <div className="h-px flex-1 bg-glass-border" />
          </div>

          {/* Player Invite Section */}
          <div className="space-y-3" ref={searchRef}>
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder={t.searchPlayer}
                  className="pl-10 pr-10"
                  size="md"
                />
                {isSearching && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted animate-spin" />
                )}
              </div>

              {/* Search Dropdown */}
              {showDropdown && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-surface-2 border border-glass-border rounded-lg shadow-lg overflow-hidden z-10">
                  {searchResults.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => handleSelectUser(user)}
                      className="w-full px-4 py-2.5 text-left hover:bg-surface-3 transition-colors flex items-center gap-3"
                    >
                      <div className="w-8 h-8 rounded-full bg-surface-3 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {user.image ? (
                          <img src={user.image} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-sm font-semibold text-text-secondary">
                            {user.displayName.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <span className="text-sm text-text-primary truncate">{user.displayName}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* No results message */}
              {showDropdown && searchResults.length === 0 && searchQuery.length >= 2 && !isSearching && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-surface-2 border border-glass-border rounded-lg shadow-lg p-3 text-center text-sm text-text-muted">
                  {t.noResults}
                </div>
              )}
            </div>

            {/* Send Invite Button */}
            <Button
              onClick={handleSendInvite}
              variant={inviteStatus === "success" ? "success" : inviteStatus === "error" ? "danger" : "accent"}
              size="lg"
              className="w-full"
              disabled={!selectedUser || isSendingInvite}
              isLoading={isSendingInvite}
            >
              {inviteStatus === "success" ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  {t.inviteSent}
                </>
              ) : inviteStatus === "error" ? (
                <>
                  <X className="w-4 h-4 mr-2" />
                  {t.inviteError}
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  {t.sendInvite}
                </>
              )}
            </Button>
          </div>
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
