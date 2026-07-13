import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/shared/types/database'

let staticClient: ReturnType<typeof createClient<Database>> | null = null

export function createStaticClient() {
  if (!staticClient) {
    staticClient = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          fetch: (url, options) => {
            return fetch(url, { ...options, signal: AbortSignal.timeout(10000) })
          },
        },
      }
    )
  }
  return staticClient
}
