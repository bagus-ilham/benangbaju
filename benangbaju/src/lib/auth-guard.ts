import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { UnauthorizedError, ForbiddenError } from './api-errors'

export async function requireAdmin() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new UnauthorizedError()

  let profile: { role?: string; is_active?: boolean } | null = null

  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const adminClient = createAdminClient()
      const { data } = await adminClient
        .from('profiles')
        .select('role, is_active')
        .eq('id', user.id)
        .maybeSingle()
      profile = data
    } catch {
      // ignore service role error and try anon client below
    }
  }

  if (!profile) {
    const { data } = await supabase
      .from('profiles')
      .select('role, is_active')
      .eq('id', user.id)
      .maybeSingle()
    profile = data
  }

  if (profile?.is_active === false) throw new ForbiddenError('Akun telah dinonaktifkan')

  const isMetadataAdmin =
    String(user.user_metadata?.role || '').trim().toLowerCase() === 'admin' ||
    String(user.app_metadata?.role || '').trim().toLowerCase() === 'admin' ||
    user.email?.toLowerCase() === 'benangbaju@gmail.com'

  const userRole = String(profile?.role || '').trim().toLowerCase()
  const isAdmin = ['admin', 'staff'].includes(userRole) || isMetadataAdmin

  if (!isAdmin) {
    throw new ForbiddenError('Admin access required')
  }

  return { user, supabase, profile: profile || { role: 'admin', is_active: true } }
}

export async function requireAuth() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new UnauthorizedError()

  let profile: { role?: string; is_active?: boolean } | null = null

  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const adminClient = createAdminClient()
      const { data } = await adminClient
        .from('profiles')
        .select('role, is_active')
        .eq('id', user.id)
        .maybeSingle()
      profile = data
    } catch {
      // ignore
    }
  }

  if (!profile) {
    const { data } = await supabase
      .from('profiles')
      .select('role, is_active')
      .eq('id', user.id)
      .maybeSingle()
    profile = data
  }

  if (profile?.is_active === false) throw new ForbiddenError('Akun telah dinonaktifkan')

  return { user, supabase, profile }
}
