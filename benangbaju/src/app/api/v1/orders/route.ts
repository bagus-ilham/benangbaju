import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

import { ApiErrorCode } from '@/lib/api-errors'

export async function POST(req: Request) {
  try {
    const supabase = await createServerClient()

    // Auth check: mobile app users must send a valid Bearer token which Supabase middleware validates
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: ApiErrorCode.UNAUTHORIZED, message: 'Unauthorized' } },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { addressId, courierName, shippingCost, notes, voucherCode } = body

    if (!addressId || !courierName || shippingCost === undefined) {
      return NextResponse.json(
        {
          success: false,
          error: { code: ApiErrorCode.VALIDATION_ERROR, message: 'Missing required fields' },
        },
        { status: 400 }
      )
    }

    const { orderService } = await import('@/modules/orders/order.service')
    const result = await orderService.createOrder({
      userId: user.id,
      addressId,
      courierName,
      shippingCost,
      notes,
      voucherCode,
    })

    if (!result.success) {
      return NextResponse.json(result, { status: 400 })
    }

    return NextResponse.json(result, { status: 201 })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    console.error('Create Order API error:', err)
    return NextResponse.json(
      {
        success: false,
        error: { code: ApiErrorCode.INTERNAL_ERROR, message: 'Internal Server Error' },
      },
      { status: 500 }
    )
  }
}
