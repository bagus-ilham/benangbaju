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

    // Normalisasi dan mapping payment_channel ke DOKU payment_method_types
    const normalizeChannelToDoku = (channel: string | null | undefined): string[] | undefined => {
      if (!channel) return undefined;
      const normalized = channel.trim().toUpperCase();
      
      const mapping: Record<string, string[]> = {
        // Direct DOKU channel codes (from payment_fee_config table)
        QRIS: ['QRIS'],
        VIRTUAL_ACCOUNT_BNI: ['VIRTUAL_ACCOUNT_BNI'],
        VIRTUAL_ACCOUNT_DOKU: ['VIRTUAL_ACCOUNT_DOKU'],
        VIRTUAL_ACCOUNT_BCA: ['VIRTUAL_ACCOUNT_BCA'],
        VIRTUAL_ACCOUNT_BANK_MANDIRI: ['VIRTUAL_ACCOUNT_BANK_MANDIRI'],
        VIRTUAL_ACCOUNT_MANDIRI: ['VIRTUAL_ACCOUNT_BANK_MANDIRI'],
        VIRTUAL_ACCOUNT_BRI: ['VIRTUAL_ACCOUNT_BRI'],
        VIRTUAL_ACCOUNT_BANK_PERMATA: ['VIRTUAL_ACCOUNT_BANK_PERMATA'],
        VIRTUAL_ACCOUNT_PERMATA: ['VIRTUAL_ACCOUNT_BANK_PERMATA'],
        VIRTUAL_ACCOUNT_CIMB: ['VIRTUAL_ACCOUNT_CIMB'],
        ONLINE_TO_OFFLINE_ALFA: ['ONLINE_TO_OFFLINE_ALFA'],
        ONLINE_TO_OFFLINE_ALFAMART: ['ONLINE_TO_OFFLINE_ALFA'],
        ONLINE_TO_OFFLINE_INDOMARET: ['ONLINE_TO_OFFLINE_INDOMARET'],
        EMONEY_DOKU: ['EMONEY_DOKU'],
        EMONEY_DANA: ['EMONEY_DANA'],
        EMONEY_OVO: ['EMONEY_OVO'],
        EMONEY_SHOPEEPAY: ['EMONEY_SHOPEEPAY'],
        EMONEY_SHOPEE_PAY: ['EMONEY_SHOPEEPAY'],

        // Legacy / frontend shorthand names
        BCA_VA: ['VIRTUAL_ACCOUNT_BCA'],
        MANDIRI_VA: ['VIRTUAL_ACCOUNT_BANK_MANDIRI'],
        BNI_VA: ['VIRTUAL_ACCOUNT_BNI'],
        BRI_VA: ['VIRTUAL_ACCOUNT_BRI'],
        PERMATA_VA: ['VIRTUAL_ACCOUNT_BANK_PERMATA'],
        CIMB_VA: ['VIRTUAL_ACCOUNT_CIMB'],
        DOKU_VA: ['VIRTUAL_ACCOUNT_DOKU'],
        DANA: ['EMONEY_DANA'],
        OVO: ['EMONEY_OVO'],
        SHOPEEPAY: ['EMONEY_SHOPEEPAY'],
        ALFAMART: ['ONLINE_TO_OFFLINE_ALFA'],
        ALFA: ['ONLINE_TO_OFFLINE_ALFA'],
        INDOMARET: ['ONLINE_TO_OFFLINE_INDOMARET'],
      };

      if (mapping[normalized]) {
        return mapping[normalized];
      }

      if (
        normalized.startsWith('VIRTUAL_ACCOUNT_') ||
        normalized.startsWith('EMONEY_') ||
        normalized.startsWith('ONLINE_TO_OFFLINE_')
      ) {
        return [normalized];
      }

      return undefined;
    };

    const paymentMethods = normalizeChannelToDoku(order.payment_channel);

    // 1. Check if a valid payment URL already exists for this order with matching payment method
    const { data: existingPayment } = await supabaseClient
      .from('payments')
      .select('gateway_response')
      .eq('order_id', order.id)
      .maybeSingle();

    if (existingPayment?.gateway_response?.response?.payment?.url) {
      const existingMethods: string[] =
        existingPayment.gateway_response.response.payment.payment_method_types || [];
      
      // Check if cached payment method types exactly match the requested methods
      const isMethodMatching =
        !paymentMethods ||
        (Array.isArray(existingMethods) &&
          existingMethods.length === paymentMethods.length &&
          paymentMethods.every((m) => existingMethods.includes(m)));

      if (isMethodMatching) {
        const existingUrl = existingPayment.gateway_response.response.payment.url;
        const existingToken = existingPayment.gateway_response.response.payment.token_id || '';
        return new Response(
          JSON.stringify({
            success: true,
            data: {
              token: existingToken,
              redirect_url: existingUrl,
            },
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }
    }

    // Persiapan parameter DOKU
    const clientId = (Deno.env.get('DOKU_CLIENT_ID') ?? '').trim();
    const secretKey = (Deno.env.get('DOKU_SECRET_KEY') ?? '').trim();
    const isProd =
      Deno.env.get('DOKU_ENVIRONMENT')?.toLowerCase() === 'production' ||
      Deno.env.get('ENVIRONMENT')?.toLowerCase() === 'production';
    const defaultApiUrl = isProd ? 'https://api.doku.com' : 'https://api-sandbox.doku.com';
    const dokuEndpoint = (Deno.env.get('DOKU_API_URL') ?? defaultApiUrl).trim().replace(/\/$/, ''); 
    const requestTarget = '/checkout/v1/payment';

    if (!clientId || !secretKey) {
      throw new Error('DOKU_CLIENT_ID / DOKU_SECRET_KEY belum dikonfigurasi di Supabase Edge Function Secrets');
    }
    
    // Always use a unique UUID for DOKU Request-Id to prevent "REQUEST ID ALREADY USED" errors
    const requestId = crypto.randomUUID();
    const requestTimestamp = new Date().toISOString().slice(0, 19) + 'Z';

    // Hitung dueDate dalam menit (misal 60 menit)
    const paymentDueDate = 60;

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
