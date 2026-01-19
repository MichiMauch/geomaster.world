import { describe, it, expect } from "vitest";
import { seededShuffle } from "@/lib/utils";
import {
  generateDuelSeed,
  encodeDuelChallenge,
  decodeDuelChallenge,
  determineDuelWinner,
  buildChallengeUrl,
  type DuelChallenge,
} from "@/lib/duel-utils";

describe("seededShuffle", () => {
  it("should return same order for same seed", () => {
    const array = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const seed = "test-seed-123";

    const result1 = seededShuffle(array, seed);
    const result2 = seededShuffle(array, seed);

    expect(result1).toEqual(result2);
  });

  it("should return different order for different seeds", () => {
    const array = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    const result1 = seededShuffle(array, "seed-a");
    const result2 = seededShuffle(array, "seed-b");

    // Different seeds should produce different results
    // (with very high probability for 10 elements)
    expect(result1).not.toEqual(result2);
  });

  it("should not modify original array", () => {
    const original = [1, 2, 3, 4, 5];
    const copy = [...original];

    seededShuffle(original, "test");

    expect(original).toEqual(copy);
  });

  it("should contain all original elements", () => {
    const array = [1, 2, 3, 4, 5];
    const result = seededShuffle(array, "test");

    expect(result.sort()).toEqual(array.sort());
    expect(result.length).toBe(array.length);
  });
});

describe("generateDuelSeed", () => {
  it("should generate a non-empty string", () => {
    const seed = generateDuelSeed();
    expect(typeof seed).toBe("string");
    expect(seed.length).toBeGreaterThan(0);
  });

  it("should generate different seeds each time", () => {
    const seed1 = generateDuelSeed();
    const seed2 = generateDuelSeed();
    expect(seed1).not.toBe(seed2);
  });
});

describe("encodeDuelChallenge / decodeDuelChallenge", () => {
  const testChallenge: DuelChallenge = {
    seed: "test-seed-xyz",
    gameType: "country:switzerland",
    challengerId: "user-123",
    challengerName: "TestPlayer",
    challengerScore: 2500,
    challengerTime: 120,
    challengerGameId: "game-abc",
  };

  it("should encode and decode challenge correctly", () => {
    const encoded = encodeDuelChallenge(testChallenge);
    expect(typeof encoded).toBe("string");
    expect(encoded.length).toBeGreaterThan(0);

    const decoded = decodeDuelChallenge(encoded);
    expect(decoded).toEqual(testChallenge);
  });

  it("should produce URL-safe encoding", () => {
    const encoded = encodeDuelChallenge(testChallenge);
    // Should not contain +, /, or = (standard base64 chars)
    expect(encoded).not.toMatch(/[+/=]/);
  });

  it("should return null for invalid encoded string", () => {
    expect(decodeDuelChallenge("invalid")).toBeNull();
    expect(decodeDuelChallenge("")).toBeNull();
    expect(decodeDuelChallenge("eyJmb28iOiJiYXIifQ")).toBeNull(); // valid base64 but missing fields
  });
});

describe("determineDuelWinner", () => {
  it("should return challenger when challenger has higher score", () => {
    expect(determineDuelWinner(1000, 100, 800, 100)).toBe("challenger");
  });

  it("should return accepter when accepter has higher score", () => {
    expect(determineDuelWinner(800, 100, 1000, 100)).toBe("accepter");
  });

  it("should use time as tiebreaker when scores are equal", () => {
    // Same score, challenger is faster
    expect(determineDuelWinner(1000, 90, 1000, 100)).toBe("challenger");
    // Same score, accepter is faster
    expect(determineDuelWinner(1000, 100, 1000, 90)).toBe("accepter");
  });

  it("should favor challenger on complete tie", () => {
    expect(determineDuelWinner(1000, 100, 1000, 100)).toBe("challenger");
  });
});

describe("buildChallengeUrl", () => {
  it("should build correct URL", () => {
    const url = buildChallengeUrl(
      "https://geomaster.world",
      "de",
      "country:switzerland",
      "encoded-challenge-string"
    );

    expect(url).toBe(
      "https://geomaster.world/de/guesser/country%3Aswitzerland/select-mode?challenge=encoded-challenge-string"
    );
  });
});
