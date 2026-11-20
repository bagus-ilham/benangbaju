// @ts-nocheck
// supabase/functions/_shared/doku-signature.ts

import { encode } from "https://deno.land/std@0.177.0/encoding/base64.ts";

declare const Deno: any;

export function getDokuTimestamp(date: Date = new Date()): string {
  return date.toISOString().slice(0, 19) + "Z";
}

export function getDokuApiUrl(): string {
  const isProd =
    Deno.env.get("DOKU_ENVIRONMENT")?.toLowerCase() === "production" ||
    Deno.env.get("ENVIRONMENT")?.toLowerCase() === "production";
  const defaultApiUrl = isProd ? "https://api.doku.com" : "https://api-sandbox.doku.com";
  return (Deno.env.get("DOKU_API_URL") ?? defaultApiUrl).trim().replace(/\/$/, "");
}

export function getCanonicalAppUrl(): string {
  const raw = (Deno.env.get("APP_URL") ?? Deno.env.get("NEXT_PUBLIC_APP_URL") ?? "").trim();
  const fallback = "https://www.benangbaju.com";
  if (!raw) return fallback;
  try {
    const url = new URL(raw);
    if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
      return fallback;
    }
    if (url.hostname === "benangbaju.com") {
      url.hostname = "www.benangbaju.com";
    }
    return url.origin;
  } catch {
    return fallback;
  }
}

export function extractDokuPaidAt(dokuData: any): string {
  return (
    dokuData?.transaction?.date ||
    dokuData?.qris_payment?.date ||
    dokuData?.virtual_account_payment?.date ||
    new Date().toISOString()
  );
}

/**
 * Constant-time string comparison to prevent timing side-channel attacks
 */
export async function constantTimeCompare(a: string, b: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const aBuf = await crypto.subtle.digest("SHA-256", encoder.encode(a));
  const bBuf = await crypto.subtle.digest("SHA-256", encoder.encode(b));
  const aArr = new Uint8Array(aBuf);
  const bArr = new Uint8Array(bBuf);
  let result = a.length ^ b.length;
  for (let i = 0; i < aArr.length; i++) {
    result |= aArr[i] ^ bArr[i];
  }
  return result === 0;
}

export async function generateDokuSignature(
  clientId: string,
  secretKey: string,
  requestId: string,
  requestTimestamp: string,
  requestTarget: string,
  body: any = null
): Promise<string> {
  let digest = "";

  if (body !== null && body !== undefined) {
    const bodyStr = typeof body === "string" ? body : JSON.stringify(body);
    const bodyUint8 = new TextEncoder().encode(bodyStr);
    const hashBuffer = await crypto.subtle.digest("SHA-256", bodyUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    digest = encode(new Uint8Array(hashArray));
  }

  let rawString = `Client-Id:${clientId}\nRequest-Id:${requestId}\nRequest-Timestamp:${requestTimestamp}\nRequest-Target:${requestTarget}`;

  if (digest) {
    rawString += `\nDigest:${digest}`;
  }

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secretKey),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(rawString)
  );

  const signatureBase64 = encode(new Uint8Array(signatureBuffer));
  return `HMACSHA256=${signatureBase64}`;
}
