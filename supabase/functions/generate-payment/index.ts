// @ts-nocheck
// supabase/functions/generate-payment/index.ts

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { generateDokuSignature } from "../_shared/doku-signature.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
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

    // Persiapan parameter DOKU
    const clientId = Deno.env.get('DOKU_CLIENT_ID') ?? '';
    const secretKey = Deno.env.get('DOKU_SECRET_KEY') ?? '';
    // Assuming Sandbox for now based on context
    const dokuEndpoint = 'https://api-sandbox.doku.com'; 
    const requestTarget = '/checkout/v1/payment';
    
    // Idempotency: use the header or generate a new random uuid
    const requestId = req.headers.get('Idempotency-Key') || crypto.randomUUID();
    const requestTimestamp = new Date().toISOString().substring(0, 19) + "Z"; // YYYY-MM-DDThh:mm:ssZ

    // Hitung dueDate dalam menit (misal 60 menit)
    const paymentDueDate = 60;

    const dokuPayload = {
      order: {
        amount: order.total_amount,
        invoice_number: order.order_number,
      },
      payment: {
        payment_due_date: paymentDueDate,
      },
      customer: {
        id: user.id,
        name: order.order_shipping?.recipient_name || order.profiles?.name || 'Customer',
        email: order.profiles?.email || 'customer@example.com',
        phone: order.order_shipping?.phone || '',
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

    const dokuData = await dokuResponse.json();

    if (!dokuResponse.ok || !dokuData.response || !dokuData.response.payment || !dokuData.response.payment.url) {
      console.error('DOKU Error:', dokuData);
      throw new Error('Failed to generate payment URL from DOKU');
    }

    const paymentUrl = dokuData.response.payment.url;

    // Simpan gateway reference di tabel payments
    const { error: insertError } = await supabaseClient
      .from('payments')
      .insert({
        order_id: order.id,
        gateway_order_id: order.order_number, // usually we use order_number as gateway order ID
        amount: order.total_amount,
        status: 'pending',
        gateway_response: dokuData
      });

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
