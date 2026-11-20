'use server'

import { revalidateTag } from 'next/cache'
import { requireAdmin } from '@/lib/auth-guard'

export async function revalidateCacheTag(tag: string, profile?: string): Promise<void> {
  await requireAdmin()
  const defaultProfile =
    tag === 'homepage-data' || tag === 'banners' || tag === 'settings' || tag === 'flash-sales'
      ? 'hours'
      : 'weeks'
  revalidateTag(tag, profile || defaultProfile)
}
