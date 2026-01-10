import { describe, it, expect } from 'vitest'
import {
  GAME_TYPES,
  DEFAULT_GAME_TYPE,
  getGameTypeConfig,
  getGameTypeFromCountry,
  getEffectiveGameType,
  getGameTypeIds,
  getGameTypesByType,
  getGameTypeName,
  isWorldGameType,
  getWorldCategory,
  isImageGameType,
  isPanoramaGameType,
  getPanoramaCategory,
  getImageMapId,
  getGameTypesByTypeExtended,
} from '@/lib/game-types'

describe('Game Types', () => {
  describe('GAME_TYPES constant', () => {
    // Note: country:*, world:*, and panorama:* types are now loaded from database
    // Only image:* types remain in static GAME_TYPES

    it('should contain image:garten', () => {
      expect(GAME_TYPES['image:garten']).toBeDefined()
      expect(GAME_TYPES['image:garten'].type).toBe('image')
    })

    it('should have valid scoreScaleFactors', () => {
      for (const config of Object.values(GAME_TYPES)) {
        expect(config.scoreScaleFactor).toBeGreaterThan(0)
      }
    })
  })

  describe('DEFAULT_GAME_TYPE', () => {
    it('should be country:switzerland', () => {
      expect(DEFAULT_GAME_TYPE).toBe('country:switzerland')
    })
  })

  describe('getGameTypeConfig', () => {
    it('should return config for valid static game type', () => {
      const config = getGameTypeConfig('image:garten')
      expect(config.id).toBe('image:garten')
      expect(config.type).toBe('image')
    })

    it('should return default config for unknown game type', () => {
      // When type is not in static GAME_TYPES, it returns DEFAULT_GAME_TYPE config
      // But since country:switzerland is also not static anymore, it returns undefined
      // The function falls back to DEFAULT_GAME_TYPE which is also not in GAME_TYPES
      const config = getGameTypeConfig('invalid:type')
      // This will return undefined since neither invalid:type nor country:switzerland are in GAME_TYPES
      expect(config).toBeUndefined()
    })
  })

  describe('getGameTypeFromCountry', () => {
    it('should convert country to game type format', () => {
      expect(getGameTypeFromCountry('switzerland')).toBe('country:switzerland')
      expect(getGameTypeFromCountry('slovenia')).toBe('country:slovenia')
    })
  })

  describe('getEffectiveGameType', () => {
    it('should use gameType if set', () => {
      const result = getEffectiveGameType({
        gameType: 'image:garten',
        country: 'switzerland',
      })
      expect(result).toBe('image:garten')
    })

    it('should fallback to country if gameType is null', () => {
      const result = getEffectiveGameType({
        gameType: null,
        country: 'slovenia',
      })
      expect(result).toBe('country:slovenia')
    })

    it('should fallback to country if gameType is undefined', () => {
      const result = getEffectiveGameType({
        country: 'switzerland',
      })
      expect(result).toBe('country:switzerland')
    })
  })

  describe('getGameTypeIds', () => {
    it('should return static game type IDs', () => {
      const ids = getGameTypeIds()
      // Only image types are static now
      expect(ids).toContain('image:garten')
    })
  })

  describe('getGameTypesByType', () => {
    it('should group static game types correctly', () => {
      const grouped = getGameTypesByType()
      // Country and world types are now in database, so static grouping may be empty
      expect(grouped.country).toBeDefined()
      expect(grouped.world).toBeDefined()
    })
  })

  describe('getGameTypeName', () => {
    it('should return German name for static type', () => {
      expect(getGameTypeName('image:garten', 'de')).toBe('Garten')
    })

    it('should return English name for static type', () => {
      expect(getGameTypeName('image:garten', 'en')).toBe('Garden')
    })

    it('should fallback to English for unknown locale', () => {
      expect(getGameTypeName('image:garten', 'fr')).toBe('Garden')
    })
  })

  describe('isWorldGameType', () => {
    it('should return true for world: prefixed types', () => {
      expect(isWorldGameType('world:capitals')).toBe(true)
      expect(isWorldGameType('world:flags')).toBe(true)
    })

    it('should return false for non-world types', () => {
      expect(isWorldGameType('country:switzerland')).toBe(false)
      expect(isWorldGameType('image:garten')).toBe(false)
    })

    it('should handle null/undefined', () => {
      expect(isWorldGameType(null)).toBe(false)
      expect(isWorldGameType(undefined)).toBe(false)
    })
  })

  describe('getWorldCategory', () => {
    it('should extract category from world type', () => {
      expect(getWorldCategory('world:capitals')).toBe('capitals')
      expect(getWorldCategory('world:flags')).toBe('flags')
    })

    it('should return null for non-world types', () => {
      expect(getWorldCategory('country:switzerland')).toBe(null)
    })
  })

  describe('isImageGameType', () => {
    it('should return true for image: prefixed types', () => {
      expect(isImageGameType('image:garten')).toBe(true)
    })

    it('should return false for non-image types', () => {
      expect(isImageGameType('country:switzerland')).toBe(false)
      expect(isImageGameType('world:capitals')).toBe(false)
    })

    it('should handle null/undefined', () => {
      expect(isImageGameType(null)).toBe(false)
      expect(isImageGameType(undefined)).toBe(false)
    })
  })

  describe('isPanoramaGameType', () => {
    it('should return true for panorama: prefixed types', () => {
      expect(isPanoramaGameType('panorama:world')).toBe(true)
    })

    it('should return false for non-panorama types', () => {
      expect(isPanoramaGameType('country:switzerland')).toBe(false)
    })

    it('should handle null/undefined', () => {
      expect(isPanoramaGameType(null)).toBe(false)
      expect(isPanoramaGameType(undefined)).toBe(false)
    })
  })

  describe('getPanoramaCategory', () => {
    it('should extract category from panorama type', () => {
      expect(getPanoramaCategory('panorama:world')).toBe('world')
    })

    it('should return null for non-panorama types', () => {
      expect(getPanoramaCategory('country:switzerland')).toBe(null)
    })
  })

  describe('getImageMapId', () => {
    it('should extract map ID from image type', () => {
      expect(getImageMapId('image:garten')).toBe('garten')
    })

    it('should return null for non-image types', () => {
      expect(getImageMapId('country:switzerland')).toBe(null)
    })
  })

  describe('getGameTypesByTypeExtended', () => {
    it('should group all types including image', () => {
      const grouped = getGameTypesByTypeExtended()
      expect(grouped.country).toBeDefined()
      expect(grouped.world).toBeDefined()
      expect(grouped.image).toBeDefined()
      expect(grouped.image.every(g => g.type === 'image')).toBe(true)
    })
  })
})
