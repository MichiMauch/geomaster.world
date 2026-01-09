import { describe, it, expect } from 'vitest'
import {
  COUNTRIES,
  DEFAULT_COUNTRY,
  getCountryConfig,
  getCountryBounds,
  getCountryName,
  getTimeoutPenalty,
  getCountryKeys,
  getLocationCountryName,
  getActiveCountryIsoCodes,
} from '@/lib/countries'

describe('Countries', () => {
  describe('COUNTRIES constant', () => {
    it('should contain switzerland', () => {
      expect(COUNTRIES.switzerland).toBeDefined()
      expect(COUNTRIES.switzerland.code).toBe('CH')
    })

    it('should contain slovenia', () => {
      expect(COUNTRIES.slovenia).toBeDefined()
      expect(COUNTRIES.slovenia.code).toBe('SI')
    })

    it('should contain world', () => {
      expect(COUNTRIES.world).toBeDefined()
      expect(COUNTRIES.world.code).toBe('WORLD')
    })

    it('should have valid bounds for all countries', () => {
      for (const [, config] of Object.entries(COUNTRIES)) {
        expect(config.bounds.southWest.lat).toBeLessThan(config.bounds.northEast.lat)
        expect(config.bounds.southWest.lng).toBeLessThan(config.bounds.northEast.lng)
        expect(config.bounds.center.lat).toBeGreaterThanOrEqual(config.bounds.southWest.lat)
        expect(config.bounds.center.lat).toBeLessThanOrEqual(config.bounds.northEast.lat)
      }
    })
  })

  describe('DEFAULT_COUNTRY', () => {
    it('should be switzerland', () => {
      expect(DEFAULT_COUNTRY).toBe('switzerland')
    })
  })

  describe('getCountryConfig', () => {
    it('should return config for valid country', () => {
      const config = getCountryConfig('switzerland')
      expect(config.code).toBe('CH')
      expect(config.name.de).toBe('Schweiz')
    })

    it('should return default config for invalid country', () => {
      const config = getCountryConfig('invalid')
      expect(config.code).toBe('CH') // defaults to switzerland
    })
  })

  describe('getCountryBounds', () => {
    it('should return bounds for switzerland', () => {
      const bounds = getCountryBounds('switzerland')
      expect(bounds.southWest.lat).toBeCloseTo(45.8, 1)
      expect(bounds.northEast.lat).toBeCloseTo(47.8, 1)
    })

    it('should return world bounds', () => {
      const bounds = getCountryBounds('world')
      expect(bounds.southWest.lat).toBe(-90)
      expect(bounds.northEast.lat).toBe(90)
    })
  })

  describe('getCountryName', () => {
    it('should return German name', () => {
      expect(getCountryName('switzerland', 'de')).toBe('Schweiz')
    })

    it('should return English name', () => {
      expect(getCountryName('switzerland', 'en')).toBe('Switzerland')
    })

    it('should return Slovenian name', () => {
      expect(getCountryName('slovenia', 'sl')).toBe('Slovenija')
    })

    it('should fallback to English for unknown locale', () => {
      expect(getCountryName('switzerland', 'fr')).toBe('Switzerland')
    })
  })

  describe('getTimeoutPenalty', () => {
    it('should return correct penalty for switzerland', () => {
      expect(getTimeoutPenalty('switzerland')).toBe(400)
    })

    it('should return correct penalty for slovenia', () => {
      expect(getTimeoutPenalty('slovenia')).toBe(250)
    })

    it('should return correct penalty for world', () => {
      expect(getTimeoutPenalty('world')).toBe(5000)
    })
  })

  describe('getCountryKeys', () => {
    it('should return all country keys', () => {
      const keys = getCountryKeys()
      expect(keys).toContain('switzerland')
      expect(keys).toContain('slovenia')
      expect(keys).toContain('world')
      expect(keys.length).toBe(3)
    })
  })

  describe('getLocationCountryName', () => {
    it('should return English name', () => {
      expect(getLocationCountryName('switzerland')).toBe('Switzerland')
      expect(getLocationCountryName('slovenia')).toBe('Slovenia')
    })
  })

  describe('getActiveCountryIsoCodes', () => {
    it('should return lowercase ISO codes', () => {
      const codes = getActiveCountryIsoCodes()
      expect(codes).toContain('ch')
      expect(codes).toContain('si')
      expect(codes).toContain('world')
    })

    it('should be all lowercase', () => {
      const codes = getActiveCountryIsoCodes()
      codes.forEach(code => {
        expect(code).toBe(code.toLowerCase())
      })
    })
  })
})
