// =============================================================
// Edge Function: doku-webhook
// Handles DOKU Jokul payment notification callbacks (HTTP POST)
// =============================================================

// @ts-ignore
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
// @ts-ignore
import { encode as base64Encode } from "https://deno.land/std@0.177.0/encoding/base64.ts";

declare const Deno: any;

interface DokuNotificationPayload {
  order: {
    invoice_number: string;
    amount: number | string;
  };
  transaction?: {
    status?: string;
    date?: string;
  };
  service?: {
    id?: string;
  };
  acquirer?: {
    id?: string;
  };
}

/**
 * Constant-time string comparison to prevent timing side-channel attacks
 */
function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Verifies DOKU HMAC SHA-256 Notification Signature
 */
async function verifyDokuNotificationSignature(
  req: Request,
  rawBody: string,
  secretKey: string
): Promise<boolean> {
  try {
    const clientId = req.headers.get('Client-Id') || '';
    const requestId = req.headers.get('Request-Id') || '';
    const requestTimestamp = req.headers.get('Request-Timestamp') || '';
    const incomingSignature = req.headers.get('Signature') || '';
    const requestTarget = new URL(req.url).pathname;

    if (!incomingSignature || !clientId || !requestId || !requestTimestamp) {
      return false;
    }

    // Compute SHA-256 Digest of raw HTTP request body
    const bodyUint8 = new TextEncoder().encode(rawBody);
    const hashBuffer = await crypto.subtle.digest('SHA-256', bodyUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const digest = base64Encode(new Uint8Array(hashArray));

    // Construct Signature Component string according to DOKU Spec
    const component = `Client-Id:${clientId}\nRequest-Id:${requestId}\nRequest-Timestamp:${requestTimestamp}\nRequest-Target:${requestTarget}\nDigest:${digest}`;

    // Compute HMAC SHA-256 using secretKey
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secretKey),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signatureBuffer = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(component)
    );

    const calculatedSignature = `HMACSHA256=${base64Encode(new Uint8Array(signatureBuffer))}`;

    return constantTimeCompare(calculatedSignature, incomingSignature);
  } catch (err) {
    console.error('Error verifying DOKU signature:', err);
    return false;
  }
}

serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const secretKey = Deno.env.get('DOKU_SECRET_KEY');
    if (!secretKey) {
      console.error('Missing DOKU_SECRET_KEY environment variable');
      return new Response(
        JSON.stringify({ success: false, message: 'Server configuration error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const rawBody = await req.text();
    let payload: DokuNotificationPayload;

    try {
      payload = JSON.parse(rawBody);
    } catch {
      return new Response(
        JSON.stringify({ success: false, message: 'Invalid JSON payload' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 1. SIGNATURE VERIFICATION (Constant-time comparison)
    const isSignatureValid = await verifyDokuNotificationSignature(req, rawBody, secretKey);
    if (!isSignatureValid) {
      console.error('Invalid DOKU HMAC signature');
      return new Response(
        JSON.stringify({ success: false, message: 'Invalid signature' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const invoiceNumber = payload.order?.invoice_number;
    const rawAmount = payload.order?.amount;
    const transactionStatus = payload.transaction?.status || 'UNKNOWN';

    if (!invoiceNumber || rawAmount === undefined) {
      return new Response(
        JSON.stringify({ success: false, message: 'Missing order parameters' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase credentials in Edge Function environment');
      return new Response(
        JSON.stringify({ success: false, message: 'Server configuration error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 2. IDEMPOTENCY CHECK via payment_logs table
    const { data: existingLog, error: logFetchError } = await supabase
      .from('payment_logs')
      .select('id')
      .eq('midtrans_order_id', invoiceNumber)
      .eq('event_type', transactionStatus)
      .maybeSingle();

    if (logFetchError) {
      console.error('Error checking payment logs idempotency:', logFetchError);
    }

    if (existingLog) {
      console.log(`Duplicate webhook ignored for order: ${invoiceNumber}, status: ${transactionStatus}`);
      return new Response(
        JSON.stringify({ success: true, message: 'Already processed' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 3. FETCH ORDER FROM DATABASE & AMOUNT CROSS-CHECKING
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, order_number, user_id, status, total_amount')
      .eq('order_number', invoiceNumber)
      .single();

    if (orderError || !order) {
      console.error('Order not found in database:', invoiceNumber);
      return new Response(
        JSON.stringify({ success: false, message: 'Order not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // CROSS-CHECK: Compare payload amount with DB amount to prevent parameter tampering
    const webhookAmount = Number(rawAmount);
    const dbAmount = Number(order.total_amount);

    if (Math.abs(webhookAmount - dbAmount) > 0.01) {
      console.error(`Amount mismatch! DB amount: ${dbAmount}, Webhook amount: ${webhookAmount}`);
      return new Response(
        JSON.stringify({ success: false, message: 'Payment amount mismatch' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 4. PROCESS STATUS UPDATE & IDEMPOTENT DB ACTIONS
    let orderStatus: string | null = null;
    let paymentStatus: string | null = null;

    if (transactionStatus === 'SUCCESS') {
      orderStatus = 'processing';
      paymentStatus = 'success';
    } else if (transactionStatus === 'FAILED' || transactionStatus === 'EXPIRED') {
      orderStatus = 'cancelled';
      paymentStatus = transactionStatus === 'EXPIRED' ? 'expired' : 'failed';
    }

    // If order is already paid/processing, return HTTP 200 OK immediately
    if (order.status === 'processing' || order.status === 'completed' || order.status === 'shipped') {
      console.log(`Order ${order.order_number} is already in state ${order.status}`);
      return new Response(
        JSON.stringify({ success: true, message: 'Order already updated' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Update payment record in database
    const { data: payment } = await supabase
      .from('payments')
      .select('id')
      .eq('order_id', order.id)
      .single();

    if (payment) {
      await supabase
        .from('payments')
        .update({
          status: paymentStatus,
          gateway_response: payload,
          paid_at: paymentStatus === 'success' ? new Date().toISOString() : null,
        })
        .eq('id', payment.id);
    }

    // Update Order Status & Send Notifications
    if (orderStatus === 'processing' && order.status === 'pending_payment') {
      await supabase
        .from('orders')
        .update({ status: 'processing' })
        .eq('id', order.id);

      // Create notification for customer
      await supabase.from('notifications').insert({
        user_id: order.user_id,
        type: 'payment_success',
        title: 'Pembayaran Berhasil!',
        message: `Pembayaran untuk pesanan ${order.order_number} berhasil diterima. Pesanan sedang diproses.`,
        data: { order_id: order.id, order_number: order.order_number },
      });

      // Trigger generate-invoice Edge Function
      try {
        await supabase.functions.invoke('generate-invoice', {
          body: { order_number: order.order_number },
        });
      } catch (err) {
        console.error('Error invoking generate-invoice:', err);
      }
    } else if (orderStatus === 'cancelled' && order.status === 'pending_payment') {
      await supabase.rpc('cancel_order', {
        p_order_id: order.id,
        p_cancel_reason: transactionStatus === 'EXPIRED' ? 'Pembayaran kadaluarsa' : 'Pembayaran gagal',
      });
    }

    // Log event to payment_logs for idempotency tracking
    if (payment?.id) {
      await supabase.from('payment_logs').insert({
        midtrans_order_id: invoiceNumber,
        event_type: transactionStatus,
        raw_payload: payload,
        payment_id: payment.id,
      });
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('doku-webhook error:', error.message || error);
    return new Response(
      JSON.stringify({ success: false, message: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
