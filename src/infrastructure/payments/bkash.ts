/**
 * bKash Tokenized Checkout — Sandbox / Production plug-in
 *
 * Env:
 *   BKASH_APP_KEY, BKASH_APP_SECRET, BKASH_USERNAME, BKASH_PASSWORD
 *   BKASH_BASE_URL=https://tokenized.sandbox.bka.sh/v1.2.0-beta  (sandbox)
 *   BKASH_BASE_URL=https://tokenized.pay.bka.sh/v1.2.0-beta       (live)
 *
 * Flow (Tokenized Checkout):
 *   1. grantToken()
 *   2. createPayment({ amount, invoiceNumber, callbackURL })
 *   3. User redirected to bKash → callback
 *   4. executePayment(paymentID)
 *   5. Record in financeRepository.recordPayment
 */

export type BkashToken = {
  id_token: string;
  expires_in: string;
  refresh_token?: string;
};

export type BkashCreatePaymentResult = {
  paymentID: string;
  bkashURL: string;
  statusCode?: string;
  statusMessage?: string;
};

export type BkashExecuteResult = {
  paymentID: string;
  trxID: string;
  transactionStatus: string;
  amount: string;
  customerMsisdn?: string;
  statusCode?: string;
  statusMessage?: string;
};

function config() {
  return {
    baseUrl:
      process.env.BKASH_BASE_URL ||
      "https://tokenized.sandbox.bka.sh/v1.2.0-beta",
    appKey: process.env.BKASH_APP_KEY || "",
    appSecret: process.env.BKASH_APP_SECRET || "",
    username: process.env.BKASH_USERNAME || "",
    password: process.env.BKASH_PASSWORD || "",
  };
}

export function isBkashConfigured(): boolean {
  const c = config();
  return Boolean(c.appKey && c.appSecret && c.username && c.password);
}

/** Sandbox mode when credentials missing — returns mock IDs for local demo */
export function isBkashSandboxMock(): boolean {
  return !isBkashConfigured();
}

export async function grantToken(): Promise<BkashToken> {
  const c = config();
  if (!isBkashConfigured()) {
    return {
      id_token: `mock-token-${Date.now()}`,
      expires_in: "3600",
    };
  }

  const res = await fetch(`${c.baseUrl}/tokenized/checkout/token/grant`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      username: c.username,
      password: c.password,
    },
    body: JSON.stringify({
      app_key: c.appKey,
      app_secret: c.appSecret,
    }),
  });

  if (!res.ok) {
    throw new Error(`bKash grantToken failed: HTTP ${res.status}`);
  }
  return res.json();
}

export async function createPayment(params: {
  amount: number;
  invoiceNumber: string;
  callbackURL: string;
  intent?: "sale";
}): Promise<BkashCreatePaymentResult> {
  if (!isBkashConfigured()) {
    const paymentID = `MOCK-${params.invoiceNumber}-${Date.now()}`;
    return {
      paymentID,
      bkashURL: `${params.callbackURL}?paymentID=${paymentID}&status=success&mock=1`,
      statusCode: "0000",
      statusMessage: "Mock sandbox — credentials not set",
    };
  }

  const token = await grantToken();
  const c = config();

  const res = await fetch(`${c.baseUrl}/tokenized/checkout/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: token.id_token,
      "X-APP-Key": c.appKey,
    },
    body: JSON.stringify({
      mode: "0011",
      payerReference: " ",
      callbackURL: params.callbackURL,
      amount: String(params.amount),
      currency: "BDT",
      intent: params.intent ?? "sale",
      merchantInvoiceNumber: params.invoiceNumber,
    }),
  });

  if (!res.ok) {
    throw new Error(`bKash createPayment failed: HTTP ${res.status}`);
  }
  return res.json();
}

export async function executePayment(
  paymentID: string
): Promise<BkashExecuteResult> {
  if (!isBkashConfigured()) {
    return {
      paymentID,
      trxID: `MOCKTRX${Date.now()}`,
      transactionStatus: "Completed",
      amount: "0",
      statusCode: "0000",
      statusMessage: "Mock execute",
    };
  }

  const token = await grantToken();
  const c = config();

  const res = await fetch(`${c.baseUrl}/tokenized/checkout/execute`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: token.id_token,
      "X-APP-Key": c.appKey,
    },
    body: JSON.stringify({ paymentID }),
  });

  if (!res.ok) {
    throw new Error(`bKash executePayment failed: HTTP ${res.status}`);
  }
  return res.json();
}
