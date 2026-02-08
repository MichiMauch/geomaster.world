import { memo } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import type { HorizonItem } from "../hooks/useHorizon";
import { translateName, translateUnit, translateTrapNote } from "../translations";

interface HorizonGameOverProps {
  score: number;
  highscore: number;
  isNewHighscore: boolean;
  itemA: HorizonItem;
  itemB: HorizonItem;
  formatValue: (value: number, unit: string) => string;
  onPlayAgain: () => void;
  onReset: () => void;
  onShare: () => void;
  locale: string;
}

export const HorizonGameOver = memo(function HorizonGameOver({
  score,
  highscore,
  isNewHighscore,
  itemA,
  itemB,
  formatValue,
  onPlayAgain,
  onReset,
  onShare,
  locale,
}: HorizonGameOverProps) {
  const t = useTranslations("horizon");

  const getGameOverHeadline = (s: number) => {
    if (s >= 5000) return t("incredible");
    if (s >= 2000) return t("wellPlayed");
    return t("gameOver");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      {/* Background image — same as gameplay */}
      <img
        src="/images/horizon/9-16.webp"
        alt=""
        className="absolute inset-0 w-full h-full object-cover md:hidden"
      />
      <img
        src="/images/horizon/4-3.webp"
        alt=""
        className="absolute inset-0 w-full h-full object-cover hidden md:block"
      />
      <div className={`absolute inset-0 ${isNewHighscore ? "bg-black/75" : "bg-black/70"}`} />
      {/* Gold radial glow for highscore */}
      {isNewHighscore && (
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at center, rgba(255,215,0,0.08) 0%, transparent 60%)" }} />
      )}

      {isNewHighscore ? (
        /* ════════ THEME A: LEGENDARY (New High Score) ════════ */
        <div className="relative z-10 gameover-legendary-panel max-w-md w-full p-6 sm:p-8 flex flex-col items-center text-center overflow-hidden">
          {/* Card background image */}
          <img src="/images/horizon/gold.webp" alt="" className="absolute inset-0 w-full h-full object-cover opacity-30" />
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative z-[1] flex flex-col items-center w-full">
            {/* Trophy icon */}
            <div className="animate-trophy-bounce mb-2">
              <svg className="w-12 h-12 sm:w-16 sm:h-16 text-yellow-400" fill="currentColor" viewBox="0 0 24 24"
                   style={{ filter: "drop-shadow(0 0 12px rgba(255,215,0,0.6))" }}>
                <path d="M5 3h14v2h-1.09A8.006 8.006 0 0113 12.89V16h2a3 3 0 013 3v1H6v-1a3 3 0 013-3h2v-3.11A8.006 8.006 0 015.09 5H4V3h1zm1.09 2A6.003 6.003 0 0012 11a6.003 6.003 0 005.91-5H6.09zM2 5h2v3a4 4 0 003 3.87V10.1A5.002 5.002 0 014 5.5V5H2zm18 0h2v.5A5.002 5.002 0 0117 10.1v1.77A4 4 0 0020 8V5h-2z" />
              </svg>
            </div>

            {/* Headline */}
            <h2 className="text-xl sm:text-2xl font-heading font-black uppercase tracking-wider text-yellow-400 mb-3"
                style={{ textShadow: "0 0 15px rgba(255,215,0,0.5)" }}>
              {t("newRecord")}
            </h2>

            {/* Score — gold massive */}
            <span className="text-[10px] uppercase tracking-[0.25em] text-yellow-400/50">Score</span>
            <p className="gameover-score-gold text-5xl sm:text-7xl font-mono font-black tabular-nums leading-none animate-score-pop mb-1">
              {score.toLocaleString(locale === "de" ? "de-CH" : "en-US")}
            </p>
            <p className="text-xs font-mono text-yellow-400/40 tabular-nums mb-5">
              {t("previous")}: {highscore.toLocaleString(locale === "de" ? "de-CH" : "en-US")}
            </p>

            {/* Last question — discreet */}
            <div className="w-full rounded-xl p-3 mb-5 bg-black/40 border border-white/15 backdrop-blur-sm">
              <p className="text-xs text-white/80">
                <span className="font-semibold text-white">{translateName(itemB.id, itemB.name, locale)}</span>{" "}
                {itemB.value >= itemA.value ? t("wasHigherThan") : t("wasLowerThan")}{" "}
                <span className="font-semibold text-white">{translateName(itemA.id, itemA.name, locale)}</span>
                {" · "}
                {formatValue(itemB.value, translateUnit(itemB.unit, locale))} vs.{" "}
                {formatValue(itemA.value, translateUnit(itemA.unit, locale))}
              </p>
            </div>

            {/* Play Again — gold neon */}
            <button
              className="stats-btn-gold flex items-center justify-center gap-3 px-8 py-3 sm:py-4 w-full cursor-pointer"
              onClick={onPlayAgain}
            >
              {t("playAgain")}
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <div className="flex gap-2 w-full">
              <Link
                href={`/${locale}/guesser/horizon/leaderboard`}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold uppercase tracking-wider text-yellow-400/60 hover:text-yellow-400 border border-yellow-400/20 hover:border-yellow-400/40 bg-yellow-400/[0.03] transition-colors"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M5 3h14v2h-1.09A8.006 8.006 0 0113 12.89V16h2a3 3 0 013 3v1H6v-1a3 3 0 013-3h2v-3.11A8.006 8.006 0 015.09 5H4V3h1z" />
                </svg>
                <span className="hidden sm:inline">{t("leaderboard")}</span>
              </Link>
              <button
                className="shrink-0 flex items-center justify-center w-11 h-11 rounded-xl text-yellow-400/60 hover:text-yellow-400 border border-yellow-400/20 hover:border-yellow-400/40 bg-yellow-400/[0.03] transition-colors cursor-pointer"
                onClick={onShare}
                aria-label="Share"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* ════════ THEME B: SYSTEM FAILURE (Standard Loss) ════════ */
        <div className="relative z-10 gameover-failure-panel max-w-md w-full p-6 sm:p-8 flex flex-col items-center text-center overflow-hidden">
          {/* Card background image */}
          <img src="/images/horizon/red.webp" alt="" className="absolute inset-0 w-full h-full object-cover opacity-25" />
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative z-[1] flex flex-col items-center w-full">
            {/* Headline */}
            <h2 className="text-2xl sm:text-3xl font-heading font-bold text-white mb-3 drop-shadow-lg">
              {getGameOverHeadline(score)}
            </h2>

            {/* Score — red-tinted massive */}
            <span className="text-[10px] uppercase tracking-[0.25em] text-white/40">Score</span>
            <p className="gameover-score-red text-5xl sm:text-7xl font-mono font-black tabular-nums leading-none animate-score-pop mb-1">
              {score.toLocaleString(locale === "de" ? "de-CH" : "en-US")}
            </p>
            <p className="text-xs font-mono text-white/30 tabular-nums mb-5">
              Best: {highscore.toLocaleString(locale === "de" ? "de-CH" : "en-US")}
            </p>

            {/* Last question explanation */}
            <div className="w-full rounded-xl p-4 mb-5 bg-black/40 border border-white/15 backdrop-blur-sm">
              <p className="text-sm text-white/90">
                <span className="font-semibold text-white">
                  {translateName(itemB.id, itemB.name, locale)}
                </span>{" "}
                {itemB.value >= itemA.value ? t("wasHigherThan") : t("wasLowerThan")}{" "}
                <span className="font-semibold text-white">
                  {translateName(itemA.id, itemA.name, locale)}
                </span>
              </p>
              <p className="text-sm text-white/70 mt-1">
                {formatValue(itemB.value, translateUnit(itemB.unit, locale))} vs.{" "}
                {formatValue(itemA.value, translateUnit(itemA.unit, locale))}
              </p>
              {translateTrapNote(itemB.id, itemB.trapNote, locale) && (
                <p className="text-sm text-white/60 italic mt-2">
                  {t("didYouKnow")}
                  {translateTrapNote(itemB.id, itemB.trapNote, locale)}
                </p>
              )}
            </div>

            {/* Primary: Play Again — full width, neon cyan */}
            <button
              className="stats-btn-next flex items-center justify-center gap-2 w-full py-3 cursor-pointer text-sm"
              onClick={onPlayAgain}
            >
              {t("again")}
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>

            {/* Secondary: Back, Share, Rank */}
            <div className="flex gap-2 w-full">
              <button
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl cursor-pointer border border-white/20 text-white/60 hover:text-white/80 hover:border-white/30 text-sm transition-colors"
                style={{ background: "rgba(255,255,255,0.05)" }}
                onClick={onReset}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                <span className="hidden sm:inline">{t("back")}</span>
              </button>
              <button
                className="shrink-0 flex items-center justify-center w-11 h-11 rounded-xl cursor-pointer border border-white/20 text-white/60 hover:text-white/80 hover:border-white/30 transition-colors"
                style={{ background: "rgba(255,255,255,0.05)" }}
                onClick={onShare}
                aria-label="Share"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              </button>
              <Link
                href={`/${locale}/guesser/horizon/leaderboard`}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-primary/20 text-primary/60 hover:text-primary/80 hover:border-primary/40 text-sm transition-colors"
                style={{ background: "rgba(0,217,255,0.03)" }}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M5 3h14v2h-1.09A8.006 8.006 0 0113 12.89V16h2a3 3 0 013 3v1H6v-1a3 3 0 013-3h2v-3.11A8.006 8.006 0 015.09 5H4V3h1z" />
                </svg>
                <span className="hidden sm:inline">{t("rank")}</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
