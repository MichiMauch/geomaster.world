import { describe, it, expect } from 'vitest'
import {
  LEVELS,
  getUserLevel,
  getLevelProgress,
  checkLevelUp,
  getLevelName,
} from '@/lib/levels'

describe('Levels System', () => {
  describe('LEVELS constant', () => {
    it('should have 20 levels', () => {
      expect(LEVELS.length).toBe(20)
    })

    it('should start at level 1 with 0 points', () => {
      expect(LEVELS[0].level).toBe(1)
      expect(LEVELS[0].minPoints).toBe(0)
    })

    it('should end at level 20', () => {
      expect(LEVELS[LEVELS.length - 1].level).toBe(20)
    })

    it('should have increasing minPoints', () => {
      for (let i = 1; i < LEVELS.length; i++) {
        expect(LEVELS[i].minPoints).toBeGreaterThan(LEVELS[i - 1].minPoints)
      }
    })

    it('should have names in all locales', () => {
      for (const level of LEVELS) {
        expect(level.name.de).toBeDefined()
        expect(level.name.en).toBeDefined()
        expect(level.name.sl).toBeDefined()
      }
    })
  })

  describe('getUserLevel', () => {
    it('should return level 1 for 0 points', () => {
      const level = getUserLevel(0)
      expect(level.level).toBe(1)
    })

    it('should return level 1 for negative points', () => {
      const level = getUserLevel(-100)
      expect(level.level).toBe(1)
    })

    it('should return level 2 at 1000 points', () => {
      const level = getUserLevel(1000)
      expect(level.level).toBe(2)
    })

    it('should return level 2 at 2999 points', () => {
      const level = getUserLevel(2999)
      expect(level.level).toBe(2)
    })

    it('should return level 3 at 3000 points', () => {
      const level = getUserLevel(3000)
      expect(level.level).toBe(3)
    })

    it('should return level 20 at 2400000 points', () => {
      const level = getUserLevel(2400000)
      expect(level.level).toBe(20)
    })

    it('should return level 20 for very high points', () => {
      const level = getUserLevel(9999999)
      expect(level.level).toBe(20)
    })
  })

  describe('getLevelProgress', () => {
    it('should return 0 progress at level start', () => {
      const progress = getLevelProgress(1000) // Start of level 2
      expect(progress.currentLevel.level).toBe(2)
      expect(progress.progress).toBe(0)
      expect(progress.pointsInCurrentLevel).toBe(0)
    })

    it('should calculate progress correctly mid-level', () => {
      // Level 2: 1000-2999 (2000 points range)
      const progress = getLevelProgress(2000) // 1000 points into level 2
      expect(progress.currentLevel.level).toBe(2)
      expect(progress.nextLevel?.level).toBe(3)
      expect(progress.progress).toBe(0.5)
      expect(progress.pointsInCurrentLevel).toBe(1000)
      expect(progress.pointsToNext).toBe(1000)
    })

    it('should handle max level', () => {
      const progress = getLevelProgress(2500000) // Well above max
      expect(progress.currentLevel.level).toBe(20)
      expect(progress.nextLevel).toBe(null)
      expect(progress.progress).toBe(1)
      expect(progress.pointsToNext).toBe(0)
    })

    it('should cap progress at 1', () => {
      const progress = getLevelProgress(2999) // Almost level 3
      expect(progress.progress).toBeLessThanOrEqual(1)
    })
  })

  describe('checkLevelUp', () => {
    it('should detect level up', () => {
      const result = checkLevelUp(900, 1100)
      expect(result.leveledUp).toBe(true)
      expect(result.previousLevel.level).toBe(1)
      expect(result.newLevel.level).toBe(2)
    })

    it('should not detect level up within same level', () => {
      const result = checkLevelUp(100, 800)
      expect(result.leveledUp).toBe(false)
      expect(result.previousLevel.level).toBe(1)
      expect(result.newLevel.level).toBe(1)
    })

    it('should detect multi-level jump', () => {
      const result = checkLevelUp(0, 6000)
      expect(result.leveledUp).toBe(true)
      expect(result.previousLevel.level).toBe(1)
      expect(result.newLevel.level).toBe(4)
    })

    it('should handle same points', () => {
      const result = checkLevelUp(1000, 1000)
      expect(result.leveledUp).toBe(false)
    })
  })

  describe('getLevelName', () => {
    it('should return German name', () => {
      const name = getLevelName(LEVELS[0], 'de')
      expect(name).toBe('Anfänger')
    })

    it('should return English name', () => {
      const name = getLevelName(LEVELS[0], 'en')
      expect(name).toBe('Newcomer')
    })

    it('should return Slovenian name', () => {
      const name = getLevelName(LEVELS[0], 'sl')
      expect(name).toBe('Začetnik')
    })

    it('should fallback to English for unknown locale', () => {
      const name = getLevelName(LEVELS[0], 'fr')
      expect(name).toBe('Newcomer')
    })

    it('should return GeoMaster for level 20', () => {
      const name = getLevelName(LEVELS[19], 'en')
      expect(name).toBe('GeoMaster')
    })
  })
})
