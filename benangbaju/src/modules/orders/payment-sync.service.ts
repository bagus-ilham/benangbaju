import crypto from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import { safeLogError } from '@/lib/logger'
import { ApiResponse, ok, fail } from '@/lib/api-response'
import { ApiErrorCode } from '@/lib/api-errors'

export interface PaymentSyncResult {
  order_number: string
  order_status: string
  payment_status: string
  transaction_status: string
  paid_at?: string | null
  message: string
}

export class PaymentSyncService {
  /**
   * Directly verifies and synchronizes order payment status with DOKU Jokul API.
   * Updates database (orders, payments, payment_logs, notifications) accordingly.
   */
  async syncOrderPayment(orderNumber: string): Promise<ApiResponse<PaymentSyncResult>> {
    try {
      const cleanOrderNumber = decodeURIComponent(orderNumber).trim()
      const supabase = createAdminClient()

      // 1. Fetch Order from Database
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('id, order_number, user_id, status, total_amount')
        .eq('order_number', cleanOrderNumber)
        .maybeSingle()

      if (orderError || !order) {
        return fail(ApiErrorCode.NOT_FOUND, 'Pesanan tidak ditemukan di database')
      }

      // 2. Setup DOKU API Credentials
      const clientId = (process.env.DOKU_CLIENT_ID || '').trim()
      const secretKey = (process.env.DOKU_SECRET_KEY || '').trim()
      const isProd =
        process.env.DOKU_ENVIRONMENT?.toLowerCase() === 'production' ||
        process.env.ENVIRONMENT?.toLowerCase() === 'production'
      const defaultApiUrl = isProd ? 'https://api.doku.com' : 'https://api-sandbox.doku.com'
      const dokuEndpoint = (process.env.DOKU_API_URL || defaultApiUrl).trim().replace(/\/$/, '')

      if (!clientId || !secretKey) {
        return fail(
          ApiErrorCode.INTERNAL_ERROR,
          'Kredensial DOKU (DOKU_CLIENT_ID / DOKU_SECRET_KEY) belum dikonfigurasi di server'
        )
      }

      // 3. Generate DOKU Signature for Status Check API
      const requestTarget = `/orders/v1/status/${cleanOrderNumber}`
      const requestId = crypto.randomUUID()
      const requestTimestamp = new Date().toISOString().slice(0, 19) + 'Z'

      const component = `Client-Id:${clientId}\nRequest-Id:${requestId}\nRequest-Timestamp:${requestTimestamp}\nRequest-Target:${requestTarget}`
      const hmac = crypto.createHmac('sha256', secretKey)
      hmac.update(component)
      const signature = `HMACSHA256=${hmac.digest('base64')}`

      // 4. Call DOKU Check Status API with timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)

      let dokuResponse: Response
      try {
        dokuResponse = await fetch(`${dokuEndpoint}${requestTarget}`, {
          method: 'GET',
          headers: {
            'Client-Id': clientId,
            'Request-Id': requestId,
            'Request-Timestamp': requestTimestamp,
            Signature: signature,
          },
          signal: controller.signal,
        })
      } catch (fetchErr: any) {
        clearTimeout(timeoutId)
        safeLogError('Error contacting DOKU Check Status API:', fetchErr)
        return fail(
          ApiErrorCode.INTERNAL_ERROR,
          `Gagal menghubungi gateway DOKU: ${fetchErr.message || 'Koneksi timeout'}`
        )
      }
      clearTimeout(timeoutId)

      const resText = await dokuResponse.text()
      let dokuData: any = {}
      try {
        dokuData = JSON.parse(resText)
      } catch {
        dokuData = { raw: resText }
      }

      if (!dokuResponse.ok) {
        safeLogError('DOKU_STATUS_CHECK_ERROR', new Error(JSON.stringify(dokuData)))
        return fail(
          ApiErrorCode.VALIDATION_ERROR,
          `Gateway DOKU (${dokuResponse.status}): ${
            dokuData?.error?.message || dokuData?.message || 'Gagal mengecek status pembayaran'
          }`
        )
      }

      const transactionStatus = dokuData.transaction?.status || 'UNKNOWN'
      const dokuOrderStatus = dokuData.order?.status || 'UNKNOWN'

      let newOrderStatus = order.status
      let paymentStatus = 'pending'
      let message = 'Status pembayaran: Belum dibayar'

      if (transactionStatus === 'SUCCESS') {
        newOrderStatus = 'processing'
        paymentStatus = 'success'
        message = 'Pembayaran terverifikasi! Pesanan siap diproses.'
      } else if (transactionStatus === 'FAILED') {
        newOrderStatus = 'cancelled'
        paymentStatus = 'failed'
        message = 'Pembayaran gagal di gateway DOKU.'
      } else if (transactionStatus === 'EXPIRED' || dokuOrderStatus === 'ORDER_EXPIRED') {
        newOrderStatus = 'cancelled'
        paymentStatus = 'expired'
        message = 'Sesi pembayaran telah kedaluwarsa.'
      }

      const paidDate =
        dokuData.transaction?.date ||
        dokuData.qris_payment?.date ||
        dokuData.virtual_account_payment?.date ||
        new Date().toISOString()

      // 5. Update Database if status changed
      const isTerminal = ['completed', 'shipped'].includes(order.status)

      // Fetch or verify existing payment record
      const { data: paymentRecord } = await (supabase.from as any)('payments')
        .select('id')
        .eq('order_id', order.id)
        .maybeSingle()

      if (paymentRecord) {
        await (supabase.from as any)('payments')
          .update({
            status: paymentStatus,
            gateway_response: dokuData,
            paid_at: paymentStatus === 'success' ? paidDate : null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', paymentRecord.id)
      }

      // Update orders table
      if (newOrderStatus !== order.status && !isTerminal) {
        if (newOrderStatus === 'processing' && order.status === 'pending_payment') {
          await supabase
            .from('orders')
            .update({ status: 'processing', updated_at: new Date().toISOString() })
            .eq('id', order.id)

          // Insert Notification for Customer
          try {
            await supabase.from('notifications').insert({
              user_id: order.user_id,
              type: 'payment_success',
              title: 'Pembayaran Berhasil!',
              message: `Pembayaran untuk pesanan ${order.order_number} berhasil diverifikasi. Pesanan Anda sedang diproses.`,
              data: { order_id: order.id, order_number: order.order_number },
            })
          } catch (notifErr) {
            safeLogError('PAYMENT_NOTIFICATION_ERROR', notifErr)
          }

          // Trigger invoice generation (best-effort)
          try {
            await supabase.functions.invoke('generate-invoice', {
              body: { order_number: order.order_number },
            })
          } catch (invErr) {
            safeLogError('INVOICE_GENERATION_ERROR', invErr)
          }
        } else if (newOrderStatus === 'cancelled' && order.status === 'pending_payment') {
          await supabase.rpc('cancel_order', {
            p_order_id: order.id,
            p_cancel_reason:
              paymentStatus === 'expired'
                ? 'Pembayaran kedaluwarsa (Sync DOKU)'
                : 'Pembayaran gagal (Sync DOKU)',
          })
        }
      }

      // Insert audit log in payment_logs
      try {
        await (supabase.from as any)('payment_logs').insert({
          gateway_order_id: cleanOrderNumber,
          event_type: `SYNC_${transactionStatus}`,
          raw_payload: dokuData,
          payment_id: paymentRecord?.id || null,
        })
      } catch (logErr) {
        safeLogError('PAYMENT_LOG_ERROR', logErr)
      }

      return ok({
        order_number: cleanOrderNumber,
        order_status: newOrderStatus,
        payment_status: paymentStatus,
        transaction_status: transactionStatus,
        paid_at: paymentStatus === 'success' ? paidDate : null,
        message,
      })
    } catch (err: any) {
      safeLogError('Unexpected error during payment sync:', err)
      return fail(
        ApiErrorCode.INTERNAL_ERROR,
        err.message || 'Terjadi kesalahan saat menyinkronkan status'
      )
    }
  }
}

export const paymentSyncService = new PaymentSyncService()
