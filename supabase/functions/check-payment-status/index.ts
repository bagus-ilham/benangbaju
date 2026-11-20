// @ts-nocheck
// supabase/functions/check-payment-status/index.ts

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { generateDokuSignature } from "../_shared/doku-signature.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization')!;
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const body = await req.json();
    const { order_number } = body;

    if (!order_number) {
      throw new Error('order_number is required');
    }

    // Ambil order
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .select('*, order_shipping(country_code)')
      .eq('order_number', order_number)
      .single();

    if (orderError || !order) {
      throw new Error('Order not found');
    }

    if (order.user_id !== user.id) {
      const { data: callerProfile } = await supabaseClient
        .from('profiles')
        .select('role, is_active')
        .eq('id', user.id)
        .maybeSingle();

      const callerRole = callerProfile?.role?.toLowerCase();
      if (callerProfile?.is_active === false || (callerRole !== 'admin' && callerRole !== 'staff')) {
        throw new Error('Unauthorized');
      }
    }

    // Fetch existing payment record to preserve gateway instructions/URL
    const { data: existingPayment } = await supabaseClient
      .from('payments')
      .select('*')
      .eq('order_id', order.id)
      .maybeSingle();

    // DOKU Check Status API
    const clientId = (Deno.env.get('DOKU_CLIENT_ID') ?? '').trim();
    const secretKey = (Deno.env.get('DOKU_SECRET_KEY') ?? '').trim();
    const isProd =
      Deno.env.get('DOKU_ENVIRONMENT')?.toLowerCase() === 'production' ||
      Deno.env.get('ENVIRONMENT')?.toLowerCase() === 'production';
    const defaultApiUrl = isProd ? 'https://api.doku.com' : 'https://api-sandbox.doku.com';
    const dokuEndpoint = (Deno.env.get('DOKU_API_URL') ?? defaultApiUrl).trim().replace(/\/$/, '');
    const requestTarget = `/orders/v1/status/${order_number}`; 
    const requestId = crypto.randomUUID();
    const requestTimestamp = new Date().toISOString();

    const signature = await generateDokuSignature(
      clientId,
      secretKey,
      requestId,
      requestTimestamp,
      requestTarget,
      null // GET request, no body
    );

    const dokuResponse = await fetch(`${dokuEndpoint}${requestTarget}`, {
      method: 'GET',
      headers: {
        'Client-Id': clientId,
        'Request-Id': requestId,
        'Request-Timestamp': requestTimestamp,
        'Signature': signature
      }
    });

    const dokuData = await dokuResponse.json().catch(() => ({}));

    if (!dokuResponse.ok) {
      throw new Error(
        dokuData?.error?.message ||
          dokuData?.message ||
          `DOKU status check failed (${dokuResponse.status})`
      );
    }

    const isTerminalState = ['cancelled', 'completed', 'processing', 'shipped'].includes(order.status);
    let newStatus = order.status;
    let paymentStatus = existingPayment?.status || 'pending';

    const transactionStatus = dokuData.transaction?.status?.toUpperCase();
    const dokuOrderStatus = dokuData.order?.status?.toUpperCase();

    // Map DOKU status to our status
    if (transactionStatus === 'SUCCESS') {
      const dokuAmount = dokuData.order?.amount != null ? Number(dokuData.order.amount) : null;
      if (dokuAmount !== null && !isNaN(dokuAmount) && Math.abs(dokuAmount - Number(order.total_amount)) > 1) {
        throw new Error('Nominal pembayaran DOKU tidak sesuai dengan total pesanan');
      }
      newStatus = 'processing';
      paymentStatus = 'success';
    } else if (
      transactionStatus === 'FAILED' ||
      transactionStatus === 'EXPIRED' ||
      dokuOrderStatus === 'ORDER_EXPIRED'
    ) {
      newStatus = 'cancelled';
      paymentStatus = transactionStatus === 'FAILED' ? 'failed' : 'expired';
    }

    let finalOrderStatus = order.status;

    // Update status pesanan jika status berubah, tapi jangan ubah order yang sudah di terminal state
    if (newStatus !== order.status && !isTerminalState) {
      if (newStatus === 'processing' && order.status === 'pending_payment') {
        await supabaseClient
          .from('orders')
          .update({ status: 'processing' })
          .eq('id', order.id);
        finalOrderStatus = 'processing';

        // Create notification for customer (bilingual EN for MY, ID for domestic)
        const rawShipping = order.order_shipping;
        const shipping = Array.isArray(rawShipping) ? rawShipping[0] : rawShipping;
        const isMalaysia = shipping?.country_code === 'MY';

        await supabaseClient.from('notifications').insert({
          user_id: order.user_id,
          type: 'payment_success',
          title: isMalaysia ? 'Payment Successful!' : 'Pembayaran Berhasil!',
          message: isMalaysia
            ? `Payment for order #${order.order_number} has been received. Your order is now being prepared for international dispatch.`
            : `Pembayaran untuk pesanan ${order.order_number} berhasil diterima. Pesanan sedang diproses.`,
          data: {
            order_id: order.id,
            order_number: order.order_number,
            country_code: shipping?.country_code || 'ID',
          },
        });

        // Trigger generate-invoice Edge Function
        try {
          await supabaseClient.functions.invoke('generate-invoice', {
            body: { order_number: order.order_number },
          });
        } catch (err) {
          console.error('Error invoking generate-invoice from check-payment-status:', err);
        }
      } else if (newStatus === 'cancelled' && order.status === 'pending_payment') {
        // Gunakan RPC cancel_order dengan nama parameter p_cancel_reason yang benar agar stok varian dilepas
        await supabaseClient.rpc('cancel_order', {
          p_order_id: order.id,
          p_cancel_reason: `Sesi pembayaran ${paymentStatus} dari payment gateway (DOKU)`,
        });
        finalOrderStatus = 'cancelled';
      } else {
        await supabaseClient
          .from('orders')
          .update({ status: newStatus })
          .eq('id', order.id);
        finalOrderStatus = newStatus;
      }
    }

    // Merge gateway response to preserve existing checkout URL and instruction metadata
    const updatedGatewayResponse = existingPayment?.gateway_response
      ? { ...existingPayment.gateway_response, status_check: dokuData }
      : dokuData;

    // Protect terminal/already-paid payment records from being downgraded back to pending/null paid_at
    const shouldPreservePaymentState =
      existingPayment?.status === 'success' || isTerminalState;
    const finalPaymentStatus = shouldPreservePaymentState
      ? existingPayment?.status || paymentStatus
      : paymentStatus;

    const paymentUpdatePayload: Record<string, any> = {
      gateway_response: updatedGatewayResponse,
      updated_at: new Date().toISOString(),
    };

    if (!shouldPreservePaymentState) {
      paymentUpdatePayload.status = finalPaymentStatus;
      paymentUpdatePayload.paid_at =
        finalPaymentStatus === 'success'
          ? existingPayment?.paid_at || new Date().toISOString()
          : existingPayment?.paid_at || null;
    }

    // Update payments table if it exists
    await supabaseClient
      .from('payments')
      .update(paymentUpdatePayload)
      .eq('order_id', order.id);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          order_status: finalOrderStatus,
          payment_status: finalPaymentStatus,
          transaction_status: dokuData.transaction?.status || 'UNKNOWN'
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error: any) {
    console.error('Error checking payment status:', error.message);
    return new Response(
      JSON.stringify({ success: false, message: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
