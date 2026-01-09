import { describe, it, expect } from 'vitest'
import {
  calculateDistance,
  calculatePixelDistance,
  formatDistance,
  formatTotalDistance,
} from '@/lib/distance'

describe('calculateDistance', () => {
  it('should return 0 for same coordinates', () => {
    expect(calculateDistance(47.3769, 8.5417, 47.3769, 8.5417)).toBe(0)
  })

  it('should calculate distance between Zurich and Bern correctly', () => {
    // Zurich: 47.3769, 8.5417
    // Bern: 46.9480, 7.4474
    const distance = calculateDistance(47.3769, 8.5417, 46.948, 7.4474)
    // Expected: ~95km
    expect(distance).toBeGreaterThan(90)
    expect(distance).toBeLessThan(100)
  })

  it('should calculate distance between New York and London correctly', () => {
    // New York: 40.7128, -74.0060
    // London: 51.5074, -0.1278
    const distance = calculateDistance(40.7128, -74.006, 51.5074, -0.1278)
    // Expected: ~5570km
    expect(distance).toBeGreaterThan(5500)
    expect(distance).toBeLessThan(5600)
  })
})

describe('calculatePixelDistance', () => {
  it('should return 0 for same pixel coordinates', () => {
    expect(calculatePixelDistance(100, 100, 100, 100)).toBe(0)
  })

  it('should calculate pixel distance correctly', () => {
    // 92 pixels = 10 meters = 0.01 km
    const distance = calculatePixelDistance(0, 0, 92, 0)
    expect(distance).toBe(0.01)
  })
})

describe('formatDistance', () => {
  it('should format distance in km for regular game types', () => {
    expect(formatDistance(5.25)).toBe('5.3 km')
    expect(formatDistance(0.1)).toBe('0.1 km')
  })

  it('should format distance in meters for image-based games', () => {
    expect(formatDistance(0.023, 'image:someimage')).toBe('23 m')
    expect(formatDistance(0.1, 'image:test')).toBe('100 m')
  })
})

describe('formatTotalDistance', () => {
  it('should format total distance with 3 decimal places', () => {
    expect(formatTotalDistance(5.1)).toBe('5.100 km')
    expect(formatTotalDistance(123.456789)).toBe('123.457 km')
  })
})
