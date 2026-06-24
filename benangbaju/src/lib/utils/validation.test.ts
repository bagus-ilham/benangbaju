import { validateRequired } from './validation';

describe('validateRequired', () => {
  it('should return true for a normal non-empty string', () => {
    expect(validateRequired('hello')).toBe(true);
  });

  it('should return true for strings with leading/trailing spaces but containing text', () => {
    expect(validateRequired('  world  ')).toBe(true);
  });

  it('should return false for an empty string', () => {
    expect(validateRequired('')).toBe(false);
  });

  it('should return false for a whitespace-only string', () => {
    expect(validateRequired('   ')).toBe(false);
    expect(validateRequired('\t\n')).toBe(false);
  });
});
