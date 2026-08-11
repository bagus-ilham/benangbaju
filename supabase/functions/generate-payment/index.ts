// @ts-nocheck
// supabase/functions/generate-payment/index.ts

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { generateDokuSignature } from "../_shared/doku-signature.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('NEXT_PUBLIC_APP_URL') ?? '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, Idempotency-Key',
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

    // Ambil data order
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .select('*, order_shipping(*), profiles:user_id(name, email)')
      .eq('order_number', order_number)
      .single();

    if (orderError || !order) {
      throw new Error('Order not found');
    }

    if (order.user_id !== user.id) {
      throw new Error('Unauthorized');
    }

    // 1. Check if a valid payment URL already exists for this order
    const { data: existingPayment } = await supabaseClient
      .from('payments')
      .select('gateway_response')
      .eq('order_id', order.id)
      .maybeSingle();

    if (existingPayment?.gateway_response?.response?.payment?.url) {
      const existingUrl = existingPayment.gateway_response.response.payment.url;
      const existingToken = existingPayment.gateway_response.response.payment.token_id || '';
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            token: existingToken,
            redirect_url: existingUrl
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Persiapan parameter DOKU
    const clientId = Deno.env.get('DOKU_CLIENT_ID') ?? '';
    const secretKey = Deno.env.get('DOKU_SECRET_KEY') ?? '';
    const dokuEndpoint = Deno.env.get('DOKU_API_URL') ?? 'https://api-sandbox.doku.com'; 
    const requestTarget = '/checkout/v1/payment';

    if (!clientId || !secretKey) {
      throw new Error('DOKU_CLIENT_ID / DOKU_SECRET_KEY belum dikonfigurasi di Supabase Edge Function Secrets');
    }
    
    // Always use a unique UUID for DOKU Request-Id to prevent "REQUEST ID ALREADY USED" errors
    const requestId = crypto.randomUUID();
    const requestTimestamp = new Date().toISOString().slice(0, 19) + 'Z';

    // Hitung dueDate dalam menit (misal 60 menit)
    const paymentDueDate = 60;

    // Mapping payment_channel ke DOKU payment_method_types agar DOKU HANYA menampilkan metode yang dipilih customer
    const channelMapping: Record<string, string[]> = {
      bca_va: ['VIRTUAL_ACCOUNT_BCA'],
      mandiri_va: ['VIRTUAL_ACCOUNT_BANK_MANDIRI', 'VIRTUAL_ACCOUNT_MANDIRI'],
      bni_va: ['VIRTUAL_ACCOUNT_BNI'],
      bri_va: ['VIRTUAL_ACCOUNT_BRI'],
      permata_va: ['VIRTUAL_ACCOUNT_BANK_PERMATA', 'VIRTUAL_ACCOUNT_PERMATA'],
      cimb_va: ['VIRTUAL_ACCOUNT_CIMB', 'VIRTUAL_ACCOUNT_CIMB_NIAGA'],
      qris: ['QRIS'],
      dana: ['EMONEY_DANA', 'DANA'],
      ovo: ['EMONEY_OVO', 'OVO'],
      shopeepay: ['EMONEY_SHOPEEPAY', 'SHOPEEPAY'],
      alfamart: ['ONLINE_TO_OFFLINE_ALFAMART', 'ALFAMART'],
      indomaret: ['ONLINE_TO_OFFLINE_INDOMARET', 'INDOMARET'],
    };

    const paymentMethods = order.payment_channel ? channelMapping[order.payment_channel] : undefined;

    const dokuPayload: any = {
      order: {
        amount: Math.round(Number(order.total_amount)),
        invoice_number: String(order.order_number),
      },
      payment: {
        payment_due_date: paymentDueDate,
        ...(paymentMethods ? { payment_method_types: paymentMethods } : {}),
      },
      customer: {
        id: String(user.id),
        name: String(order.profiles?.name || order.order_shipping?.recipient_name || 'Customer'),
        email: String(order.profiles?.email || 'customer@example.com'),
        phone: String(order.order_shipping?.phone || '08123456789'),
      }
    };

    const signature = await generateDokuSignature(
      clientId,
      secretKey,
      requestId,
      requestTimestamp,
      requestTarget,
      dokuPayload
    );

    const dokuResponse = await fetch(`${dokuEndpoint}${requestTarget}`, {
      method: 'POST',
      headers: {
        'Client-Id': clientId,
        'Request-Id': requestId,
        'Request-Timestamp': requestTimestamp,
        'Signature': signature,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(dokuPayload)
    });

    const dokuResText = await dokuResponse.text();
    let dokuData: any = {};
    try {
      dokuData = JSON.parse(dokuResText);
    } catch {
      dokuData = { raw: dokuResText };
    }

    if (!dokuResponse.ok || !dokuData.response || !dokuData.response.payment || !dokuData.response.payment.url) {
      console.error('DOKU Error Status:', dokuResponse.status, dokuData);
      const errDetail = dokuData?.error?.message || dokuData?.message || (typeof dokuData === 'object' ? JSON.stringify(dokuData) : dokuResText);
      throw new Error(`DOKU Error (${dokuResponse.status}): ${errDetail}`);
    }

    const paymentUrl = dokuData.response.payment.url;
    const paymentInstructions = {
      checkout_url: paymentUrl,
      ...(dokuData.response?.payment || {}),
      ...(dokuData.virtual_account_info || {}),
      ...(dokuData.online_to_offline_info || {}),
      ...(dokuData.qris_info || {}),
    };

    // Upsert gateway reference di tabel payments (mencegah duplicate row pada retry)
    const { error: insertError } = await supabaseClient
      .from('payments')
      .upsert(
        {
          order_id: order.id,
          gateway_order_id: order.order_number,
          amount: order.total_amount,
          payment_fee: order.payment_fee || 0,
          payment_channel: order.payment_channel || null,
          payment_instructions: paymentInstructions,
          status: 'pending',
          gateway_response: dokuData,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'order_id' }
      );

    if (insertError) {
      console.error('Insert payment error:', insertError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          token: dokuData.response.payment.token_id || '', 
          redirect_url: paymentUrl
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error: any) {
    console.error('Error generating payment:', error.message);
    return new Response(
      JSON.stringify({ success: false, message: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
