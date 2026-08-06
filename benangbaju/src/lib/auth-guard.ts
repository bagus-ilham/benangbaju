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
    .select('role, is_active')
    .eq('id', user.id)
    .single()

  if (profile?.is_active === false) throw new ForbiddenError('Akun telah dinonaktifkan')
  if (profile?.role?.toLowerCase() !== 'admin') throw new ForbiddenError('Admin access required')

  return { user, supabase, profile }
}

export async function requireAuth() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new UnauthorizedError()

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, is_active')
    .eq('id', user.id)
    .single()

  if (profile?.is_active === false) throw new ForbiddenError('Akun telah dinonaktifkan')

  return { user, supabase, profile }
}
