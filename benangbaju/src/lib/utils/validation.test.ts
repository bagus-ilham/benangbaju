import { describe, it, expect } from 'vitest';
import { validatePhone } from './validation.ts';

describe('validatePhone', () => {
  it('validates 08 prefix', () => {
    // 0 + 8 + [1-9] + [0-9]{6,10}
    expect(validatePhone('081234567')).toBe(true); // length 9 (min)
    expect(validatePhone('0812345678901')).toBe(true); // length 13 (max)
    expect(validatePhone('0852345678')).toBe(true); // normal length
  });

  it('validates 628 prefix', () => {
    // 62 + 8 + [1-9] + [0-9]{6,10}
    expect(validatePhone('6281234567')).toBe(true); // length 10 (min)
    expect(validatePhone('62812345678901')).toBe(true); // length 14 (max)
    expect(validatePhone('62852345678')).toBe(true); // normal length
  });

  it('validates +628 prefix', () => {
    // +62 + 8 + [1-9] + [0-9]{6,10}
    expect(validatePhone('+6281234567')).toBe(true); // length 11 (min)
    expect(validatePhone('+62812345678901')).toBe(true); // length 15 (max)
    expect(validatePhone('+62852345678')).toBe(true); // normal length
  });

  it('rejects invalid prefixes', () => {
    expect(validatePhone('0912345678')).toBe(false);
    expect(validatePhone('+63812345678')).toBe(false);
    expect(validatePhone('61812345678')).toBe(false);
    expect(validatePhone('1234567890')).toBe(false);
    expect(validatePhone('+1812345678')).toBe(false);
  });

  it('rejects numbers after 8 being 0', () => {
    // Should be 8[1-9]
    expect(validatePhone('0801234567')).toBe(false);
    expect(validatePhone('6280234567')).toBe(false);
    expect(validatePhone('+6280234567')).toBe(false);
  });

  it('rejects strings that are too short', () => {
    expect(validatePhone('08123456')).toBe(false); // length 8 (needs to be >= 9)
    expect(validatePhone('628123456')).toBe(false);
    expect(validatePhone('+628123456')).toBe(false);
  });

  it('rejects strings that are too long', () => {
    expect(validatePhone('08123456789012')).toBe(false); // length 14 (needs to be <= 13)
    expect(validatePhone('628123456789012')).toBe(false);
    expect(validatePhone('+628123456789012')).toBe(false);
  });

  it('rejects strings with non-numeric characters (except + for +62)', () => {
    expect(validatePhone('0812345678a')).toBe(false);
    expect(validatePhone('0812-3456-78')).toBe(false);
    expect(validatePhone('+62812345678a')).toBe(false);
    expect(validatePhone(' 0812345678')).toBe(false);
  });

  it('rejects empty strings and non-sensical inputs', () => {
    expect(validatePhone('')).toBe(false);
    expect(validatePhone(' ')).toBe(false);
    expect(validatePhone('+')).toBe(false);
    expect(validatePhone('08')).toBe(false);
  });
});
