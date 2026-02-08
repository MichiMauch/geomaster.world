import { memo } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";

interface HorizonStartScreenProps {
  locale: string;
  loading: boolean;
  error: string | null;
  savedHs: number;
  topPlayer: { name: string; score: number } | null;
  holdProgress: number;
  isHolding: boolean;
  showFlash: boolean;
  onHoldStart: () => void;
  onHoldEnd: () => void;
}

export const HorizonStartScreen = memo(function HorizonStartScreen({
  locale,
  loading,
  error,
  savedHs,
  topPlayer,
  holdProgress,
  isHolding,
  showFlash,
  onHoldStart,
  onHoldEnd,
}: HorizonStartScreenProps) {
  const t = useTranslations("horizon");
  const circumference = 2 * Math.PI * 52;
  const dashOffset = circumference * (1 - holdProgress);

  return (
    <>
      {/* ── Split World Background ── */}
      <div className="fixed inset-0 -z-10">
        {/* Nature half — top-left triangle */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{
            clipPath: "polygon(0 0, 100% 0, 0 100%)",
            WebkitClipPath: "polygon(0 0, 100% 0, 0 100%)",
          }}
        >
          <img
            src="/images/horizon/n_everest.webp"
            alt=""
            className="absolute inset-0 w-full h-full object-cover sb-split-img-a"
          />
          <div className="absolute inset-0 bg-black/55" />
        </div>

        {/* City half — bottom-right triangle */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{
            clipPath: "polygon(100% 0, 100% 100%, 0 100%)",
            WebkitClipPath: "polygon(100% 0, 100% 100%, 0 100%)",
          }}
        >
          <img
            src="/images/horizon/c_tokyo.webp"
            alt=""
            className="absolute inset-0 w-full h-full object-cover sb-split-img-b"
          />
          <div className="absolute inset-0 bg-black/55" />
        </div>

        {/* Diagonal rift line */}
        <svg
          className="absolute inset-0 w-full h-full sb-rift-line"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <line
            x1="100" y1="0" x2="0" y2="100"
            stroke="#00D9FF"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        {/* Dark radial gradient overlay for contrast */}
        <div
          className="absolute inset-0"
          style={{
            background: "radial-gradient(ellipse at center, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.5) 100%)",
          }}
        />
      </div>

      {/* ── Content Layer ── */}
      <div className="relative z-10 animate-fade-in flex flex-col items-center justify-center" style={{ minHeight: "100dvh" }}>
        {/* Title */}
        <div className="sb-title-drift text-center mb-8 sm:mb-10">
          <h1
            className="text-[12vw] sm:text-[8vw] md:text-[6vw] font-heading font-black uppercase tracking-wider leading-none mb-3"
            style={{
              background: "linear-gradient(180deg, #ffffff 0%, #00D9FF 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              WebkitTextStroke: "1px rgba(255,255,255,0.3)",
              filter: "drop-shadow(0 0 30px rgba(0,217,255,0.5)) drop-shadow(0 0 60px rgba(0,217,255,0.2))",
              textShadow: "0 2px 20px rgba(0,0,0,0.8)",
            }}
          >
            Horizon
          </h1>
          <p className="text-xs sm:text-sm uppercase tracking-[0.3em] text-white/60">
            {t("subtitle")}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-error/10 border border-error/30 text-error text-center max-w-sm">
            {error}
          </div>
        )}

        {/* Hold-to-Start Reactor Core */}
        <button
          className={`relative cursor-pointer mb-4 sm:mb-6 w-28 h-28 sm:w-36 sm:h-36 rounded-full flex items-center justify-center select-none ${
            isHolding ? "sb-reactor-core-active" : "sb-reactor-core"
          }`}
          style={{ background: "radial-gradient(circle, rgba(0,217,255,0.2) 0%, rgba(0,128,255,0.08) 60%, transparent 70%)" }}
          onPointerDown={onHoldStart}
          onPointerUp={onHoldEnd}
          onPointerLeave={onHoldEnd}
          onPointerCancel={onHoldEnd}
          disabled={loading}
        >
          {/* Progress ring */}
          <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 120 120">
            {/* Track */}
            <circle
              cx="60" cy="60" r="52"
              fill="none"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="4"
            />
            {/* Progress */}
            <circle
              cx="60" cy="60" r="52"
              fill="none"
              stroke="#00D9FF"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              style={{
                transition: isHolding ? "none" : "stroke-dashoffset 0.3s ease",
                filter: holdProgress > 0 ? `drop-shadow(0 0 ${8 + holdProgress * 20}px rgba(0,217,255,0.8))` : undefined,
              }}
            />
          </svg>

          {/* Center icon */}
          {loading ? (
            <svg className="w-8 h-8 text-white animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg
              className="w-10 h-10 sm:w-12 sm:h-12 text-white ml-1"
              fill="currentColor"
              viewBox="0 0 24 24"
              style={{
                transform: `scale(${1 + holdProgress * 0.3})`,
                transition: isHolding ? "none" : "transform 0.3s ease",
                filter: `drop-shadow(0 0 ${6 + holdProgress * 15}px rgba(0,217,255,0.7))`,
              }}
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        {/* Hold label */}
        <p className="sb-label-blink text-xs sm:text-sm uppercase tracking-[0.3em] text-white/70 font-mono mb-8 sm:mb-10">
          {t("holdToStart")}
        </p>

        {/* Glass Footer */}
        <div className="hud-glass-panel px-5 py-2.5 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 sm:gap-x-6 text-xs sm:text-sm mb-16">
          {topPlayer && (
            <>
              <span className="font-mono uppercase tracking-wider text-yellow-400/70" style={{ textShadow: "0 0 6px rgba(255,215,0,0.3)" }}>
                <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 inline-block mr-1 -mt-0.5 text-yellow-400/60" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M5 3h14v2h-1.09A8.006 8.006 0 0113 12.89V16h2a3 3 0 013 3v1H6v-1a3 3 0 013-3h2v-3.11A8.006 8.006 0 015.09 5H4V3h1z" />
                </svg>
                {topPlayer.score.toLocaleString(locale === "de" ? "de-CH" : "en-US")} · {topPlayer.name}
              </span>
              <div className="w-px h-4 bg-white/10" />
            </>
          )}
          <span
            className={`font-mono uppercase tracking-wider ${savedHs > 0 ? "text-primary/60" : "text-white/50"}`}
            style={savedHs > 0 ? { textShadow: "0 0 6px rgba(0,217,255,0.3)" } : undefined}
          >
            {t("yourBest")}: {savedHs > 0 ? savedHs.toLocaleString(locale === "de" ? "de-CH" : "en-US") : "—"}
          </span>
          <div className="w-px h-4 bg-white/10" />
          <Link
            href={`/${locale}/guesser/horizon/leaderboard`}
            className="font-mono uppercase tracking-wider text-primary/60 hover:text-primary transition-colors flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M5 3h14v2h-1.09A8.006 8.006 0 0113 12.89V16h2a3 3 0 013 3v1H6v-1a3 3 0 013-3h2v-3.11A8.006 8.006 0 015.09 5H4V3h1z" />
            </svg>
            {t("leaderboard")}
          </Link>
        </div>
      </div>

      {/* Data Stream Marquee */}
      <div className="fixed bottom-0 left-0 right-0 z-10 overflow-hidden py-3 pointer-events-none">
        <div className="sb-marquee-track text-[10px] font-mono text-primary/50 uppercase tracking-wider whitespace-nowrap">
          <span className="px-6">Mt. Everest 8&apos;849m</span>
          <span className="px-6">Amazon 6&apos;992km</span>
          <span className="px-6">Tokyo 13.96M</span>
          <span className="px-6">Nile 6&apos;650km</span>
          <span className="px-6">Sahara 9.2M km²</span>
          <span className="px-6">Mariana Trench 10&apos;994m</span>
          <span className="px-6">Lake Baikal 1&apos;642m</span>
          <span className="px-6">Burj Khalifa 828m</span>
          <span className="px-6">Greenland 2.166M km²</span>
          <span className="px-6">Shanghai 28.5M</span>
          <span className="px-6">K2 8&apos;611m</span>
          <span className="px-6">Yangtze 6&apos;300km</span>
          {/* Duplicate for seamless loop */}
          <span className="px-6">Mt. Everest 8&apos;849m</span>
          <span className="px-6">Amazon 6&apos;992km</span>
          <span className="px-6">Tokyo 13.96M</span>
          <span className="px-6">Nile 6&apos;650km</span>
          <span className="px-6">Sahara 9.2M km²</span>
          <span className="px-6">Mariana Trench 10&apos;994m</span>
          <span className="px-6">Lake Baikal 1&apos;642m</span>
          <span className="px-6">Burj Khalifa 828m</span>
          <span className="px-6">Greenland 2.166M km²</span>
          <span className="px-6">Shanghai 28.5M</span>
          <span className="px-6">K2 8&apos;611m</span>
          <span className="px-6">Yangtze 6&apos;300km</span>
        </div>
      </div>

      {/* Flash overlay on start */}
      {showFlash && (
        <div className="fixed inset-0 z-50 bg-white sb-flash-overlay" />
      )}
    </>
  );
});
