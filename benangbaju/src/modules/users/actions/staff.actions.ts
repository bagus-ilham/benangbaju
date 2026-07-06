import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { ApiErrorCode } from '@/lib/api-errors'
import type { Database } from '@/shared/types/database'

export interface CreateStaffPayload {
  email: string
  name: string
  role: string
  password?: string
}

export async function createAdminStaff(
  supabase: SupabaseClient<Database>,
  payload: CreateStaffPayload
) {
  const { email, password, name, role } = payload

  if (!email || !name || !role || !password) {
    return {
      success: false as const,
      error: {
        code: ApiErrorCode.VALIDATION_ERROR,
        message: 'All fields including password are required',
      },
      status: 400,
    }
  }

  if (password.length < 12 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
    return {
      success: false as const,
      error: {
        code: ApiErrorCode.VALIDATION_ERROR,
        message: 'Password must be at least 12 characters with uppercase and digits',
      },
      status: 400,
    }
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) {
    return {
      success: false as const,
      error: {
        code: ApiErrorCode.INTERNAL_ERROR,
        message: 'Server misconfiguration: missing service role key',
      },
      status: 500,
    }
  }

  // Initialize Supabase admin client with service role key
  const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey)

  // 1. Create auth user securely on the server
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: password,
    email_confirm: true,
    user_metadata: {
      name,
      role,
    },
  })

  if (authError) {
    console.error('Staff creation auth error:', authError)
    return {
      success: false as const,
      error: {
        code: ApiErrorCode.VALIDATION_ERROR,
        message: 'Failed to create staff account. Please check the email and try again.',
      },
      status: 400,
    }
  }

  const newUserId = authData.user.id

  // Wait a moment for trigger to create profile (if a trigger exists)
  await new Promise((resolve) => setTimeout(resolve, 500))

  // 2. Update/upsert profile
  const { data: profileData, error: profileError } = await supabaseAdmin
    .from('profiles')
    .upsert(
      {
        id: newUserId,
        email,
        name,
        role,
        is_active: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    )
    .select('id, name, email, phone, avatar_url, role, is_active, created_at, updated_at')
    .single()

  if (profileError) {
    return {
      success: false as const,
      error: { code: ApiErrorCode.INTERNAL_ERROR, message: 'Failed to update user profile' },
      status: 500,
    }
  }

  return { success: true as const, data: profileData, status: 201 }
}
