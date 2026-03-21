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
    this.logger.log("Twilio client initialized");
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
   * from : whatsapp:+919700711700  (TWILIO_PHONE with whatsapp: prefix)
   * to   : whatsapp:+91XXXXXXXXXX
   */
  async sendOtpTemplate(to: string, otp: string): Promise<boolean> {
    const rawPhone = (process.env.TWILIO_PHONE || "").trim();
    const fromPhone = rawPhone.startsWith("+")
      ? `whatsapp:${rawPhone}`
      : rawPhone.startsWith("whatsapp:")
        ? rawPhone
        : null;

    if (!this.client || this.disabled) {
      this.logger.warn(`[OTP-WA][NO-CLIENT] OTP for ${to}: ${otp}`);
      return false;
    }

    if (!fromPhone) {
      this.logger.warn(`[OTP-WA] TWILIO_PHONE not set or invalid — cannot send. OTP for ${to}: ${otp}`);
      return false;
    }

    const e164 = this.normalizeToE164(to);
    if (!e164) {
      this.logger.warn(`[OTP-WA] Invalid phone number: ${to}. OTP: ${otp}`);
      return false;
    }

    // Template body with {{1}} replaced by OTP
    const body = `Your Asha Kuteer login OTP is ${otp}. It is valid for 5 minutes.`;

    try {
      const params: Record<string, any> = {
        body,
        from: fromPhone,              // whatsapp:+919700711700
        to: `whatsapp:${e164}`,       // whatsapp:+91XXXXXXXXXX
      };

      // If a Content API template SID is configured, prefer that over body text
      const contentSid = (process.env.TWILIO_OTP_CONTENT_SID || "").trim();
      if (contentSid.startsWith("HX")) {
        delete params.body;
        params.contentSid = contentSid;
        params.contentVariables = JSON.stringify({ "1": otp });
        this.logger.log(`[OTP-WA] Using Content SID: ${contentSid.substring(0, 8)}...`);
      }

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
   * from : whatsapp: + TWILIO_WHATSAPP_NUMBER (or sandbox)
   * to   : whatsapp:+91XXXXXXXXXX
   */
  async sendWhatsApp(to: string, message: string): Promise<boolean> {
    if (!this.client || this.disabled) {
      this.logger.warn(`[WhatsApp] Client not available — message for ${to}: ${message}`);
      return false;
    }

    const rawWa = (process.env.TWILIO_WHATSAPP_NUMBER || "").replace(/\s+/g, "").trim();
    const waFrom = rawWa
      ? (rawWa.startsWith("whatsapp:") ? rawWa : `whatsapp:${rawWa}`)
      : "whatsapp:+14155238886"; // Twilio Sandbox fallback

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
