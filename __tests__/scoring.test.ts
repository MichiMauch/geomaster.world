import { describe, it, expect } from 'vitest'
import {
  calculateScore,
  getCurrentScoringVersion,
  getScoringStrategy,
  getAllScoringVersions,
} from '@/lib/scoring'
import {
  DistanceOnlyScoringStrategy,
  TimeBasedScoringStrategy,
  FairTimeScoringStrategy,
  getScoringStrategyByVersion,
  SCORING_STRATEGIES,
} from '@/lib/scoring/strategies'

// Use image:garten for tests since country types are now in database
const TEST_GAME_TYPE = 'image:garten'
const TEST_SCALE_FACTOR = 0.035 // km (same as image:garten)

describe('Scoring System', () => {
  describe('calculateScore', () => {
    it('should return max score (100) for perfect guess with v1', () => {
      const score = calculateScore(
        { distanceKm: 0, timeSeconds: null, gameType: TEST_GAME_TYPE },
        1
      )
      expect(score).toBe(100)
    })

    it('should return lower score for larger distance with v1', () => {
      const score = calculateScore(
        { distanceKm: 0.05, timeSeconds: null, gameType: TEST_GAME_TYPE },
        1
      )
      expect(score).toBeLessThan(100)
      expect(score).toBeGreaterThan(0)
    })

    it('should use current version when not specified', () => {
      const score = calculateScore({
        distanceKm: 0,
        timeSeconds: 5,
        gameType: TEST_GAME_TYPE,
      })
      // v4 with time bonus should give more than 100
      expect(score).toBeGreaterThan(100)
    })

    it('should respect custom scoreScaleFactor', () => {
      const scoreDefault = calculateScore(
        { distanceKm: 0.02, timeSeconds: null, gameType: TEST_GAME_TYPE },
        1
      )
      const scoreCustom = calculateScore(
        { distanceKm: 0.02, timeSeconds: null, gameType: TEST_GAME_TYPE, scoreScaleFactor: 0.1 },
        1
      )
      expect(scoreCustom).toBeGreaterThan(scoreDefault)
    })
  })

  describe('getCurrentScoringVersion', () => {
    it('should return current scoring version', () => {
      const version = getCurrentScoringVersion()
      expect(version).toBe(4)
    })
  })

  describe('getScoringStrategy', () => {
    it('should return strategy for valid version', () => {
      const strategy = getScoringStrategy(1)
      expect(strategy.version).toBe(1)
      expect(strategy.name).toBe('Distance Only')
    })

    it('should return v2 strategy', () => {
      const strategy = getScoringStrategy(2)
      expect(strategy.version).toBe(2)
      expect(strategy.name).toBe('Time-Based Scoring')
    })
  })

  describe('getAllScoringVersions', () => {
    it('should return all available versions sorted', () => {
      const versions = getAllScoringVersions()
      expect(versions).toContain(1)
      expect(versions).toContain(2)
      expect(versions).toContain(3)
      expect(versions).toContain(4)
      expect(versions).toEqual([1, 2, 3, 4])
    })
  })
})

describe('DistanceOnlyScoringStrategy (v1)', () => {
  it('should return 100 for 0 distance', () => {
    const score = DistanceOnlyScoringStrategy.calculateRoundScore({
      distanceKm: 0,
      timeSeconds: null,
      gameType: TEST_GAME_TYPE,
    })
    expect(score).toBe(100)
  })

  it('should return ~37 points at scoreScaleFactor distance', () => {
    // e^-1 ≈ 0.368, using explicit scoreScaleFactor for clarity
    const scaleFactor = 100 // km
    const score = DistanceOnlyScoringStrategy.calculateRoundScore({
      distanceKm: scaleFactor,
      timeSeconds: null,
      gameType: TEST_GAME_TYPE,
      scoreScaleFactor: scaleFactor,
    })
    expect(score).toBeGreaterThan(35)
    expect(score).toBeLessThan(40)
  })

  it('should approach 0 for very large distances', () => {
    const score = DistanceOnlyScoringStrategy.calculateRoundScore({
      distanceKm: 1,
      timeSeconds: null,
      gameType: TEST_GAME_TYPE,
      scoreScaleFactor: 0.035, // Use image:garten scale
    })
    expect(score).toBeLessThan(5)
  })

  it('should ignore time parameter', () => {
    const scoreNoTime = DistanceOnlyScoringStrategy.calculateRoundScore({
      distanceKm: 0.02,
      timeSeconds: null,
      gameType: TEST_GAME_TYPE,
    })
    const scoreWithTime = DistanceOnlyScoringStrategy.calculateRoundScore({
      distanceKm: 0.02,
      timeSeconds: 1,
      gameType: TEST_GAME_TYPE,
    })
    expect(scoreNoTime).toBe(scoreWithTime)
  })
})

