'use server'

import { revalidateTag } from 'next/cache'

export async function revalidateCacheTag(tag: string, profile?: string): Promise<void> {
  const defaultProfile =
    tag === 'homepage-data' || tag === 'banners' || tag === 'settings' || tag === 'flash-sales'
      ? 'hours'
      : 'weeks'
  revalidateTag(tag, profile || defaultProfile)
}
