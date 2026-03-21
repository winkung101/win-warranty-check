import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Web Push utilities using Web Crypto API
function base64UrlToUint8Array(base64Url: string): Uint8Array {
  const padding = "=".repeat((4 - (base64Url.length % 4)) % 4);
  const base64 = (base64Url + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

function uint8ArrayToBase64Url(arr: Uint8Array): string {
  let binary = "";
  for (const byte of arr) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function generateJwt(
  endpoint: string,
  vapidPrivateKey: string,
  vapidPublicKey: string
): Promise<string> {
  const url = new URL(endpoint);
  const audience = `${url.protocol}//${url.host}`;
  const expiration = Math.floor(Date.now() / 1000) + 12 * 60 * 60;

  const header = { typ: "JWT", alg: "ES256" };
  const payload = {
    aud: audience,
    exp: expiration,
    sub: "mailto:admin@wintech.com",
  };

  const encodedHeader = uint8ArrayToBase64Url(
    new TextEncoder().encode(JSON.stringify(header))
  );
  const encodedPayload = uint8ArrayToBase64Url(
    new TextEncoder().encode(JSON.stringify(payload))
  );

  const unsignedToken = `${encodedHeader}.${encodedPayload}`;

  // Import private key
  const privateKeyBytes = base64UrlToUint8Array(vapidPrivateKey);
  const publicKeyBytes = base64UrlToUint8Array(vapidPublicKey);

  // Build raw key (private + public)
  const jwk = {
    kty: "EC",
    crv: "P-256",
    x: uint8ArrayToBase64Url(publicKeyBytes.slice(1, 33)),
    y: uint8ArrayToBase64Url(publicKeyBytes.slice(33, 65)),
    d: uint8ArrayToBase64Url(privateKeyBytes),
  };

  const key = await crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: { name: "SHA-256" } },
    key,
    new TextEncoder().encode(unsignedToken)
  );

  // Convert DER to raw format if needed
  const sigArray = new Uint8Array(signature);
  let r: Uint8Array, s: Uint8Array;

  if (sigArray.length === 64) {
    r = sigArray.slice(0, 32);
    s = sigArray.slice(32, 64);
  } else {
    // DER format
    const rLen = sigArray[3];
    const rStart = 4;
    r = sigArray.slice(rStart, rStart + rLen);
    const sLen = sigArray[rStart + rLen + 1];
    const sStart = rStart + rLen + 2;
    s = sigArray.slice(sStart, sStart + sLen);
    // Pad/trim to 32 bytes
    if (r.length > 32) r = r.slice(r.length - 32);
    if (s.length > 32) s = s.slice(s.length - 32);
    if (r.length < 32) { const p = new Uint8Array(32); p.set(r, 32 - r.length); r = p; }
    if (s.length < 32) { const p = new Uint8Array(32); p.set(s, 32 - s.length); s = p; }
  }

  const rawSig = new Uint8Array(64);
  rawSig.set(r, 0);
  rawSig.set(s, 32);

  return `${unsignedToken}.${uint8ArrayToBase64Url(rawSig)}`;
}

async function encryptPayload(
  p256dhKey: string,
  authSecret: string,
  payload: string
): Promise<{ encrypted: Uint8Array; salt: Uint8Array; localPublicKey: Uint8Array }> {
  // Generate local ECDH key pair
  const localKeyPair = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveBits"]
  );

  const localPublicKeyRaw = new Uint8Array(
    await crypto.subtle.exportKey("raw", localKeyPair.publicKey)
  );

  // Import subscriber's public key
  const subscriberKeyBytes = base64UrlToUint8Array(p256dhKey);
  const subscriberKey = await crypto.subtle.importKey(
    "raw",
    subscriberKeyBytes,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    []
  );

  // Derive shared secret
  const sharedSecret = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: "ECDH", public: subscriberKey },
      localKeyPair.privateKey,
      256
    )
  );

  const authSecretBytes = base64UrlToUint8Array(authSecret);
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // HKDF to derive encryption key
  const authInfo = new TextEncoder().encode("Content-Encoding: auth\0");
  const prkKey = await crypto.subtle.importKey("raw", sharedSecret, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);

  // IKM = HKDF-Extract(auth_secret, shared_secret) 
  const ikmKey = await crypto.subtle.importKey("raw", authSecretBytes, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const ikm = new Uint8Array(await crypto.subtle.sign("HMAC", ikmKey, sharedSecret));

  // PRK = HKDF-Extract(salt, ikm)
  const saltKey = await crypto.subtle.importKey("raw", salt, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const prk = new Uint8Array(await crypto.subtle.sign("HMAC", saltKey, ikm));

  // Content encryption key info
  const cekInfo = new Uint8Array([
    ...new TextEncoder().encode("Content-Encoding: aesgcm\0"),
    ...new TextEncoder().encode("P-256\0"),
    0, 65, ...subscriberKeyBytes,
    0, 65, ...localPublicKeyRaw,
  ]);

  const prkForCek = await crypto.subtle.importKey("raw", prk, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const cekFull = new Uint8Array(await crypto.subtle.sign("HMAC", prkForCek, new Uint8Array([...cekInfo, 1])));
  const cek = cekFull.slice(0, 16);

  // Nonce info
  const nonceInfo = new Uint8Array([
    ...new TextEncoder().encode("Content-Encoding: nonce\0"),
    ...new TextEncoder().encode("P-256\0"),
    0, 65, ...subscriberKeyBytes,
    0, 65, ...localPublicKeyRaw,
  ]);
  const nonceFull = new Uint8Array(await crypto.subtle.sign("HMAC", prkForCek, new Uint8Array([...nonceInfo, 1])));
  const nonce = nonceFull.slice(0, 12);

  // Encrypt with AES-GCM
  const encKey = await crypto.subtle.importKey("raw", cek, { name: "AES-GCM" }, false, ["encrypt"]);
  const padded = new Uint8Array([0, 0, ...new TextEncoder().encode(payload)]);
  const encrypted = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, encKey, padded)
  );

  return { encrypted, salt, localPublicKey: localPublicKeyRaw };
}

