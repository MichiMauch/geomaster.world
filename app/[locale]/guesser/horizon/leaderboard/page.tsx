"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useLocale } from "next-intl";
import "../horizon.css";
import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";

interface LeaderboardEntry {
  id: string;
  userId: string;
  score: number;
  roundsSurvived: number;
  completedAt: string;
  name: string | null;
  nickname: string | null;
  image: string | null;
}

export default function HorizonLeaderboardPage() {
  const locale = useLocale();
  const { data: session } = useSession();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/horizon/results?limit=50")
      .then((res) => res.json())
      .then((data) => {
        setLeaderboard(data.leaderboard ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  const displayName = (entry: LeaderboardEntry) =>
    entry.nickname || entry.name || "Anonym";

  return (
    <div className="relative min-h-screen">
      {/* Background */}
      <div className="fixed inset-0 -z-10">
        <img src="/images/horizon/9-16.webp" alt="" className="absolute inset-0 w-full h-full object-cover md:hidden" />
        <img src="/images/horizon/4-3.webp" alt="" className="absolute inset-0 w-full h-full object-cover hidden md:block" />
        <div className="absolute inset-0 bg-black/25" />
      </div>

      <div className="container max-w-2xl mx-auto px-3 sm:px-4 pt-6 pb-8">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <Link
            href={`/${locale}/guesser/horizon`}
            className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.2em] text-white/40 hover:text-white/60 transition-colors mb-3"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Horizon
          </Link>
          <h1
            className="text-3xl sm:text-4xl font-heading font-black uppercase tracking-wider"
            style={{
              background: "linear-gradient(180deg, #ffffff 0%, #00D9FF 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              filter: "drop-shadow(0 0 20px rgba(0,217,255,0.4))",
            }}
          >
            {locale === "de" ? "Rangliste" : "Leaderboard"}
          </h1>
          <p className="text-xs uppercase tracking-[0.2em] text-white/40 mt-1">
            {locale === "de" ? "Die besten Horizon-Spieler" : "Top Horizon Players"}
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <div className="space-y-4">
            {/* Podium skeleton */}
            <div className="flex items-end justify-center gap-3 sm:gap-4 h-72 mb-8">
              <div className="w-24 h-36 rounded-t-xl bg-white/[0.03] animate-pulse" />
              <div className="w-28 h-48 rounded-t-xl bg-white/[0.03] animate-pulse" />
              <div className="w-24 h-28 rounded-t-xl bg-white/[0.03] animate-pulse" />
            </div>
            {/* List skeleton */}
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-14 rounded-xl bg-white/[0.03] animate-pulse" />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && leaderboard.length === 0 && (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">🏆</div>
            <p className="text-text-secondary text-sm">
              {locale === "de"
                ? "Noch keine Einträge. Spiel eine Runde Horizon!"
                : "No entries yet. Play a round of Horizon!"}
            </p>
            <Link
              href={`/${locale}/guesser/horizon`}
              className="inline-block mt-4 px-5 py-2.5 text-sm font-semibold uppercase tracking-wider rounded-xl bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 transition-colors"
            >
              {locale === "de" ? "Jetzt spielen" : "Play now"}
            </Link>
          </div>
        )}

        {/* Podium + List */}
        {!loading && leaderboard.length > 0 && (
          <>
            {/* ── Neon Podium (Top 3) ── */}
            <div className="relative mb-8 sm:mb-10">
              {/* Grid floor */}
              <div className="horizon-grid-floor" />

              <div className="relative z-10 flex items-end justify-center gap-2 sm:gap-4 pt-16 pb-2">
                {/* 2nd place — left */}
                {top3[1] ? (
                  <PodiumPillar
                    entry={top3[1]}
                    rank={2}
                    height="h-36"
                    colorClass="horizon-pillar-cyan"
                    ringColor="#00FFFF"
                    displayName={displayName(top3[1])}
                    isCurrentUser={top3[1].userId === session?.user?.id}
                    locale={locale}
                  />
                ) : (
                  <div className="w-24 sm:w-28" />
                )}

                {/* 1st place — center */}
                {top3[0] && (
                  <PodiumPillar
                    entry={top3[0]}
                    rank={1}
                    height="h-48"
                    colorClass="horizon-pillar-gold horizon-shimmer"
                    ringColor="#FFD700"
                    displayName={displayName(top3[0])}
                    isCurrentUser={top3[0].userId === session?.user?.id}
                    locale={locale}
                  />
                )}

                {/* 3rd place — right */}
                {top3[2] ? (
                  <PodiumPillar
                    entry={top3[2]}
                    rank={3}
                    height="h-28"
                    colorClass="horizon-pillar-bronze"
                    ringColor="#CD7F32"
                    displayName={displayName(top3[2])}
                    isCurrentUser={top3[2].userId === session?.user?.id}
                    locale={locale}
                  />
                ) : (
                  <div className="w-24 sm:w-28" />
                )}
              </div>
            </div>

            {/* ── Data Stream List (Ranks 4+) ── */}
            {rest.length > 0 && (
              <div className="space-y-1.5">
                {rest.map((entry, i) => {
                  const rank = i + 4;
                  const isMe = entry.userId === session?.user?.id;
                  return (
                    <div
                      key={entry.id}
                      className={`horizon-lb-row flex items-center gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl ${
                        isMe
                          ? "bg-primary/10 border border-primary/30"
                          : i % 2 === 0
                            ? "bg-white/[0.02]"
                            : ""
                      }`}
                    >
                      {/* Rank */}
                      <span className="w-8 text-center font-mono text-sm text-white/40 tabular-nums shrink-0">
                        {rank}
                      </span>

                      {/* Avatar + Name */}
                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        <Avatar size="sm" src={entry.image} name={displayName(entry)} />
                        <span className={`text-sm truncate ${isMe ? "text-primary font-semibold" : "text-white/80"}`}>
                          {displayName(entry)}
                          {isMe && (
                            <span className="text-primary/60 text-xs ml-1.5">
                              ({locale === "de" ? "Du" : "You"})
                            </span>
                          )}
                        </span>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-3 sm:gap-4 shrink-0">
                        <span className="text-xs text-white/30 font-mono tabular-nums hidden sm:block">
                          {entry.roundsSurvived} {locale === "de" ? "Runden" : "rounds"}
                        </span>
                        <span className="font-mono font-bold text-sm text-white tabular-nums">
                          {entry.score.toLocaleString("de-CH")}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>


    </div>
  );
}

// ─── Podium Pillar Component ─────────────────────────────────────────────────

function PodiumPillar({
  entry,
  rank,
  height,
  colorClass,
  ringColor,
  displayName,
  isCurrentUser,
  locale,
}: {
  entry: LeaderboardEntry;
  rank: number;
  height: string;
  colorClass: string;
  ringColor: string;
  displayName: string;
  isCurrentUser: boolean;
  locale: string;
}) {
  const rankLabels = ["", "1st", "2nd", "3rd"];

  return (
    <div className="flex flex-col items-center w-24 sm:w-28">
      {/* Avatar floating above pillar */}
      <div className="relative mb-2">
        <div
          className="rounded-full p-0.5"
          style={{
            background: ringColor,
            boxShadow: `0 0 12px ${ringColor}80, 0 0 24px ${ringColor}40`,
          }}
        >
          <Avatar size="md" src={entry.image} name={displayName} />
        </div>
        {/* Rank badge */}
        <span
          className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-surface-1 border"
          style={{ borderColor: ringColor, color: ringColor }}
        >
          {rankLabels[rank]}
        </span>
      </div>

      {/* Name */}
      <p className={`text-xs sm:text-sm font-medium text-center truncate w-full mb-1 ${isCurrentUser ? "text-primary" : "text-white/80"}`}>
        {displayName}
      </p>

      {/* Pillar */}
      <div className={`horizon-pillar ${colorClass} ${height} w-full rounded-t-xl flex flex-col items-center justify-start pt-3 sm:pt-4`}>
        <span className="font-mono font-black text-lg sm:text-2xl tabular-nums text-white drop-shadow-lg">
          {entry.score.toLocaleString("de-CH")}
        </span>
        <span className="text-[9px] text-white/40 font-mono mt-0.5">
          {entry.roundsSurvived} {locale === "de" ? "Runden" : "rounds"}
        </span>
      </div>
    </div>
  );
}
