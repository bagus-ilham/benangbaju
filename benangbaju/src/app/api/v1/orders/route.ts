import { NextResponse } from 'next/server'
import { ApiErrorCode } from '@/lib/api-errors'
import { requireAuth } from '@/lib/auth-guard'
import { createSecureOrderAction } from '@/modules/orders/actions'
import { safeLogError } from '@/lib/logger'

export async function POST(req: Request) {
  try {
    const { user } = await requireAuth()

    const body = await req.json()
    const { addressId, courierName, shippingCost, notes, voucherCode, shippingRateId } = body

    if (!addressId || !courierName || shippingCost === undefined) {
      return NextResponse.json(
        {
          success: false,
          error: { code: ApiErrorCode.VALIDATION_ERROR, message: 'Missing required fields' },
        },
        { status: 400 }
      )
    }

    const result = await createSecureOrderAction({
      userId: user.id,
      addressId,
      courierName,
      shippingRateId,
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
    safeLogError('Create Order API error:', err)

    // If it's an auth error from requireAuth
    if (err.name === 'UnauthorizedError') {
      return NextResponse.json(
        { success: false, error: { code: ApiErrorCode.UNAUTHORIZED, message: 'Unauthorized' } },
        { status: 401 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: { code: ApiErrorCode.INTERNAL_ERROR, message: 'Internal Server Error' },
      },
      { status: 500 }
    )
  }
}