async function sendPush(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: string,
  vapidPublicKey: string,
  vapidPrivateKey: string
): Promise<boolean> {
  try {
    const jwt = await generateJwt(subscription.endpoint, vapidPrivateKey, vapidPublicKey);
    const { encrypted, salt, localPublicKey } = await encryptPayload(
      subscription.p256dh,
      subscription.auth,
      payload
    );

    const response = await fetch(subscription.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Encoding": "aesgcm",
        "Encryption": `salt=${uint8ArrayToBase64Url(salt)}`,
        "Crypto-Key": `dh=${uint8ArrayToBase64Url(localPublicKey)};p256ecdsa=${vapidPublicKey}`,
        Authorization: `WebPush ${jwt}`,
        TTL: "86400",
      },
      body: encrypted,
    });

    if (!response.ok) {
      console.error(`Push failed: ${response.status} ${await response.text()}`);
      return false;
    }
    return true;
  } catch (e) {
    console.error("Push send error:", e);
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY")!;
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { action, title, body, imei } = await req.json();

    if (action === "send-announcement") {
      // Send push to ALL subscribers
      const { data: subs } = await supabase
        .from("push_subscriptions")
        .select("*");

      let sent = 0;
      const payload = JSON.stringify({ title, body, type: "announcement" });

      for (const sub of subs || []) {
        const ok = await sendPush(sub, payload, vapidPublicKey, vapidPrivateKey);
        if (ok) sent++;
      }

      return new Response(JSON.stringify({ sent, total: subs?.length || 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "warranty-expiring") {
      // Find customers with warranty expiring in <=30 days
      const { data: customers } = await supabase
        .from("customers")
        .select("imei, name, warranty_end");

      const now = new Date();
      let sent = 0;
      let total = 0;

      for (const c of customers || []) {
        const end = new Date(c.warranty_end);
        const daysLeft = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (daysLeft > 0 && daysLeft <= 30) {
          // Get subscriptions for this IMEI
          const { data: subs } = await supabase
            .from("push_subscriptions")
            .select("*")
            .eq("imei", c.imei);

          const payload = JSON.stringify({
            title: "⚠️ ประกันใกล้หมดอายุ",
            body: `สวัสดีคุณ ${c.name} ประกันของคุณจะหมดอายุในอีก ${daysLeft} วัน`,
            type: "warranty-expiring",
          });

          for (const sub of subs || []) {
            total++;
            const ok = await sendPush(sub, payload, vapidPublicKey, vapidPrivateKey);
            if (ok) sent++;
          }
        }
      }

      return new Response(JSON.stringify({ sent, total }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "send-to-imei" && imei) {
      const { data: subs } = await supabase
        .from("push_subscriptions")
        .select("*")
        .eq("imei", imei);

      const payload = JSON.stringify({ title, body, type: "direct" });
      let sent = 0;

      for (const sub of subs || []) {
        const ok = await sendPush(sub, payload, vapidPublicKey, vapidPrivateKey);
        if (ok) sent++;
      }

      return new Response(JSON.stringify({ sent, total: subs?.length || 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
