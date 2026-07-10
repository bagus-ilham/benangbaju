import { createBrowserClient as createBrowserSupabaseClient } from '@supabase/ssr'
import { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/shared/types/database'

let client: ReturnType<typeof createBrowserSupabaseClient<Database>> | null = null

export function createBrowserClient(): SupabaseClient<Database> {
  if (typeof window === 'undefined') {
    return createBrowserSupabaseClient<Database>(
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

  if (!client) {
    client = createBrowserSupabaseClient<Database>(
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
  return client
}
