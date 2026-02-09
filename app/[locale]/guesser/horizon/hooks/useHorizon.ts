"use client";

import { useState, useCallback, useRef, useEffect } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface HorizonItem {
  id: string;
  name: string;
  value: number;
  unit: string;
  category: string;
  difficulty: number;
  trapNote: string | null;
}

export type GamePhase = "idle" | "playing" | "revealing" | "gameOver";

export const ROUND_TIME_LIMIT = 10_000; // 10 seconds in ms

export interface CampaignConfig {
  category: string;
  count: number;
  maxErrors: number;
}

export interface HorizonState {
  phase: GamePhase;
  /** Left item (value visible) */
  itemA: HorizonItem | null;
  /** Right item (value hidden until reveal) */
  itemB: HorizonItem | null;
  score: number;
  highscore: number;
  /** true when the last guess was correct (for reveal animation) */
  lastGuessCorrect: boolean | null;
  /** Points scored in the last round (for floating "+850" animation) */
  lastRoundPoints: number | null;
  /** Increments each round, used as key for CSS animation reset */
  roundKey: number;
  /** Number of rounds survived (correct answers) */
  roundsSurvived: number;
  /** Number of errors (wrong answers) — tracked for campaign mode */
  errorsCount: number;
  /** Campaign: true = won by reaching target rounds, false = lost */
  campaignWon: boolean | null;
  loading: boolean;
  error: string | null;
}

