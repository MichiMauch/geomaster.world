import { memo } from "react";
import { useTranslations } from "next-intl";
import type { HorizonItem, GamePhase } from "../hooks/useHorizon";
import { getCategoryGradient, getImageSlug } from "../constants";
import { translateName, translateUnit, translateTrapNote } from "../translations";

interface HorizonGameCardsProps {
  itemA: HorizonItem;
  itemB: HorizonItem;
  phase: GamePhase;
  lastGuessCorrect: boolean | null;
  formatValue: (value: number, unit: string) => string;
  onGuessHigher: () => void;
  onGuessLower: () => void;
  onAdvance: () => void;
  locale: string;
}

export const HorizonGameCards = memo(function HorizonGameCards({
  itemA,
  itemB,
  phase,
  lastGuessCorrect,
  formatValue,
  onGuessHigher,
  onGuessLower,
  onAdvance,
  locale,
}: HorizonGameCardsProps) {
  const t = useTranslations("horizon");
  const grad = getCategoryGradient(itemA.category);

  return (
    <div className="relative grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-4 items-stretch flex-1">
      {/* ── Item A Card ── */}
      <div className="rounded-2xl overflow-hidden relative sm:min-h-[280px] md:min-h-[320px]">
        {/* Background image */}
        <img
          src={`/images/horizon/${getImageSlug(itemA.id)}.webp`}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/60" />
        {/* Ambient glow */}
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse at center, ${grad.glow} 0%, transparent 70%)`,
          }}
        />

        <div className="relative z-[1] flex flex-col items-center justify-center text-center p-3 sm:p-6 h-full">
          <h3 className="text-lg sm:text-h2 font-heading text-white mb-1 sm:mb-4 drop-shadow-lg">
            {translateName(itemA.id, itemA.name, locale)}
          </h3>
          <p className="text-3xl sm:text-5xl font-heading font-bold text-primary text-glow-primary">
            {formatValue(itemA.value, "")}{" "}
            <span className="text-sm sm:text-lg font-semibold opacity-70">{translateUnit(itemA.unit, locale)}</span>
          </p>
        </div>
      </div>

      {/* ── VS Separator ── */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none">
        <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-full bg-surface-1 border-2 border-primary glow-primary flex items-center justify-center">
          <span className="text-sm sm:text-h3 font-heading font-bold text-primary text-glow-primary">
            VS
          </span>
        </div>
      </div>

      {/* ── Item B Card ── */}
      <div
        className={`rounded-2xl overflow-hidden relative sm:min-h-[280px] md:min-h-[320px] transition-colors duration-500 ${
          phase === "revealing"
            ? lastGuessCorrect
              ? "animate-stats-card-flash-correct"
              : "animate-stats-card-flash-incorrect"
            : ""
        }`}
      >
        {/* Background image */}
        <img
          src={`/images/horizon/${getImageSlug(itemB.id)}.webp`}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Dark overlay — shifts color on reveal */}
        <div
          className={`absolute inset-0 transition-colors duration-500 ${
            phase === "revealing"
              ? lastGuessCorrect
                ? "bg-success/15"
                : "bg-error/15"
              : "bg-black/60"
          }`}
        />
        {/* Ambient glow */}
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse at center, ${grad.glow} 0%, transparent 70%)`,
          }}
        />

        <div className="relative z-[1] flex flex-col items-center justify-center text-center p-3 sm:p-6 h-full">
          <h3 className="text-lg sm:text-h2 font-heading text-white mb-1 sm:mb-4 drop-shadow-lg">
            {translateName(itemB.id, itemB.name, locale)}
          </h3>

          {phase === "revealing" ? (
            <>
              <p
                className={`text-3xl sm:text-5xl font-heading font-bold animate-stats-value-reveal ${
                  lastGuessCorrect
                    ? "text-success text-glow-success"
                    : "text-error text-glow-error"
                }`}
              >
                {formatValue(itemB.value, "")}{" "}
                <span className="text-base sm:text-lg font-semibold opacity-70">{translateUnit(itemB.unit, locale)}</span>
              </p>
              {translateTrapNote(itemB.id, itemB.trapNote, locale) && (
                <p className="text-body-small text-text-muted italic mt-4 max-w-xs">
                  {translateTrapNote(itemB.id, itemB.trapNote, locale)}
                </p>
              )}
              {lastGuessCorrect && (
                <button
                  className="stats-btn-next flex items-center justify-center gap-2 sm:gap-3 px-6 sm:px-8 py-3 sm:py-4 mt-3 sm:mt-4 w-full max-w-[300px] cursor-pointer"
                  onClick={onAdvance}
                >
                  {t("next")}
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              )}
            </>
          ) : (
            <>
              <p className="text-3xl sm:text-5xl font-heading font-bold text-primary text-glow-primary animate-pulse mb-2 sm:mb-6">
                ???
              </p>

              {/* Neon Higher / Lower buttons */}
              <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-col sm:gap-3 w-full max-w-[300px]">
                <button
                  className="stats-btn-higher flex items-center justify-center gap-2 sm:gap-3 px-4 sm:px-8 py-3 sm:py-4 cursor-pointer"
                  onClick={onGuessHigher}
                >
                  <svg
                    className="w-5 h-5 sm:w-6 sm:h-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 15l7-7 7 7"
                    />
                  </svg>
                  {t("higher")}
                </button>
                <button
                  className="stats-btn-lower flex items-center justify-center gap-2 sm:gap-3 px-4 sm:px-8 py-3 sm:py-4 cursor-pointer"
                  onClick={onGuessLower}
                >
                  <svg
                    className="w-5 h-5 sm:w-6 sm:h-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                  {t("lower")}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
});
