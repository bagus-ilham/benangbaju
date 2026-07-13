import { describe, it, expect, vi } from 'vitest';
import * as authGuard from '../auth-guard';

vi.mock('@/lib/supabase/server');

describe('requireAuth', () => {
  it('should throw UnauthorizedError if no user session', async () => {
    vi.spyOn(authGuard, 'requireAuth').mockRejectedValue(new Error('UnauthorizedError'));
    await expect(authGuard.requireAuth()).rejects.toThrow('UnauthorizedError');
  });
});
