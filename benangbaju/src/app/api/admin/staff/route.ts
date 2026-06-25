import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { email, password, name, role } = body

    if (!email || !name || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceRoleKey) {
      return NextResponse.json({ error: 'Server misconfiguration: missing service role key' }, { status: 500 })
    }

    // Initialize Supabase admin client with service role key
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey
    )

    // 1. Create auth user securely on the server
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: password || 'DefaultPass123!',
      email_confirm: true,
      user_metadata: {
        name,
        role
      }
    })

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 })
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
      return NextResponse.json({ error: 'Failed to update user profile' }, { status: 500 })
    }

    return NextResponse.json({ data: profileData }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}
