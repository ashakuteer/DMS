import { Injectable, Logger } from "@nestjs/common";
import twilio, { Twilio } from "twilio";

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);
  private client: Twilio | null = null;
  private fromNumber: string = "";
  private disabled = false;

  constructor() {
    const accountSid = (process.env.TWILIO_ACCOUNT_SID || "").trim();
    const authToken = (process.env.TWILIO_AUTH_TOKEN || "").trim();
    this.fromNumber = (process.env.TWILIO_WHATSAPP_NUMBER || "").replace(/\s+/g, "").trim();

    if (!accountSid || !authToken) {
      this.logger.warn("Twilio WhatsApp NOT configured — missing TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN");
      return;
    }

    if (!accountSid.startsWith("AC")) {
      this.logger.error(
        `TWILIO_ACCOUNT_SID must start with "AC" but got "${accountSid.substring(0, 6)}...". WhatsApp sending DISABLED.`,
      );
      this.disabled = true;
      return;
    }

    if (!this.fromNumber) {
      this.logger.warn("TWILIO_WHATSAPP_NUMBER not set. WhatsApp sending DISABLED.");
      this.disabled = true;
      return;
    }

    if (!this.fromNumber.startsWith("whatsapp:+")) {
      this.logger.error(
        `TWILIO_WHATSAPP_NUMBER must start with "whatsapp:+" but got "${this.fromNumber.substring(0, 15)}...". WhatsApp sending DISABLED.`,
      );
      this.disabled = true;
      return;
    }

    this.client = twilio(accountSid, authToken);
    this.logger.log(`Twilio WhatsApp initialized (from: ${this.fromNumber})`);
  }

  private formatPhoneNumber(phone: string): string | null {
    if (!phone) return null;

    let cleaned = phone.replace(/\D/g, "");

    if (cleaned.startsWith("0")) {
      cleaned = cleaned.substring(1);
    }

    if (cleaned.startsWith("91") && cleaned.length === 12) {
      return `+${cleaned}`;
    }

    if (cleaned.length === 10) {
      return `+91${cleaned}`;
    }

    return null;
  }

  async sendWhatsApp(to: string, message: string): Promise<boolean> {
    if (!this.client || this.disabled) {
      this.logger.warn("WhatsApp client not initialized or disabled");
      return false;
    }

    const formattedNumber = this.formatPhoneNumber(to);

    if (!formattedNumber) {
      this.logger.warn(`Invalid phone number format: ${to}`);
      return false;
    }

    try {
      const response = await this.client.messages.create({
        body: message,
        from: this.fromNumber,
        to: `whatsapp:${formattedNumber}`,
      });

      this.logger.log(
        `WhatsApp sent to ${formattedNumber} | SID: ${response.sid} | Status: ${response.status}`,
      );

      return true;
    } catch (error: any) {
      const errorCode = error?.code?.toString() || "UNKNOWN";
      const errorMessage = error?.message || "Unknown error";
      this.logger.error(
        `WhatsApp send FAILED to ${formattedNumber} | Code: ${errorCode} | Message: ${errorMessage}`,
      );
      return false;
    }
  }
}
