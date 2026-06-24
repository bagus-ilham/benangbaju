import test from 'node:test';
import assert from 'node:assert';
import { validatePhone } from './validation.ts';

test('validatePhone', async (t) => {
  await t.test('validates 08 prefix', () => {
    // 0 + 8 + [1-9] + [0-9]{6,10}
    assert.strictEqual(validatePhone('081234567'), true); // length 9 (min)
    assert.strictEqual(validatePhone('0812345678901'), true); // length 13 (max)
    assert.strictEqual(validatePhone('0852345678'), true); // normal length
  });

  await t.test('validates 628 prefix', () => {
    // 62 + 8 + [1-9] + [0-9]{6,10}
    assert.strictEqual(validatePhone('6281234567'), true); // length 10 (min)
    assert.strictEqual(validatePhone('62812345678901'), true); // length 14 (max)
    assert.strictEqual(validatePhone('62852345678'), true); // normal length
  });

  await t.test('validates +628 prefix', () => {
    // +62 + 8 + [1-9] + [0-9]{6,10}
    assert.strictEqual(validatePhone('+6281234567'), true); // length 11 (min)
    assert.strictEqual(validatePhone('+62812345678901'), true); // length 15 (max)
    assert.strictEqual(validatePhone('+62852345678'), true); // normal length
  });

  await t.test('rejects invalid prefixes', () => {
    assert.strictEqual(validatePhone('0912345678'), false);
    assert.strictEqual(validatePhone('+63812345678'), false);
    assert.strictEqual(validatePhone('61812345678'), false);
    assert.strictEqual(validatePhone('1234567890'), false);
    assert.strictEqual(validatePhone('+1812345678'), false);
  });

  await t.test('rejects numbers after 8 being 0', () => {
    // Should be 8[1-9]
    assert.strictEqual(validatePhone('0801234567'), false);
    assert.strictEqual(validatePhone('6280234567'), false);
    assert.strictEqual(validatePhone('+6280234567'), false);
  });

  await t.test('rejects strings that are too short', () => {
    assert.strictEqual(validatePhone('08123456'), false); // length 8 (needs to be >= 9)
    assert.strictEqual(validatePhone('628123456'), false);
    assert.strictEqual(validatePhone('+628123456'), false);
  });

  await t.test('rejects strings that are too long', () => {
    assert.strictEqual(validatePhone('08123456789012'), false); // length 14 (needs to be <= 13)
    assert.strictEqual(validatePhone('628123456789012'), false);
    assert.strictEqual(validatePhone('+628123456789012'), false);
  });

  await t.test('rejects strings with non-numeric characters (except + for +62)', () => {
    assert.strictEqual(validatePhone('0812345678a'), false);
    assert.strictEqual(validatePhone('0812-3456-78'), false);
    assert.strictEqual(validatePhone('+62812345678a'), false);
    assert.strictEqual(validatePhone(' 0812345678'), false);
  });

  await t.test('rejects empty strings and non-sensical inputs', () => {
    assert.strictEqual(validatePhone(''), false);
    assert.strictEqual(validatePhone(' '), false);
    assert.strictEqual(validatePhone('+'), false);
    assert.strictEqual(validatePhone('08'), false);
  });
});
