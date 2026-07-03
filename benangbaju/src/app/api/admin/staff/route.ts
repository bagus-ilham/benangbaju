import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { ApiErrorCode } from '@/lib/api-errors'
import { createAdminStaff } from '@/features/users/actions/staff.actions'

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
    
    const result = await createAdminStaff(supabase, body)
    
    if (!result.success) {
        return NextResponse.json(result, { status: result.status })
    }

    return NextResponse.json({ success: true, data: result.data }, { status: result.status })
  } catch (err: any) {
    console.error('Unexpected staff creation error:', err)
    return NextResponse.json(
      { success: false, error: { code: ApiErrorCode.INTERNAL_ERROR, message: 'Internal Server Error' } },
      { status: 500 }
    )
  }
}
