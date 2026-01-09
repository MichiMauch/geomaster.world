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
  getScoringStrategyByVersion,
  SCORING_STRATEGIES,
} from '@/lib/scoring/strategies'

describe('Scoring System', () => {
  describe('calculateScore', () => {
    it('should return max score (100) for perfect guess with v1', () => {
      const score = calculateScore(
        { distanceKm: 0, timeSeconds: null, gameType: 'country:switzerland' },
        1
      )
      expect(score).toBe(100)
    })

    it('should return lower score for larger distance with v1', () => {
      const score = calculateScore(
        { distanceKm: 100, timeSeconds: null, gameType: 'country:switzerland' },
        1
      )
      expect(score).toBeLessThan(100)
      expect(score).toBeGreaterThan(0)
    })

    it('should use current version when not specified', () => {
      const score = calculateScore({
        distanceKm: 0,
        timeSeconds: 5,
        gameType: 'country:switzerland',
      })
      // v2 with time bonus should give more than 100
      expect(score).toBeGreaterThan(100)
    })

    it('should respect custom scoreScaleFactor', () => {
      const scoreDefault = calculateScore(
        { distanceKm: 50, timeSeconds: null, gameType: 'country:switzerland' },
        1
      )
      const scoreCustom = calculateScore(
        { distanceKm: 50, timeSeconds: null, gameType: 'country:switzerland', scoreScaleFactor: 200 },
        1
      )
      expect(scoreCustom).toBeGreaterThan(scoreDefault)
    })
  })

  describe('getCurrentScoringVersion', () => {
    it('should return current scoring version', () => {
      const version = getCurrentScoringVersion()
      expect(version).toBe(2)
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
      expect(versions).toEqual([1, 2])
    })
  })
})

describe('DistanceOnlyScoringStrategy (v1)', () => {
  it('should return 100 for 0 distance', () => {
    const score = DistanceOnlyScoringStrategy.calculateRoundScore({
      distanceKm: 0,
      timeSeconds: null,
      gameType: 'country:switzerland',
    })
    expect(score).toBe(100)
  })

  it('should return ~37 points at scoreScaleFactor distance', () => {
    // e^-1 ≈ 0.368
    const score = DistanceOnlyScoringStrategy.calculateRoundScore({
      distanceKm: 100, // scoreScaleFactor for switzerland
      timeSeconds: null,
      gameType: 'country:switzerland',
    })
    expect(score).toBeGreaterThan(35)
    expect(score).toBeLessThan(40)
  })

  it('should approach 0 for very large distances', () => {
    const score = DistanceOnlyScoringStrategy.calculateRoundScore({
      distanceKm: 1000,
      timeSeconds: null,
      gameType: 'country:switzerland',
    })
    expect(score).toBeLessThan(5)
  })

  it('should ignore time parameter', () => {
    const scoreNoTime = DistanceOnlyScoringStrategy.calculateRoundScore({
      distanceKm: 50,
      timeSeconds: null,
      gameType: 'country:switzerland',
    })
    const scoreWithTime = DistanceOnlyScoringStrategy.calculateRoundScore({
      distanceKm: 50,
      timeSeconds: 1,
      gameType: 'country:switzerland',
    })
    expect(scoreNoTime).toBe(scoreWithTime)
  })
})

describe('TimeBasedScoringStrategy (v2)', () => {
  it('should return more than 100 for perfect guess with fast time', () => {
    const score = TimeBasedScoringStrategy.calculateRoundScore({
      distanceKm: 0,
      timeSeconds: 0,
      gameType: 'country:switzerland',
    })
    // Should be 100 * 3.0 = 300
    expect(score).toBe(300)
  })

  it('should return exactly 100 for perfect guess with no time data', () => {
    const score = TimeBasedScoringStrategy.calculateRoundScore({
      distanceKm: 0,
      timeSeconds: null,
      gameType: 'country:switzerland',
    })
    expect(score).toBe(100)
  })

  it('should give higher score for faster times', () => {
    const scoreFast = TimeBasedScoringStrategy.calculateRoundScore({
      distanceKm: 50,
      timeSeconds: 1,
      gameType: 'country:switzerland',
    })
    const scoreSlow = TimeBasedScoringStrategy.calculateRoundScore({
      distanceKm: 50,
      timeSeconds: 30,
      gameType: 'country:switzerland',
    })
    expect(scoreFast).toBeGreaterThan(scoreSlow)
  })

  it('should cap time multiplier at 3.0x', () => {
    const scoreInstant = TimeBasedScoringStrategy.calculateRoundScore({
      distanceKm: 0,
      timeSeconds: 0,
      gameType: 'country:switzerland',
    })
    const scoreOneSecond = TimeBasedScoringStrategy.calculateRoundScore({
      distanceKm: 0,
      timeSeconds: 1,
      gameType: 'country:switzerland',
    })
    // Both should be 300 (3.0x multiplier cap)
    expect(scoreInstant).toBe(300)
    expect(scoreOneSecond).toBe(300)
  })

  it('should handle negative time as no bonus', () => {
    const score = TimeBasedScoringStrategy.calculateRoundScore({
      distanceKm: 0,
      timeSeconds: -5,
      gameType: 'country:switzerland',
    })
    expect(score).toBe(100) // No time bonus
  })
})

describe('getScoringStrategyByVersion', () => {
  it('should return correct strategy for valid version', () => {
    expect(getScoringStrategyByVersion(1)).toBe(SCORING_STRATEGIES[1])
    expect(getScoringStrategyByVersion(2)).toBe(SCORING_STRATEGIES[2])
  })

  it('should fallback to v1 for unknown version', () => {
    const strategy = getScoringStrategyByVersion(999)
    expect(strategy.version).toBe(1)
  })
})
