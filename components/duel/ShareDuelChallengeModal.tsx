"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Check, UserPlus, Search, Loader2, ArrowLeft, Swords } from "lucide-react";
import { ShareResultModal } from "@/components/guesser/ShareResultModal";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { StarRating } from "@/components/guesser/results";
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
    title: "The Challenge",
    points: "Punkte",
    shareChallenge: "Herausfordern",
    invitePlayer: "Oder Spieler einladen",
    searchPlayer: "Spieler suchen...",
    sendInvite: "Einladung senden",
    inviteSent: "Einladung gesendet!",
    inviteError: "Fehler beim Senden",
    noResults: "Keine Spieler gefunden",
    backToGames: "Zurück zur Spielübersicht",
    challengeSent: (name: string) => `Herausforderung an ${name} gesendet!`,
  },
  en: {
    title: "The Challenge",
    points: "Points",
    shareChallenge: "Challenge",
    invitePlayer: "Or invite a player",
    searchPlayer: "Search player...",
    sendInvite: "Send Invite",
    inviteSent: "Invite sent!",
    inviteError: "Error sending invite",
    noResults: "No players found",
    backToGames: "Back to games",
    challengeSent: (name: string) => `Challenge sent to ${name}!`,
  },
  sl: {
    title: "Dvoboj zaključen!",
    points: "Točk",
    shareChallenge: "Izzovi",
    invitePlayer: "Ali povabi igralca",
    searchPlayer: "Išči igralca...",
    sendInvite: "Pošlji povabilo",
    inviteSent: "Povabilo poslano!",
    inviteError: "Napaka pri pošiljanju",
    noResults: "Noben igralec ni najden",
    backToGames: "Nazaj na igre",
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
  challengerTime: _challengerTime,
  gameTypeName,
}: ShareDuelChallengeModalProps) {
  const [showShareModal, setShowShareModal] = useState(false);
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
        toast.success(t.challengeSent(selectedUser.displayName), {
          duration: 3000,
        });
        onClose();
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

  // Handle back button - close modal and navigate
  const handleBack = () => {
    onClose();
    router.push(`/${locale}/guesser/${gameType}`);
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

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Background with world map and orange tint */}
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 opacity-50"
          style={{
            backgroundImage: 'url("/images/hero-map-bg.jpg")',
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/40" />
        {/* Orange overlay for duel atmosphere */}
        <div className="absolute inset-0 bg-gradient-to-t from-accent/5 via-accent/10 to-accent/5" />
      </div>
      {/* Dark overlay for modal focus */}
      <div className="absolute inset-0 bg-black/50 z-10" />

      {/* Card Container */}
      <div
        className="relative rounded-2xl border border-white/10 p-6 text-center max-w-md w-full animate-fade-in bg-surface-1 z-20"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Title with orange gradient */}
        <h1 className="text-2xl font-heading font-bold bg-gradient-to-r from-accent to-accent-light bg-clip-text text-transparent mb-2">
          {t.title}
        </h1>

        {/* StarRating */}
        <div className="py-2">
          <StarRating score={challengerScore} />
        </div>

        {/* Large Score Display */}
        <div className="text-center mb-6">
          <p className="text-5xl font-bold text-accent">{challengerScore.toLocaleString()}</p>
          <p className="text-sm text-text-muted">{t.points}</p>
        </div>

        {/* Primary Share Button */}
        <Button
          onClick={() => setShowShareModal(true)}
          variant="accent"
          size="lg"
          className="w-full glow-accent mb-6"
        >
          <Swords className="w-4 h-4 mr-2" />
          {t.shareChallenge}
        </Button>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-4">
          <div className="h-px flex-1 bg-glass-border" />
          <span className="text-xs text-text-muted uppercase tracking-wider">{t.invitePlayer}</span>
          <div className="h-px flex-1 bg-glass-border" />
        </div>

        {/* Player Invite Section */}
        <div className="space-y-3 mb-6" ref={searchRef}>
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
            variant={inviteStatus === "success" ? "success" : inviteStatus === "error" ? "danger" : "secondary"}
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
              t.inviteError
            ) : (
              <>
                <UserPlus className="w-4 h-4 mr-2" />
                {t.sendInvite}
              </>
            )}
          </Button>
        </div>

        {/* Back Button (ghost) */}
        <Button
          onClick={handleBack}
          variant="ghost"
          size="md"
          className="w-full text-text-muted hover:text-text-primary"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t.backToGames}
        </Button>
      </div>

      {/* ShareResultModal */}
      <ShareResultModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        locale={locale}
        gameType={gameType}
        gameTypeName={gameTypeName || gameType}
        score={challengerScore}
        customUrl={challengeUrl}
      />
    </div>
  );
}
