/**
 * Nagad Payment Gateway — Sandbox / Production plug-in
 *
 * Env:
 *   NAGAD_MERCHANT_ID
 *   NAGAD_MERCHANT_PRIVATE_KEY  (PEM string or path — production)
 *   NAGAD_PG_PUBLIC_KEY
 *   NAGAD_BASE_URL=http://sandbox.mynagad.com:10080/remote-payment-gateway-1.0/api/dfs
 *   NAGAD_BASE_URL=https://api.mynagad.com/api/dfs  (live)
 *
 * Typical DFS flow:
 *   1. Initialize payment (merchant → Nagad)
 *   2. User completes on Nagad UI
 *   3. Callback / verify
 *
 * Without credentials, mock mode returns local callback URLs for demo.
 */

export type NagadInitResult = {
  paymentRefId: string;
  callBackUrl: string;
  status?: string;
  message?: string;
};

export type NagadVerifyResult = {
  paymentRefId: string;
  orderId: string;
  amount: string;
  status: "Success" | "Failed" | "Aborted" | "Pending";
  issuerPaymentRefNo?: string;
};

function config() {
  return {
    baseUrl:
      process.env.NAGAD_BASE_URL ||
      "http://sandbox.mynagad.com:10080/remote-payment-gateway-1.0/api/dfs",
    merchantId: process.env.NAGAD_MERCHANT_ID || "",
    privateKey: process.env.NAGAD_MERCHANT_PRIVATE_KEY || "",
    pgPublicKey: process.env.NAGAD_PG_PUBLIC_KEY || "",
  };
}

export function isNagadConfigured(): boolean {
  const c = config();
  return Boolean(c.merchantId && c.privateKey);
}

export function isNagadMock(): boolean {
  return !isNagadConfigured();
}

/**
 * Initialize a Nagad payment.
 * Production: sign sensitiveData with merchant private key (RSA).
 * Mock: returns callback to our app.
 */
export async function initNagadPayment(params: {
  orderId: string;
  amount: number;
  callbackURL: string;
  clientIP?: string;
}): Promise<NagadInitResult> {
  if (!isNagadConfigured()) {
    const paymentRefId = `NAGAD-MOCK-${params.orderId}-${Date.now()}`;
    return {
      paymentRefId,
      callBackUrl: `${params.callbackURL}?paymentRefId=${paymentRefId}&orderId=${encodeURIComponent(params.orderId)}&status=Success&mock=1`,
      status: "Success",
      message: "Mock Nagad — credentials not set",
    };
  }

  const c = config();
  const dateTime = new Date().toISOString().replace(/\.\d{3}Z$/, "");
  // Sensitive payload would be encrypted with Nagad PG public key in production
  const sensitiveData = {
    merchantId: c.merchantId,
    datetime: dateTime,
    orderId: params.orderId,
    challenge: cryptoRandom(20),
  };

  // Placeholder HTTP call — replace signature helper when live keys available
  const res = await fetch(`${c.baseUrl}/check-out/initialize/${c.merchantId}/${params.orderId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-KM-Api-Version": "v-0.2.0",
      "X-KM-IP-V4": params.clientIP || "127.0.0.1",
      "X-KM-Client-Type": "PC_WEB",
    },
    body: JSON.stringify({
      dateTime,
      sensitiveData: JSON.stringify(sensitiveData),
      signature: "SIGN_WITH_MERCHANT_PRIVATE_KEY",
    }),
  });

  if (!res.ok) {
    throw new Error(`Nagad init failed: HTTP ${res.status}`);
  }

  const data = await res.json();
  return {
    paymentRefId: data.paymentReferenceNumber || data.paymentRefId,
    callBackUrl: data.callBackUrl || data.callbackURL,
    status: data.status,
    message: data.message,
  };
}

export async function verifyNagadPayment(
  paymentRefId: string
): Promise<NagadVerifyResult> {
  if (!isNagadConfigured()) {
    const orderId = paymentRefId.includes("NAGAD-MOCK-")
      ? paymentRefId.replace(/^NAGAD-MOCK-/, "").replace(/-\d+$/, "")
      : paymentRefId;
    return {
      paymentRefId,
      orderId,
      amount: "0",
      status: "Success",
      issuerPaymentRefNo: `NTRX${Date.now()}`,
    };
  }

  const c = config();
  const res = await fetch(
    `${c.baseUrl}/verify/payment/${paymentRefId}`,
    { method: "GET", headers: { "Content-Type": "application/json" } }
  );
  if (!res.ok) {
    throw new Error(`Nagad verify failed: HTTP ${res.status}`);
  }
  const data = await res.json();
  return {
    paymentRefId,
    orderId: data.orderId,
    amount: data.amount,
    status: data.statusCode === "Success" ? "Success" : "Failed",
    issuerPaymentRefNo: data.issuerPaymentRefNo,
  };
}

function cryptoRandom(len: number): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let out = "";
  for (let i = 0; i < len; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}
