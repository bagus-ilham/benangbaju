import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { ApiErrorCode } from '@/lib/api-errors'

export async function POST(req: Request) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: ApiErrorCode.UNAUTHORIZED, message: 'Unauthorized' } },
        { status: 401 }
      )
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: { code: ApiErrorCode.FORBIDDEN, message: 'Forbidden' } },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { email, password, name, role } = body

    if (!email || !name || !role || !password) {
      return NextResponse.json(
        { success: false, error: { code: ApiErrorCode.VALIDATION_ERROR, message: 'All fields including password are required' } },
        { status: 400 }
      )
    }

    if (password.length < 12 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
      return NextResponse.json(
        { success: false, error: { code: ApiErrorCode.VALIDATION_ERROR, message: 'Password must be at least 12 characters with uppercase and digits' } },
        { status: 400 }
      )
    }

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceRoleKey) {
      return NextResponse.json(
        { success: false, error: { code: ApiErrorCode.INTERNAL_ERROR, message: 'Server misconfiguration: missing service role key' } },
        { status: 500 }
      )
    }

    // Initialize Supabase admin client with service role key
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey
    )

    // 1. Create auth user securely on the server
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: password,
      email_confirm: true,
      user_metadata: {
        name,
        role
      }
    })

    if (authError) {
      console.error('Staff creation auth error:', authError)
      return NextResponse.json(
        { success: false, error: { code: ApiErrorCode.VALIDATION_ERROR, message: 'Failed to create staff account. Please check the email and try again.' } },
        { status: 400 }
      )
    }

    const newUserId = authData.user.id

    // Wait a moment for trigger to create profile (if a trigger exists)
    await new Promise(resolve => setTimeout(resolve, 500))

    // 2. Update/upsert profile
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({ 
        id: newUserId, 
        email, 
        name, 
        role, 
        is_active: true,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' })
      .select('id, name, email, phone, avatar_url, role, is_active, created_at, updated_at')
      .single()

    if (profileError) {
      return NextResponse.json(
        { success: false, error: { code: ApiErrorCode.INTERNAL_ERROR, message: 'Failed to update user profile' } },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data: profileData }, { status: 201 })
  } catch (err: any) {
    console.error('Unexpected staff creation error:', err)
    return NextResponse.json(
      { success: false, error: { code: ApiErrorCode.INTERNAL_ERROR, message: 'Internal Server Error' } },
      { status: 500 }
    )
  }
}
