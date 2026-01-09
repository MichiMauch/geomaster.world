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
    it('should contain country:switzerland', () => {
      expect(GAME_TYPES['country:switzerland']).toBeDefined()
      expect(GAME_TYPES['country:switzerland'].type).toBe('country')
    })

    it('should contain country:slovenia', () => {
      expect(GAME_TYPES['country:slovenia']).toBeDefined()
      expect(GAME_TYPES['country:slovenia'].type).toBe('country')
    })

    it('should contain image:garten', () => {
      expect(GAME_TYPES['image:garten']).toBeDefined()
      expect(GAME_TYPES['image:garten'].type).toBe('image')
    })

    it('should contain panorama:world', () => {
      expect(GAME_TYPES['panorama:world']).toBeDefined()
      expect(GAME_TYPES['panorama:world'].type).toBe('panorama')
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
    it('should return config for valid game type', () => {
      const config = getGameTypeConfig('country:switzerland')
      expect(config.id).toBe('country:switzerland')
      expect(config.icon).toBe('🇨🇭')
    })

    it('should return default config for invalid game type', () => {
      const config = getGameTypeConfig('invalid:type')
      expect(config.id).toBe('country:switzerland')
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
    it('should return all game type IDs', () => {
      const ids = getGameTypeIds()
      expect(ids).toContain('country:switzerland')
      expect(ids).toContain('country:slovenia')
      expect(ids).toContain('image:garten')
      expect(ids).toContain('panorama:world')
    })
  })

  describe('getGameTypesByType', () => {
    it('should group game types correctly', () => {
      const grouped = getGameTypesByType()
      expect(grouped.country.length).toBeGreaterThan(0)
      expect(grouped.country.every(g => g.type === 'country')).toBe(true)
    })
  })

  describe('getGameTypeName', () => {
    it('should return German name', () => {
      expect(getGameTypeName('country:switzerland', 'de')).toBe('Schweiz')
    })

    it('should return English name', () => {
      expect(getGameTypeName('country:switzerland', 'en')).toBe('Switzerland')
    })

    it('should fallback to English for unknown locale', () => {
      expect(getGameTypeName('country:switzerland', 'fr')).toBe('Switzerland')
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
