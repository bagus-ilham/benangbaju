import { createServerClient } from '@/lib/supabase/server'
import { UnauthorizedError, ForbiddenError } from './api-errors'

export async function requireAdmin() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new UnauthorizedError()

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'admin') throw new ForbiddenError('Admin access required')

  return { user, supabase, profile }
}

export async function requireAuth() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new UnauthorizedError()
  return { user, supabase }
}