export interface UseHorizonReturn extends HorizonState {
  startGame: () => Promise<void>;
  guess: (higher: boolean) => void;
  advanceAfterReveal: () => void;
  resetGame: () => void;
  timeUp: () => void;
  formatValue: (value: number, unit: string, locale?: string) => string;
  roundsSurvived: number;
  isCampaign: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

const HS_KEY = "horizon_hs";

function loadHighscore(): number {
  try {
    const val = localStorage.getItem(HS_KEY);
    return val ? parseInt(val, 10) : 0;
  } catch {
    return 0;
  }
}

function saveHighscore(score: number): void {
  try {
    const current = loadHighscore();
    if (score > current) {
      localStorage.setItem(HS_KEY, String(score));
    }
  } catch {
    // localStorage unavailable
  }
}

/**
 * Format a numeric value + unit for display.
 * Examples (de): 30000000, "Einwohner" → "30,0 Mio. Einwohner"
 * Examples (en): 30000000, "Population" → "30.0M Population"
 */
export function formatValue(value: number, unit: string, locale?: string): string {
  const absValue = Math.abs(value);
  const loc = locale === "de" ? "de-CH" : "en-US";

  if (absValue >= 1_000_000_000) {
    const raw = (value / 1_000_000_000).toFixed(2);
    const formatted = locale === "de"
      ? raw.replace(".", ",").replace(/,?0+$/, "")
      : raw.replace(/\.?0+$/, "");
    const abbr = locale === "de" ? "Mrd." : "B";
    return `${formatted} ${abbr} ${unit}`;
  }

  if (absValue >= 1_000_000) {
    const raw = (value / 1_000_000).toFixed(1);
    const formatted = locale === "de"
      ? raw.replace(".", ",").replace(/,0$/, "")
      : raw.replace(/\.0$/, "");
    const abbr = locale === "de" ? "Mio." : "M";
    return `${formatted} ${abbr} ${unit}`;
  }

  if (absValue >= 10_000) {
    return `${value.toLocaleString(loc)} ${unit}`;
  }

  // Small numbers: use locale formatting but avoid unnecessary decimals
  if (Number.isInteger(value)) {
    return `${value.toLocaleString(loc)} ${unit}`;
  }

  return `${value.toLocaleString(loc, { maximumFractionDigits: 2 })} ${unit}`;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useHorizon(campaignConfig?: CampaignConfig): UseHorizonReturn {
  const [state, setState] = useState<HorizonState>({
    phase: "idle",
    itemA: null,
    itemB: null,
    score: 0,
    highscore: 0,
    lastGuessCorrect: null,
    lastRoundPoints: null,
    roundKey: 0,
    roundsSurvived: 0,
    errorsCount: 0,
    campaignWon: null,
    loading: false,
    error: null,
  });

  const campaignConfigRef = useRef(campaignConfig);

  // All items loaded, grouped by category
  const allItemsRef = useRef<Map<string, HorizonItem[]>>(new Map());
  const roundStartedAtRef = useRef<number>(0);
  // Track used IDs to prevent duplicates
  const usedIdsRef = useRef<Set<string>>(new Set());
  // Track recently used categories to avoid repetition
  const recentCategoriesRef = useRef<string[]>([]);
  // Track used pairs to prevent same matchup even after recycle
  const usedPairsRef = useRef<Set<string>>(new Set());

  // ── Save result to server (fire-and-forget) ─────────────────────────────

  const saveResultToServer = useCallback((score: number, roundsSurvived: number) => {
    // Skip saving to horizon results in campaign mode
    if (campaignConfigRef.current) return;

    fetch("/api/horizon/results", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ score, roundsSurvived }),
    }).catch(() => {
      // Silently ignore — user may not be logged in
    });
  }, []);

  // Save result to server when game ends
  const hasSavedRef = useRef(false);

  useEffect(() => {
    if (state.phase === "gameOver" && !hasSavedRef.current) {
      hasSavedRef.current = true;
      saveResultToServer(state.score, state.roundsSurvived);
    }
    if (state.phase === "playing") {
      hasSavedRef.current = false;
    }
  }, [state.phase, state.score, state.roundsSurvived, saveResultToServer]);

  // ── Pick a random pair (same category, weighted by pool size) ─────────

  const pickChaosPair = useCallback(():
    | [HorizonItem, HorizonItem]
    | null => {
    const categories = [...allItemsRef.current.keys()];

    // Build weighted pool: categories with more unused items get picked more often
    // Also penalize recently used categories
    const recentCats = new Set(recentCategoriesRef.current.slice(-3));
    const candidates: { cat: string; unused: HorizonItem[] }[] = [];

    for (const cat of categories) {
      const items = allItemsRef.current.get(cat)!;
      const unused = items.filter((i) => !usedIdsRef.current.has(i.id));
      if (unused.length >= 2) {
        candidates.push({ cat, unused });
      }
    }

    if (candidates.length === 0) return null;

    // Weighted random: weight = unusedCount, halved if recently used
    const weights = candidates.map((c) => {
      const base = c.unused.length;
      return recentCats.has(c.cat) ? Math.max(1, Math.floor(base / 2)) : base;
    });
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * totalWeight;
    let chosen = candidates[0];
    for (let i = 0; i < candidates.length; i++) {
      r -= weights[i];
      if (r <= 0) {
        chosen = candidates[i];
        break;
      }
    }

    // Pick two random items, avoiding recently seen pairs
    const shuffled = shuffleArray(chosen.unused);
    let a = shuffled[0];
    let b = shuffled[1];

    // Try to avoid duplicate pairs (up to 3 attempts)
    for (let attempt = 0; attempt < 3 && shuffled.length > 2; attempt++) {
      const pairKey = [a.id, b.id].sort().join("|");
      if (!usedPairsRef.current.has(pairKey)) break;
      // Re-shuffle and try different combination
      const reshuffled = shuffleArray(shuffled);
      a = reshuffled[0];
      b = reshuffled[1];
    }

    usedIdsRef.current.add(a.id);
    usedIdsRef.current.add(b.id);
    usedPairsRef.current.add([a.id, b.id].sort().join("|"));
    recentCategoriesRef.current.push(chosen.cat);
    if (recentCategoriesRef.current.length > 5) {
      recentCategoriesRef.current.shift();
    }

    return [a, b];
  }, []);

  // ── Start game ──────────────────────────────────────────────────────────

  const startGame = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    usedIdsRef.current = new Set();
    usedPairsRef.current = new Set();
    recentCategoriesRef.current = [];
    allItemsRef.current = new Map();

    try {
      const res = await fetch("/api/horizon/items");
      if (!res.ok) throw new Error("Failed to fetch items");
      const data = await res.json();
      let items: HorizonItem[] = data.items;

      // Campaign mode: filter by category
      if (campaignConfigRef.current) {
        items = items.filter(
          (item) => item.category === campaignConfigRef.current!.category
        );
      }

      const grouped = new Map<string, HorizonItem[]>();
      for (const item of items) {
        if (!grouped.has(item.category)) {
          grouped.set(item.category, []);
        }
        grouped.get(item.category)!.push(item);
      }
      allItemsRef.current = grouped;

      const pair = pickChaosPair();
      if (!pair) throw new Error("Not enough items");

      const hs = campaignConfigRef.current ? 0 : loadHighscore();
      roundStartedAtRef.current = Date.now();

      setState({
        phase: "playing",
        itemA: pair[0],
        itemB: pair[1],
        score: 0,
        highscore: hs,
        lastGuessCorrect: null,
        lastRoundPoints: null,
        roundKey: 0,
        roundsSurvived: 0,
        errorsCount: 0,
        campaignWon: null,
        loading: false,
        error: null,
      });
    } catch (err) {
      setState((s) => ({
        ...s,
        loading: false,
        error: err instanceof Error ? err.message : "Unknown error",
      }));
    }
  }, [pickChaosPair]);

  // ── Guess handler ───────────────────────────────────────────────────────

  const guess = useCallback((higher: boolean) => {
    setState((prev) => {
      if (prev.phase !== "playing" || !prev.itemA || !prev.itemB) return prev;

      const a = prev.itemA.value;
      const b = prev.itemB.value;

      // Validate guess: draw always wins
      const isCorrect = higher ? b >= a : b <= a;

      // Speed-scoring: faster answers get more points
      const elapsed = (Date.now() - roundStartedAtRef.current) / 1000;
      const roundPoints = Math.max(100, Math.round(1000 - elapsed * 90));

      if (isCorrect) {
        return {
          ...prev,
          phase: "revealing" as const,
          lastGuessCorrect: true,
          score: prev.score + roundPoints,
          lastRoundPoints: roundPoints,
        };
      } else {
        // Campaign mode: track errors, allow continuation if under limit
        const cfg = campaignConfigRef.current;
        if (cfg) {
          const newErrors = prev.errorsCount + 1;
          if (newErrors > cfg.maxErrors) {
            // Too many errors → game over (lose)
            return {
              ...prev,
              phase: "gameOver" as const,
              lastGuessCorrect: false,
              errorsCount: newErrors,
              campaignWon: false,
            };
          }
          // Still under error limit → reveal the answer but continue
          return {
            ...prev,
            phase: "revealing" as const,
            lastGuessCorrect: false,
            errorsCount: newErrors,
            lastRoundPoints: null,
          };
        }

        // Normal mode: single wrong answer → game over
        const finalScore = prev.score;
        saveHighscore(finalScore);
        return {
          ...prev,
          phase: "gameOver" as const,
          lastGuessCorrect: false,
          highscore: Math.max(prev.highscore, finalScore),
        };
      }
    });
  }, []);

  // ── Advance after reveal animation ──────────────────────────────────────
  // Pick OUTSIDE setState to avoid React Strict Mode double-invocation consuming 2 items

  const advanceAfterReveal = useCallback(() => {
    let nextPair = pickChaosPair();

    // Pool exhausted → recycle item IDs but keep pair history to avoid repeats
    if (!nextPair && allItemsRef.current.size > 0) {
      usedIdsRef.current = new Set<string>();
      // usedPairsRef stays intact — prevents same matchups after recycle
      nextPair = pickChaosPair();
    }

    roundStartedAtRef.current = Date.now();

    setState((prev) => {
      if (prev.phase !== "revealing" || !prev.itemB) return prev;

      const newRoundsSurvived = prev.lastGuessCorrect
        ? prev.roundsSurvived + 1
        : prev.roundsSurvived;

      // Campaign mode: check if target reached (win condition)
      const cfg = campaignConfigRef.current;
      if (cfg && newRoundsSurvived >= cfg.count) {
        return {
          ...prev,
          phase: "gameOver" as const,
          roundsSurvived: newRoundsSurvived,
          campaignWon: true,
        };
      }

      if (!nextPair) {
        if (!cfg) saveHighscore(prev.score);
        return {
          ...prev,
          phase: "gameOver",
          roundsSurvived: newRoundsSurvived,
          highscore: cfg ? prev.highscore : Math.max(prev.highscore, prev.score),
          campaignWon: cfg ? newRoundsSurvived >= cfg.count : null,
        };
      }
      return {
        ...prev,
        itemA: nextPair[0],
        itemB: nextPair[1],
        phase: "playing",
        lastGuessCorrect: null,
        lastRoundPoints: null,
        roundKey: prev.roundKey + 1,
        roundsSurvived: newRoundsSurvived,
      };
    });
  }, [pickChaosPair]);

  // ── Reset ───────────────────────────────────────────────────────────────

  const resetGame = useCallback(() => {
    allItemsRef.current = new Map();
    usedIdsRef.current = new Set();
    usedPairsRef.current = new Set();
    recentCategoriesRef.current = [];
    setState({
      phase: "idle",
      itemA: null,
      itemB: null,
      score: 0,
      highscore: 0,
      lastGuessCorrect: null,
      lastRoundPoints: null,
      roundKey: 0,
      roundsSurvived: 0,
      errorsCount: 0,
      campaignWon: null,
      loading: false,
      error: null,
    });
  }, []);

  const timeUp = useCallback(() => {
    setState((prev) => {
      if (prev.phase !== "playing") return prev;
      if (!campaignConfigRef.current) saveHighscore(prev.score);
      return {
        ...prev,
        phase: "gameOver",
        lastGuessCorrect: false,
        highscore: campaignConfigRef.current ? prev.highscore : Math.max(prev.highscore, prev.score),
        campaignWon: campaignConfigRef.current ? false : null,
      };
    });
  }, []);

  return {
    ...state,
    startGame,
    guess,
    resetGame,
    timeUp,
    formatValue,
    advanceAfterReveal,
    isCampaign: !!campaignConfigRef.current,
  };
}
