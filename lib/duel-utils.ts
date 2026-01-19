import { nanoid } from "nanoid";

/**
 * Duel challenge data encoded in the challenge URL
 */
export interface DuelChallenge {
  seed: string;           // Seed for seededShuffle - determines location order
  gameType: string;       // e.g., "country:switzerland"
  challengerId: string;   // User ID of challenger
  challengerName: string; // Display name of challenger
  challengerScore: number; // Challenger's final score
  challengerTime: number;  // Challenger's total time in seconds
  challengerGameId: string; // Challenger's game ID (for reference)
}

/**
 * Generate a unique seed for a new duel
 */
export function generateDuelSeed(): string {
  return nanoid(12);
}

/**
 * Encode duel challenge data into a URL-safe base64 string
 */
export function encodeDuelChallenge(challenge: DuelChallenge): string {
  const json = JSON.stringify(challenge);
  // Use base64url encoding (URL-safe)
  if (typeof window !== "undefined") {
    return btoa(json).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }
  // Node.js environment
  return Buffer.from(json).toString("base64url");
}

/**
 * Decode duel challenge data from a URL-safe base64 string
 * Returns null if decoding fails
 */
export function decodeDuelChallenge(encoded: string): DuelChallenge | null {
  try {
    let json: string;
    // Add padding if needed
    const padded = encoded + "=".repeat((4 - (encoded.length % 4)) % 4);
    // Convert base64url back to base64
    const base64 = padded.replace(/-/g, "+").replace(/_/g, "/");

    if (typeof window !== "undefined") {
      json = atob(base64);
    } else {
      // Node.js environment
      json = Buffer.from(encoded, "base64url").toString("utf8");
    }

    const data = JSON.parse(json);

    // Validate required fields
    if (
      typeof data.seed !== "string" ||
      typeof data.gameType !== "string" ||
      typeof data.challengerId !== "string" ||
      typeof data.challengerName !== "string" ||
      typeof data.challengerScore !== "number" ||
      typeof data.challengerTime !== "number" ||
      typeof data.challengerGameId !== "string"
    ) {
      return null;
    }

    return data as DuelChallenge;
  } catch {
    return null;
  }
}

/**
 * Determine the winner of a duel
 * Rules:
 * 1. Higher score wins
 * 2. If tied: faster time wins
 * 3. If still tied: challenger wins (advantage)
 *
 * Returns: "challenger" | "accepter"
 */
export function determineDuelWinner(
  challengerScore: number,
  challengerTime: number,
  accepterScore: number,
  accepterTime: number
): "challenger" | "accepter" {
  // Higher score wins
  if (challengerScore > accepterScore) return "challenger";
  if (accepterScore > challengerScore) return "accepter";

  // Tied score: faster time wins
  if (challengerTime < accepterTime) return "challenger";
  if (accepterTime < challengerTime) return "accepter";

  // Complete tie: challenger wins
  return "challenger";
}

/**
 * Build the challenge URL for sharing
 */
export function buildChallengeUrl(
  baseUrl: string,
  locale: string,
  gameType: string,
  challenge: string
): string {
  return `${baseUrl}/${locale}/guesser/${encodeURIComponent(gameType)}/select-mode?challenge=${challenge}`;
}
