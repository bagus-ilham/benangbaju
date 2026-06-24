import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getCourierLabel } from './shipping.ts';

describe('getCourierLabel', () => {
  describe('exact matches', () => {
    it('should format jne correctly', () => {
      assert.strictEqual(getCourierLabel('jne'), 'JNE Express');
    });

    it('should format tiki correctly', () => {
      assert.strictEqual(getCourierLabel('tiki'), 'TIKI');
    });

    it('should format pos correctly', () => {
      assert.strictEqual(getCourierLabel('pos'), 'POS Indonesia');
    });

    it('should format j&t and jnt correctly', () => {
      assert.strictEqual(getCourierLabel('j&t'), 'J&T Express');
      assert.strictEqual(getCourierLabel('jnt'), 'J&T Express');
    });

    it('should format sicepat correctly', () => {
      assert.strictEqual(getCourierLabel('sicepat'), 'SiCepat');
    });
  });

  describe('case insensitivity', () => {
    it('should handle uppercase courier names', () => {
      assert.strictEqual(getCourierLabel('JNE'), 'JNE Express');
      assert.strictEqual(getCourierLabel('TIKI'), 'TIKI');
      assert.strictEqual(getCourierLabel('POS'), 'POS Indonesia');
      assert.strictEqual(getCourierLabel('J&T'), 'J&T Express');
      assert.strictEqual(getCourierLabel('SICEPAT'), 'SiCepat');
    });

    it('should handle mixed case courier names', () => {
      assert.strictEqual(getCourierLabel('jNe'), 'JNE Express');
      assert.strictEqual(getCourierLabel('TiKi'), 'TIKI');
      assert.strictEqual(getCourierLabel('SiCepat'), 'SiCepat');
    });
  });

  describe('partial matches and service names', () => {
    it('should match correctly when service name is included', () => {
      assert.strictEqual(getCourierLabel('JNE REG'), 'JNE Express');
      assert.strictEqual(getCourierLabel('tiki ons'), 'TIKI');
      assert.strictEqual(getCourierLabel('POS Kilat Khusus'), 'POS Indonesia');
      assert.strictEqual(getCourierLabel('J&T EZ'), 'J&T Express');
      assert.strictEqual(getCourierLabel('jnt economy'), 'J&T Express');
      assert.strictEqual(getCourierLabel('SICEPAT HALU'), 'SiCepat');
    });
  });

  describe('unrecognized and edge cases', () => {
    it('should return original string for unrecognized couriers', () => {
      assert.strictEqual(getCourierLabel('Wahana'), 'Wahana');
      assert.strictEqual(getCourierLabel('Ninja Xpress'), 'Ninja Xpress');
      assert.strictEqual(getCourierLabel('AnterAja'), 'AnterAja');
    });

    it('should return empty string when empty string is provided', () => {
      assert.strictEqual(getCourierLabel(''), '');
    });
  });
});
