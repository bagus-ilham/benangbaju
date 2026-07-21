// @ts-nocheck
// supabase/functions/_shared/doku-signature.ts

import { encode } from "https://deno.land/std@0.177.0/encoding/base64.ts";

export async function generateDokuSignature(
  clientId: string,
  secretKey: string,
  requestId: string,
  requestTimestamp: string,
  requestTarget: string,
  body: any = null
): Promise<string> {
  let digest = '';

  if (body) {
    const bodyStr = JSON.stringify(body);
    const bodyUint8 = new TextEncoder().encode(bodyStr);
    const hashBuffer = await crypto.subtle.digest('SHA-256', bodyUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    digest = encode(new Uint8Array(hashArray));
  }

  let rawString = `Client-Id:${clientId}\nRequest-Id:${requestId}\nRequest-Timestamp:${requestTimestamp}\nRequest-Target:${requestTarget}`;
  
  if (digest) {
    rawString += `\nDigest:${digest}`;
  }

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
    encoder.encode(rawString)
  );

  const signatureBase64 = encode(new Uint8Array(signatureBuffer));
  return `HMACSHA256=${signatureBase64}`;
}
