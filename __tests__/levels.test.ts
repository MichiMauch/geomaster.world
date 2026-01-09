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

    it('should return level 2 at 500 points', () => {
      const level = getUserLevel(500)
      expect(level.level).toBe(2)
    })

    it('should return level 2 at 999 points', () => {
      const level = getUserLevel(999)
      expect(level.level).toBe(2)
    })

    it('should return level 3 at 1500 points', () => {
      const level = getUserLevel(1500)
      expect(level.level).toBe(3)
    })

    it('should return level 20 at 1200000 points', () => {
      const level = getUserLevel(1200000)
      expect(level.level).toBe(20)
    })

    it('should return level 20 for very high points', () => {
      const level = getUserLevel(9999999)
      expect(level.level).toBe(20)
    })
  })

  describe('getLevelProgress', () => {
    it('should return 0 progress at level start', () => {
      const progress = getLevelProgress(500) // Start of level 2
      expect(progress.currentLevel.level).toBe(2)
      expect(progress.progress).toBe(0)
      expect(progress.pointsInCurrentLevel).toBe(0)
    })

    it('should calculate progress correctly mid-level', () => {
      // Level 2: 500-1499 (1000 points range)
      const progress = getLevelProgress(1000) // 500 points into level 2
      expect(progress.currentLevel.level).toBe(2)
      expect(progress.nextLevel?.level).toBe(3)
      expect(progress.progress).toBe(0.5)
      expect(progress.pointsInCurrentLevel).toBe(500)
      expect(progress.pointsToNext).toBe(500)
    })

    it('should handle max level', () => {
      const progress = getLevelProgress(1500000) // Well above max
      expect(progress.currentLevel.level).toBe(20)
      expect(progress.nextLevel).toBe(null)
      expect(progress.progress).toBe(1)
      expect(progress.pointsToNext).toBe(0)
    })

    it('should cap progress at 1', () => {
      const progress = getLevelProgress(1499) // Almost level 3
      expect(progress.progress).toBeLessThanOrEqual(1)
    })
  })

  describe('checkLevelUp', () => {
    it('should detect level up', () => {
      const result = checkLevelUp(400, 600)
      expect(result.leveledUp).toBe(true)
      expect(result.previousLevel.level).toBe(1)
      expect(result.newLevel.level).toBe(2)
    })

    it('should not detect level up within same level', () => {
      const result = checkLevelUp(100, 400)
      expect(result.leveledUp).toBe(false)
      expect(result.previousLevel.level).toBe(1)
      expect(result.newLevel.level).toBe(1)
    })

    it('should detect multi-level jump', () => {
      const result = checkLevelUp(0, 3000)
      expect(result.leveledUp).toBe(true)
      expect(result.previousLevel.level).toBe(1)
      expect(result.newLevel.level).toBe(4)
    })

    it('should handle same points', () => {
      const result = checkLevelUp(500, 500)
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