describe('TimeBasedScoringStrategy (v2)', () => {
  it('should return more than 100 for perfect guess with fast time', () => {
    const score = TimeBasedScoringStrategy.calculateRoundScore({
      distanceKm: 0,
      timeSeconds: 0,
      gameType: TEST_GAME_TYPE,
    })
    // Should be 100 * 3.0 = 300
    expect(score).toBe(300)
  })

  it('should return exactly 100 for perfect guess with no time data', () => {
    const score = TimeBasedScoringStrategy.calculateRoundScore({
      distanceKm: 0,
      timeSeconds: null,
      gameType: TEST_GAME_TYPE,
    })
    expect(score).toBe(100)
  })

  it('should give higher score for faster times', () => {
    const scoreFast = TimeBasedScoringStrategy.calculateRoundScore({
      distanceKm: 0.02,
      timeSeconds: 1,
      gameType: TEST_GAME_TYPE,
    })
    const scoreSlow = TimeBasedScoringStrategy.calculateRoundScore({
      distanceKm: 0.02,
      timeSeconds: 30,
      gameType: TEST_GAME_TYPE,
    })
    expect(scoreFast).toBeGreaterThan(scoreSlow)
  })

  it('should cap time multiplier at 3.0x', () => {
    const scoreInstant = TimeBasedScoringStrategy.calculateRoundScore({
      distanceKm: 0,
      timeSeconds: 0,
      gameType: TEST_GAME_TYPE,
    })
    const scoreOneSecond = TimeBasedScoringStrategy.calculateRoundScore({
      distanceKm: 0,
      timeSeconds: 1,
      gameType: TEST_GAME_TYPE,
    })
    // Both should be 300 (3.0x multiplier cap)
    expect(scoreInstant).toBe(300)
    expect(scoreOneSecond).toBe(300)
  })

  it('should handle negative time as no bonus', () => {
    const score = TimeBasedScoringStrategy.calculateRoundScore({
      distanceKm: 0,
      timeSeconds: -5,
      gameType: TEST_GAME_TYPE,
    })
    expect(score).toBe(100) // No time bonus
  })
})

describe('FairTimeScoringStrategy (v4)', () => {
  it('should return 150 for perfect guess with instant time (50% bonus)', () => {
    const score = FairTimeScoringStrategy.calculateRoundScore({
      distanceKm: 0,
      timeSeconds: 0,
      gameType: TEST_GAME_TYPE,
      timeLimitSeconds: 30,
    })
    // Should be 100 * 1.5 = 150
    expect(score).toBe(150)
  })

  it('should return 125 for perfect guess at half time (25% bonus)', () => {
    const score = FairTimeScoringStrategy.calculateRoundScore({
      distanceKm: 0,
      timeSeconds: 15,
      gameType: TEST_GAME_TYPE,
      timeLimitSeconds: 30,
    })
    // Should be 100 * 1.25 = 125
    expect(score).toBe(125)
  })

  it('should return 100 for perfect guess at time limit (no bonus)', () => {
    const score = FairTimeScoringStrategy.calculateRoundScore({
      distanceKm: 0,
      timeSeconds: 30,
      gameType: TEST_GAME_TYPE,
      timeLimitSeconds: 30,
    })
    // Should be 100 * 1.0 = 100
    expect(score).toBe(100)
  })

  it('should return 100 for perfect guess with no time data', () => {
    const score = FairTimeScoringStrategy.calculateRoundScore({
      distanceKm: 0,
      timeSeconds: null,
      gameType: TEST_GAME_TYPE,
      timeLimitSeconds: 30,
    })
    // No time data = no bonus
    expect(score).toBe(100)
  })

  it('should give higher score for faster times', () => {
    const scoreFast = FairTimeScoringStrategy.calculateRoundScore({
      distanceKm: 100,
      timeSeconds: 5,
      gameType: TEST_GAME_TYPE,
      scoreScaleFactor: 3000,
      timeLimitSeconds: 30,
    })
    const scoreSlow = FairTimeScoringStrategy.calculateRoundScore({
      distanceKm: 100,
      timeSeconds: 25,
      gameType: TEST_GAME_TYPE,
      scoreScaleFactor: 3000,
      timeLimitSeconds: 30,
    })
    expect(scoreFast).toBeGreaterThan(scoreSlow)
  })

  it('should cap time bonus at 50% (max multiplier 1.5x)', () => {
    const scoreInstant = FairTimeScoringStrategy.calculateRoundScore({
      distanceKm: 0,
      timeSeconds: 0,
      gameType: TEST_GAME_TYPE,
      timeLimitSeconds: 30,
    })
    // Max is 150 (100 * 1.5)
    expect(scoreInstant).toBe(150)
    expect(scoreInstant).toBeLessThanOrEqual(150)
  })

  it('should use default 30s time limit when not specified', () => {
    const score = FairTimeScoringStrategy.calculateRoundScore({
      distanceKm: 0,
      timeSeconds: 15,
      gameType: TEST_GAME_TYPE,
    })
    // 15s of 30s = 50% through, bonus = 0.5 * 0.5 = 0.25
    expect(score).toBe(125)
  })

  it('should handle time exceeding limit', () => {
    const score = FairTimeScoringStrategy.calculateRoundScore({
      distanceKm: 0,
      timeSeconds: 60,
      gameType: TEST_GAME_TYPE,
      timeLimitSeconds: 30,
    })
    // Time clamped to limit, no bonus
    expect(score).toBe(100)
  })
})

describe('getScoringStrategyByVersion', () => {
  it('should return correct strategy for valid version', () => {
    expect(getScoringStrategyByVersion(1)).toBe(SCORING_STRATEGIES[1])
    expect(getScoringStrategyByVersion(2)).toBe(SCORING_STRATEGIES[2])
    expect(getScoringStrategyByVersion(3)).toBe(SCORING_STRATEGIES[3])
    expect(getScoringStrategyByVersion(4)).toBe(SCORING_STRATEGIES[4])
  })

  it('should fallback to v1 for unknown version', () => {
    const strategy = getScoringStrategyByVersion(999)
    expect(strategy.version).toBe(1)
  })
})
