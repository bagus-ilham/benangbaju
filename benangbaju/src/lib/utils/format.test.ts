import { describe, it, expect } from 'vitest';
import { formatIDR } from './format';

describe('formatIDR', () => {
  it('formats positive numbers correctly', () => {
    // Note: Node's Intl.NumberFormat often outputs a non-breaking space (\xa0) or standard space
    // replacing all whitespace with a standard space helps avoid cross-environment flakiness.
    expect(formatIDR(1000).replace(/\s/g, ' ')).toBe('Rp 1.000');
    expect(formatIDR(1000000).replace(/\s/g, ' ')).toBe('Rp 1.000.000');
    expect(formatIDR(0).replace(/\s/g, ' ')).toBe('Rp 0');
  });

  it('formats negative numbers correctly', () => {
    // It depends on the environment whether it puts `-Rp` or `Rp -` but let's test typical output
    const formatted = formatIDR(-500).replace(/\s/g, ' ');
    // Could be "-Rp 500" or "Rp -500" depending on exact locale rules. We'll check for both if needed.
    expect(formatted === '-Rp 500' || formatted === 'Rp -500').toBe(true);
  });

  it('handles string inputs correctly', () => {
    expect(formatIDR('1000').replace(/\s/g, ' ')).toBe('Rp 1.000');
    expect(formatIDR('0').replace(/\s/g, ' ')).toBe('Rp 0');
    const formatted = formatIDR('-500').replace(/\s/g, ' ');
    expect(formatted === '-Rp 500' || formatted === 'Rp -500').toBe(true);
  });

  it('handles invalid string inputs correctly by returning "Rp 0"', () => {
    expect(formatIDR('abc').replace(/\s/g, ' ')).toBe('Rp 0');
    expect(formatIDR('').replace(/\s/g, ' ')).toBe('Rp 0');
  });

  it('handles NaN correctly by returning "Rp 0"', () => {
    expect(formatIDR(NaN).replace(/\s/g, ' ')).toBe('Rp 0');
  });

  it('handles other invalid inputs correctly', () => {
    // @ts-expect-error - testing invalid input types
    expect(formatIDR({}).replace(/\s/g, ' ')).toBe('Rp 0');
    // @ts-expect-error - testing invalid input types
    expect(formatIDR(undefined).replace(/\s/g, ' ')).toBe('Rp 0');
    // @ts-expect-error - testing invalid input types
    expect(formatIDR(null).replace(/\s/g, ' ')).toBe('Rp 0');
  });
});
