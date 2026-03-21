import { Injectable, Logger } from "@nestjs/common";
import twilio, { Twilio } from "twilio";

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);
  private client: Twilio | null = null;
  private disabled = false;

  constructor() {
    const accountSid = (process.env.TWILIO_ACCOUNT_SID || "").trim();
    const authToken = (process.env.TWILIO_AUTH_TOKEN || "").trim();

    if (!accountSid || !authToken) {
      this.logger.warn("Twilio NOT configured — TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN missing. Messaging disabled.");
      this.disabled = true;
      return;
    }

    if (!accountSid.startsWith("AC")) {
      this.logger.error(`TWILIO_ACCOUNT_SID must start with "AC". Got "${accountSid.substring(0, 4)}...". Messaging DISABLED.`);
      this.disabled = true;
      return;
    }

    this.client = twilio(accountSid, authToken);

    // Debug: print the raw TWILIO_PHONE value so Railway logs confirm the right env var is loaded
    const twilioPhone = (process.env.TWILIO_PHONE || "").trim();
    const resolvedSender = twilioPhone
      ? (twilioPhone.startsWith("whatsapp:") ? twilioPhone : `whatsapp:${twilioPhone}`)
      : "(NOT SET — OTP sending will fail)";
    console.log("Using TWILIO_PHONE:", twilioPhone || "(NOT SET)");
    this.logger.log(`Twilio client initialized | OTP sender: ${resolvedSender}`);
  }

  private normalizeToE164(phone: string): string | null {
    if (!phone) return null;
    let cleaned = phone.replace(/\D/g, "");
    if (cleaned.startsWith("0")) cleaned = cleaned.substring(1);
    if (cleaned.startsWith("91") && cleaned.length === 12) return `+${cleaned}`;
    if (cleaned.length === 10) return `+91${cleaned}`;
    if (cleaned.length > 10) return `+${cleaned}`;
    return null;
  }

  /**
   * Send OTP via WhatsApp using approved template.
   *
   * Template name : otp_login
   * Template body : Your Asha Kuteer login OTP is {{1}}. It is valid for 5 minutes.
   *
   * from : whatsapp:+919700711700  (TWILIO_PHONE — must be set in environment)
   * to   : whatsapp:+91XXXXXXXXXX
   *
   * NO sandbox fallback. If TWILIO_PHONE is not set, the send is aborted.
   */
  async sendOtpTemplate(to: string, otp: string): Promise<boolean> {
    if (!this.client || this.disabled) {
      this.logger.warn(`[OTP-WA][NO-CLIENT] OTP for ${to}: ${otp}`);
      return false;
    }

    const rawPhone = (process.env.TWILIO_PHONE || "").trim();

    // Debug log every time — visible in Railway logs
    console.log("Using TWILIO_PHONE:", rawPhone || "(NOT SET)");

    if (!rawPhone) {
      this.logger.error(`[OTP-WA] TWILIO_PHONE is not set — cannot send OTP. Set TWILIO_PHONE=+919700711700 in Railway environment variables.`);
      return false;
    }

    const fromPhone = rawPhone.startsWith("whatsapp:")
      ? rawPhone
      : `whatsapp:${rawPhone}`;

    const e164 = this.normalizeToE164(to);
    if (!e164) {
      this.logger.warn(`[OTP-WA] Invalid phone number: ${to}. OTP: ${otp}`);
      return false;
    }

    // Template body with {{1}} substituted
    const body = `Your Asha Kuteer login OTP is ${otp}. It is valid for 5 minutes.`;

    try {
      const params: Record<string, any> = {
        body,
        from: fromPhone,             // whatsapp:+919700711700
        to: `whatsapp:${e164}`,      // whatsapp:+91XXXXXXXXXX
      };

      // If a Content API template SID is configured, use it instead of body text
      const contentSid = (process.env.TWILIO_OTP_CONTENT_SID || "").trim();
      if (contentSid.startsWith("HX")) {
        delete params.body;
        params.contentSid = contentSid;
        params.contentVariables = JSON.stringify({ "1": otp });
        this.logger.log(`[OTP-WA] Using Content SID: ${contentSid.substring(0, 8)}...`);
      }

      this.logger.log(`[OTP-WA] Sending from ${fromPhone} → ${`whatsapp:${e164}`}`);
      const result = await this.client.messages.create(params as any);
      this.logger.log(`[OTP-WA] Sent to ${e164} | SID: ${result.sid}`);
      return true;
    } catch (error: any) {
      this.logger.error(`[OTP-WA] FAILED to ${e164} | Code: ${error?.code} | ${error?.message}`);
      this.logger.warn(`[OTP-WA][FALLBACK] OTP for ${e164}: ${otp}`);
      return false;
    }
  }

  /**
   * Send a freeform WhatsApp message (for non-OTP use cases).
   * Only works within the 24-hour customer service window.
   *
   * from : whatsapp: + TWILIO_WHATSAPP_NUMBER  (must be set — NO sandbox fallback)
   * to   : whatsapp:+91XXXXXXXXXX
   */
  async sendWhatsApp(to: string, message: string): Promise<boolean> {
    if (!this.client || this.disabled) {
      this.logger.warn(`[WhatsApp] Client not available — message for ${to}: ${message}`);
      return false;
    }

    const rawWa = (process.env.TWILIO_WHATSAPP_NUMBER || "").replace(/\s+/g, "").trim();
    if (!rawWa) {
      this.logger.error(`[WhatsApp] TWILIO_WHATSAPP_NUMBER is not set — refusing to send freeform message. No sandbox fallback.`);
      return false;
    }

    const waFrom = rawWa.startsWith("whatsapp:") ? rawWa : `whatsapp:${rawWa}`;

    const e164 = this.normalizeToE164(to);
    if (!e164) {
      this.logger.warn(`[WhatsApp] Invalid phone number: ${to}`);
      return false;
    }

    try {
      const response = await this.client.messages.create({
        body: message,
        from: waFrom,
        to: `whatsapp:${e164}`,
      });
      this.logger.log(`[WhatsApp] Sent to ${e164} | SID: ${response.sid}`);
      return true;
    } catch (error: any) {
      this.logger.error(`[WhatsApp] FAILED to ${e164} | Code: ${error?.code} | ${error?.message}`);
      return false;
    }
  }
}
