import { validateEmail } from './validation';

describe('validateEmail', () => {
  it('should return true for a valid email address', () => {
    expect(validateEmail('test@example.com')).toBe(true);
    expect(validateEmail('user.name+tag+sorting@example.com')).toBe(true);
    expect(validateEmail('x@example.com')).toBe(true);
    expect(validateEmail('example-indeed@strange-example.com')).toBe(true);
    expect(validateEmail('example@s.example')).toBe(true);
  });

  it('should return false for invalid email addresses missing the @ symbol', () => {
    expect(validateEmail('testexample.com')).toBe(false);
    expect(validateEmail('test.example.com')).toBe(false);
  });

  it('should return false for invalid email addresses missing the domain', () => {
    expect(validateEmail('test@')).toBe(false);
    expect(validateEmail('test@.com')).toBe(false); // Fails regex because [^\s@]+ requires at least one char before the dot
  });

  it('should return false for invalid email addresses missing the user part', () => {
    expect(validateEmail('@example.com')).toBe(false);
    expect(validateEmail(' @example.com')).toBe(false);
  });

  it('should return false for invalid email addresses with spaces', () => {
    expect(validateEmail('test @example.com')).toBe(false);
    expect(validateEmail('test@ example.com')).toBe(false);
    expect(validateEmail(' test@example.com')).toBe(false);
    expect(validateEmail('test@example.com ')).toBe(false);
  });

  it('should return false for invalid email addresses with multiple @ symbols', () => {
    expect(validateEmail('test@example@com')).toBe(false);
    expect(validateEmail('test@@example.com')).toBe(false);
  });
});
