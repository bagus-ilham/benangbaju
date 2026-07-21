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
      .select('*')
      .eq('order_number', order_number)
      .single();

    if (orderError || !order) {
      throw new Error('Order not found');
    }

    if (order.user_id !== user.id) {
      throw new Error('Unauthorized');
    }

    // DOKU Check Status API
    const clientId = Deno.env.get('DOKU_CLIENT_ID') ?? '';
    const secretKey = Deno.env.get('DOKU_SECRET_KEY') ?? '';
    const dokuEndpoint = 'https://api-sandbox.doku.com';
    const requestTarget = `/orders/v1/status/${order_number}`; 
    const requestId = crypto.randomUUID();
    const requestTimestamp = new Date().toISOString().substring(0, 19) + "Z";

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

    const dokuData = await dokuResponse.json();

    let newStatus = order.status;
    let paymentStatus = 'pending';

    // Map DOKU status to our status
    if (dokuResponse.ok && dokuData.transaction && dokuData.transaction.status === 'SUCCESS') {
      newStatus = 'processing';
      paymentStatus = 'success';
    } else if (dokuData.transaction && dokuData.transaction.status === 'FAILED') {
      paymentStatus = 'failed';
    }

    // Update status pesanan jika sukses
    if (newStatus !== order.status) {
      await supabaseClient
        .from('orders')
        .update({ status: newStatus })
        .eq('id', order.id);
    }

    // Update payments table if it exists
    await supabaseClient
      .from('payments')
      .update({ status: paymentStatus, gateway_response: dokuData })
      .eq('order_id', order.id);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          order_status: newStatus,
          payment_status: paymentStatus,
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
