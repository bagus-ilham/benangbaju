import { formatWeight } from './shipping'

describe('formatWeight', () => {
  it('should return weight in grams (gr) for weights less than 1000g', () => {
    expect(formatWeight(0)).toBe('0 gr')
    expect(formatWeight(500)).toBe('500 gr')
    expect(formatWeight(999)).toBe('999 gr')
  })

  it('should return weight in kilograms (kg) for weights equal to or greater than 1000g', () => {
    expect(formatWeight(1000)).toBe('1.00 kg')
    expect(formatWeight(1500)).toBe('1.50 kg')
    expect(formatWeight(2000)).toBe('2.00 kg')
    expect(formatWeight(2550)).toBe('2.55 kg')
  })

  it('should handle edge cases like negative weights gracefully', () => {
    // Note: Behavior might depend on business logic but based on the code, it should return 'gr'
    expect(formatWeight(-100)).toBe('-100 gr')
  })
})
