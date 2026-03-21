import { Injectable, Logger } from "@nestjs/common";
import twilio, { Twilio } from "twilio";

// Twilio WhatsApp Sandbox number — used when TWILIO_WHATSAPP_NUMBER is not set
const TWILIO_WHATSAPP_SANDBOX = "whatsapp:+14155238886";

export type MessageType = "OTP" | "WHATSAPP";

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);
  private client: Twilio | null = null;
  private whatsappFrom: string = "";
  private disabled = false;

  constructor() {
    const accountSid = (process.env.TWILIO_ACCOUNT_SID || "").trim();
    const authToken = (process.env.TWILIO_AUTH_TOKEN || "").trim();
    const rawWhatsappNumber = (process.env.TWILIO_WHATSAPP_NUMBER || "").replace(/\s+/g, "").trim();

    if (!accountSid || !authToken) {
      this.logger.warn("Twilio NOT configured — missing TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN. All messaging disabled.");
      this.disabled = true;
      return;
    }

    if (!accountSid.startsWith("AC")) {
      this.logger.error(`TWILIO_ACCOUNT_SID must start with "AC". Got "${accountSid.substring(0, 4)}...". Messaging DISABLED.`);
      this.disabled = true;
      return;
    }

    this.client = twilio(accountSid, authToken);

    // WhatsApp from: use configured number or fall back to Twilio Sandbox
    if (rawWhatsappNumber) {
      // Accept either plain E.164 (+14155238886) or whatsapp:+... format
      this.whatsappFrom = rawWhatsappNumber.startsWith("whatsapp:")
        ? rawWhatsappNumber
        : `whatsapp:${rawWhatsappNumber}`;
      this.logger.log(`WhatsApp from: ${this.whatsappFrom} (TWILIO_WHATSAPP_NUMBER)`);
    } else {
      this.whatsappFrom = TWILIO_WHATSAPP_SANDBOX;
      this.logger.warn(`TWILIO_WHATSAPP_NUMBER not set — using Twilio Sandbox (${TWILIO_WHATSAPP_SANDBOX}). Recipient must opt-in at https://wa.me/14155238886 first.`);
    }
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
   * Send a WhatsApp message.
   * from: whatsapp:<number>  to: whatsapp:<E.164>
   */
  async sendWhatsApp(to: string, message: string): Promise<boolean> {
    if (!this.client || this.disabled) {
      this.logger.warn(`[WhatsApp] Client not available — logging message for ${to}: ${message}`);
      return false;
    }

    const e164 = this.normalizeToE164(to);
    if (!e164) {
      this.logger.warn(`[WhatsApp] Invalid phone number: ${to}`);
      return false;
    }

    try {
      const response = await this.client.messages.create({
        body: message,
        from: this.whatsappFrom,        // whatsapp:+14155238886
        to: `whatsapp:${e164}`,         // whatsapp:+91XXXXXXXXXX
      });
      this.logger.log(`[WhatsApp] Sent to ${e164} | SID: ${response.sid}`);
      return true;
    } catch (error: any) {
      this.logger.error(`[WhatsApp] FAILED to ${e164} | Code: ${error?.code} | ${error?.message}`);
      return false;
    }
  }

  /**
   * Send an SMS message (for OTP and text-only use cases).
   * from: TWILIO_PHONE (plain E.164)   to: plain E.164
   */
  async sendSms(to: string, message: string): Promise<boolean> {
    if (!this.client || this.disabled) {
      this.logger.warn(`[SMS] Client not available — logging message for ${to}: ${message}`);
      return false;
    }

    const smsFrom = (process.env.TWILIO_PHONE || "").trim();
    if (!smsFrom) {
      this.logger.warn(`[SMS] TWILIO_PHONE not set — cannot send SMS to ${to}`);
      return false;
    }

    const e164 = this.normalizeToE164(to);
    if (!e164) {
      this.logger.warn(`[SMS] Invalid phone number: ${to}`);
      return false;
    }

    try {
      const response = await this.client.messages.create({
        body: message,
        from: smsFrom,   // plain E.164 e.g. +1415XXXXXXX
        to: e164,        // plain E.164 e.g. +91XXXXXXXXXX
      });
      this.logger.log(`[SMS] Sent to ${e164} | SID: ${response.sid}`);
      return true;
    } catch (error: any) {
      this.logger.error(`[SMS] FAILED to ${e164} | Code: ${error?.code} | ${error?.message}`);
      return false;
    }
  }
}
