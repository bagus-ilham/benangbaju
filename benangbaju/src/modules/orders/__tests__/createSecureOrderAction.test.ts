import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createSecureOrderAction } from '../actions';
import { ApiErrorCode } from '@/lib/api-errors';
import * as authGuard from '@/lib/auth-guard';

vi.mock('@/lib/auth-guard');
vi.mock('@/lib/supabase/server', () => ({
  createServerClient: vi.fn(() => ({
    from: vi.fn(() => ({ select: vi.fn(() => ({ eq: vi.fn(() => ({ single: vi.fn() })) })) })),
    rpc: vi.fn(),
  })),
}));

describe('createSecureOrderAction', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.spyOn(authGuard, 'requireAuth').mockResolvedValue({ user: { id: 'user-1' } as any, supabase: {} as any });
  });

  it('should reject if user.id !== params.userId', async () => {
    const res = await createSecureOrderAction({ userId: 'user-2' } as any);
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error?.code).toBe(ApiErrorCode.UNAUTHORIZED);
    }
  });
});
