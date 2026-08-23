/**
 * SMS Provider plug-in layer.
 * Production: set SMS_PROVIDER=sslwireless|twilio and API keys in env.
 * Default: console (logs message, marks SENT in MessageLog).
 */

export type SmsPayload = {
  to: string;
  body: string;
  senderId?: string;
};

export type SmsResult = {
  success: boolean;
  providerMessageId?: string;
  error?: string;
};

export interface SmsProvider {
  name: string;
  send(payload: SmsPayload): Promise<SmsResult>;
}

/** Dev / fallback — no external network */
class ConsoleSmsProvider implements SmsProvider {
  name = "console";
  async send(payload: SmsPayload): Promise<SmsResult> {
    console.log(`[SMS:${this.name}] → ${payload.to}: ${payload.body.slice(0, 120)}`);
    return { success: true, providerMessageId: `console-${Date.now()}` };
  }
}

/** SSL Wireless-style HTTP API (Bangladesh) — configure via env */
class HttpSmsProvider implements SmsProvider {
  name: string;
  constructor(
    name: string,
    private endpoint: string,
    private apiKey: string,
    private senderId: string
  ) {
    this.name = name;
  }

  async send(payload: SmsPayload): Promise<SmsResult> {
    try {
      const url = new URL(this.endpoint);
      url.searchParams.set("api_key", this.apiKey);
      url.searchParams.set("senderid", payload.senderId || this.senderId);
      url.searchParams.set("number", payload.to);
      url.searchParams.set("message", payload.body);

      const res = await fetch(url.toString(), { method: "GET" });
      if (!res.ok) {
        return { success: false, error: `HTTP ${res.status}` };
      }
      const text = await res.text();
      return { success: true, providerMessageId: text.slice(0, 64) };
    } catch (e) {
      return {
        success: false,
        error: e instanceof Error ? e.message : "SMS send failed",
      };
    }
  }
}

export function getSmsProvider(): SmsProvider {
  const provider = (process.env.SMS_PROVIDER || "console").toLowerCase();
  const apiKey = process.env.SMS_API_KEY || "";
  const senderId = process.env.SMS_SENDER_ID || "EDUPRO";
  const endpoint =
    process.env.SMS_API_ENDPOINT ||
    "https://sms.example.com/api/v3/send-sms";

  if (provider === "sslwireless" || provider === "http") {
    if (!apiKey) {
      console.warn("[SMS] API key missing — falling back to console");
      return new ConsoleSmsProvider();
    }
    return new HttpSmsProvider(provider, endpoint, apiKey, senderId);
  }

  return new ConsoleSmsProvider();
}

/** Send and return provider result */
export async function sendSms(to: string, body: string): Promise<SmsResult> {
  const provider = getSmsProvider();
  return provider.send({ to, body, senderId: process.env.SMS_SENDER_ID });
}
