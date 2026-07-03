import { createBrowserClient } from '@/lib/supabase/client'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/shared/types/database'

let _client: SupabaseClient<Database> | null = null

export function getAdminSupabase(): SupabaseClient<Database> {
  if (typeof window === 'undefined') {
    return createBrowserClient()
  }

  if (!_client) {
    _client = createBrowserClient()
  }
  return _client
}
