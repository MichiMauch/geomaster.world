"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useLocale } from "next-intl";
import confetti from "canvas-confetti";
import { useHorizon, ROUND_TIME_LIMIT } from "./hooks/useHorizon";
import "./horizon.css";
import { HorizonStartScreen } from "./components/HorizonStartScreen";
import { HorizonHUD } from "./components/HorizonHUD";
import { HorizonGameCards } from "./components/HorizonGameCards";
import { HorizonGameOver } from "./components/HorizonGameOver";
import { ShareResultModal } from "@/components/guesser/ShareResultModal";

export default function HorizonPage() {
  const locale = useLocale();
  const game = useHorizon();

  const boundFormatValue = useCallback(
    (value: number, unit: string) => game.formatValue(value, unit, locale),
    [game.formatValue, locale]
  );

  const prevScoreRef = useRef(0);
  const [scoreAnimating, setScoreAnimating] = useState(false);
  const [availablePoints, setAvailablePoints] = useState(1000);
  const roundStartRef = useRef(0);

  // Hold-to-start reactor
  const [holdProgress, setHoldProgress] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const [showFlash, setShowFlash] = useState(false);
  const holdStartRef = useRef<number | null>(null);
  const holdRafRef = useRef<number | null>(null);
  const HOLD_DURATION = 1500;

  // Sync highscore: use server value (source of truth), fallback to localStorage
  const [showShareModal, setShowShareModal] = useState(false);
  const [savedHs, setSavedHs] = useState(0);
  const [topPlayer, setTopPlayer] = useState<{ name: string; score: number } | null>(null);
  useEffect(() => {
    // Immediately show localStorage value to avoid blank
    try {
      const v = localStorage.getItem("horizon_hs");
      if (v) setSavedHs(parseInt(v, 10));
    } catch {}

    // Then fetch authoritative value from server
    fetch("/api/horizon/results/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.bestScore != null) {
          setSavedHs(data.bestScore);
          // Sync localStorage to match server
          try { localStorage.setItem("horizon_hs", String(data.bestScore)); } catch {}
        }
        if (data?.topPlayer) {
          setTopPlayer(data.topPlayer);
        }
      })
      .catch(() => {});
  }, [game.phase]);

  // Animate score changes
  useEffect(() => {
    if (game.score !== prevScoreRef.current && game.score > 0) {
      setScoreAnimating(true);
      const t = setTimeout(() => setScoreAnimating(false), 400);
      prevScoreRef.current = game.score;
      return () => clearTimeout(t);
    }
    prevScoreRef.current = game.score;
  }, [game.score]);

  // Confetti on new highscore
  const confettiFired = useRef(false);
  useEffect(() => {
    if (game.phase === "gameOver" && game.score > 0 && game.score >= game.highscore && !confettiFired.current) {
      confettiFired.current = true;
      const end = Date.now() + 2000;
      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.6 },
          colors: ["#FFD700", "#FFA500", "#00D9FF", "#FF6B35"],
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.6 },
          colors: ["#FFD700", "#FFA500", "#00D9FF", "#FF6B35"],
        });
        if (Date.now() < end) requestAnimationFrame(frame);
      };
      frame();
    }
    if (game.phase !== "gameOver") {
      confettiFired.current = false;
    }
  }, [game.phase, game.score, game.highscore]);

  // Reset available points on round change
  useEffect(() => {
    if (game.phase !== "playing") return;
    roundStartRef.current = Date.now();
    setAvailablePoints(1000);
  }, [game.phase, game.roundKey]);

  // Live points countdown (tick every 100ms)
  useEffect(() => {
    if (game.phase !== "playing") return;
    const id = setInterval(() => {
      const elapsed = (Date.now() - roundStartRef.current) / 1000;
      setAvailablePoints(Math.max(100, Math.round(1000 - elapsed * 90)));
    }, 100);
    return () => clearInterval(id);
  }, [game.phase, game.roundKey]);

  // Round timer — game over if no answer within time limit
  useEffect(() => {
    if (game.phase !== "playing") return;
    const t = setTimeout(() => game.timeUp(), ROUND_TIME_LIMIT);
    return () => clearTimeout(t);
  }, [game.phase, game.roundKey, game.timeUp]);

  const handleStart = useCallback(() => {
    game.startGame();
  }, [game]);

  const handlePlayAgain = useCallback(() => {
    game.startGame();
  }, [game]);

  // Hold-to-start handlers
  const handleHoldStart = useCallback(() => {
    if (game.loading) return;
    holdStartRef.current = performance.now();
    setIsHolding(true);
    const tick = () => {
      if (holdStartRef.current === null) return;
      const elapsed = performance.now() - holdStartRef.current;
      const progress = Math.min(elapsed / HOLD_DURATION, 1);
      setHoldProgress(progress);
      if (progress >= 1) {
        // Fire!
        setShowFlash(true);
        try { navigator.vibrate?.(50); } catch {}
        setTimeout(() => handleStart(), 150);
        holdStartRef.current = null;
        setIsHolding(false);
        return;
      }
      holdRafRef.current = requestAnimationFrame(tick);
    };
    holdRafRef.current = requestAnimationFrame(tick);
  }, [game.loading, handleStart]);

  const handleHoldEnd = useCallback(() => {
    holdStartRef.current = null;
    setIsHolding(false);
    if (holdRafRef.current !== null) {
      cancelAnimationFrame(holdRafRef.current);
      holdRafRef.current = null;
    }
    setHoldProgress(0);
  }, []);

  // Cleanup RAF on unmount
  useEffect(() => {
    return () => {
      if (holdRafRef.current !== null) cancelAnimationFrame(holdRafRef.current);
    };
  }, []);

  const isNewHighscore = game.phase === "gameOver" && game.score > 0 && game.score >= game.highscore;

  return (
    <div className="relative min-h-screen">
      {/* Background image — 9:16 on mobile, 4:3 on desktop (hidden during idle — split world replaces it) */}
      <div className={`absolute inset-0 -z-10 ${game.phase === "idle" ? "hidden" : ""}`}>
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
      </div>

      <div className="container max-w-4xl mx-auto px-3 sm:px-4 py-2 sm:py-8">
        {/* ─── IDLE PHASE ─── */}
        {game.phase === "idle" && (
          <HorizonStartScreen
            locale={locale}
            loading={game.loading}
            error={game.error}
            savedHs={savedHs}
            topPlayer={topPlayer}
            holdProgress={holdProgress}
            isHolding={isHolding}
            showFlash={showFlash}
            onHoldStart={handleHoldStart}
            onHoldEnd={handleHoldEnd}
          />
        )}

        {/* ─── PLAYING / REVEALING PHASE ─── */}
        {(game.phase === "playing" || game.phase === "revealing") &&
          game.itemA &&
          game.itemB && (
            <div key={`round-${game.roundKey}`} className="animate-fade-in flex flex-col" style={{ minHeight: "calc(100dvh - 8rem)" }}>
              <HorizonHUD
                score={game.score}
                highscore={game.highscore}
                availablePoints={availablePoints}
                lastRoundPoints={game.lastRoundPoints}
                roundKey={game.roundKey}
                scoreAnimating={scoreAnimating}
                phase={game.phase}
                category={game.itemA.category}
                locale={locale}
              />
              <HorizonGameCards
                itemA={game.itemA}
                itemB={game.itemB}
                phase={game.phase}
                lastGuessCorrect={game.lastGuessCorrect}
                formatValue={boundFormatValue}
                onGuessHigher={() => game.guess(true)}
                onGuessLower={() => game.guess(false)}
                onAdvance={() => game.advanceAfterReveal()}
                locale={locale}
              />
            </div>
          )}

        {/* ─── GAME OVER PHASE ─── */}
        {game.phase === "gameOver" && game.itemA && game.itemB && (
          <HorizonGameOver
            score={game.score}
            highscore={game.highscore}
            isNewHighscore={isNewHighscore}
            itemA={game.itemA}
            itemB={game.itemB}
            formatValue={boundFormatValue}
            onPlayAgain={handlePlayAgain}
            onReset={game.resetGame}
            onShare={() => setShowShareModal(true)}
            locale={locale}
          />
        )}
      </div>

      <ShareResultModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        locale={locale}
        gameType="horizon"
        gameTypeName="Horizon"
        score={game.score}
      />
    </div>
  );
}
