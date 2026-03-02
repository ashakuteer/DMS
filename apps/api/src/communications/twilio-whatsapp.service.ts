import { Injectable, Logger } from "@nestjs/common";
import twilio, { Twilio } from "twilio";

export type WhatsAppTemplateKey =
  | "DONATION_THANK_YOU"
  | "PLEDGE_DUE"
  | "SPECIAL_DAY_WISH"
  | "FOLLOWUP_REMINDER";

export interface SendTemplateResult {
  success: boolean;
  messageSid?: string;
  status?: string;
  errorCode?: string;
  errorMessage?: string;
}

@Injectable()
export class TwilioWhatsAppService {
  private readonly logger = new Logger(TwilioWhatsAppService.name);
  private client: Twilio | null = null;
  private fromNumber: string = "";
  private messagingServiceSid: string = "";
  private statusCallbackUrl: string;
  private disabled = false;
  private disableReason = "";
  private templateMap: Record<WhatsAppTemplateKey, string | null> = {
    DONATION_THANK_YOU: null,
    PLEDGE_DUE: null,
    SPECIAL_DAY_WISH: null,
    FOLLOWUP_REMINDER: null,
  };

  constructor() {
    const accountSid = (process.env.TWILIO_ACCOUNT_SID || "").trim();
    const authToken = (process.env.TWILIO_AUTH_TOKEN || "").trim();
    const rawMsgSid = (process.env.TWILIO_MESSAGING_SERVICE_SID || "").trim();
    const rawFrom = (process.env.TWILIO_WHATSAPP_NUMBER || "").replace(/\s+/g, "").trim();
    this.statusCallbackUrl = process.env.TWILIO_STATUS_WEBHOOK_URL || "";

    if (!accountSid || !authToken) {
      this.logger.warn(
        "Twilio WhatsApp NOT configured — missing TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN",
      );
      return;
    }

    if (!accountSid.startsWith("AC")) {
      this.logger.error(
        `TWILIO_ACCOUNT_SID must start with "AC" but got "${accountSid.substring(0, 6)}...". WhatsApp sending DISABLED. Please fix in Secrets.`,
      );
      this.disabled = true;
      this.disableReason = `TWILIO_ACCOUNT_SID invalid (starts with "${accountSid.substring(0, 2)}", expected "AC")`;
      return;
    }

    if (rawFrom && !rawFrom.startsWith("whatsapp:+")) {
      this.logger.error(
        `TWILIO_WHATSAPP_NUMBER must start with "whatsapp:+" but got "${rawFrom.substring(0, 15)}...". WhatsApp sending DISABLED.`,
      );
      this.disabled = true;
      this.disableReason = `TWILIO_WHATSAPP_NUMBER invalid (expected "whatsapp:+..." format)`;
      return;
    }

    if (rawMsgSid && !rawMsgSid.startsWith("MG")) {
      this.logger.error(
        `TWILIO_MESSAGING_SERVICE_SID must start with "MG" but got "${rawMsgSid.substring(0, 12)}...". Ignoring this SID — will use from number instead.`,
      );
    } else if (rawMsgSid.startsWith("MG")) {
      this.messagingServiceSid = rawMsgSid;
      this.logger.log(`Messaging Service SID: ${rawMsgSid.substring(0, 6)}...`);
    }

    if (rawFrom.startsWith("whatsapp:+")) {
      this.fromNumber = rawFrom;
      this.logger.log(`WhatsApp from number: ${rawFrom}`);
    }

    if (!this.fromNumber && !this.messagingServiceSid) {
      this.logger.error(
        "Neither a valid TWILIO_WHATSAPP_NUMBER nor TWILIO_MESSAGING_SERVICE_SID is configured. WhatsApp sending DISABLED.",
      );
      this.disabled = true;
      this.disableReason = "No valid from number or messaging service SID";
      return;
    }

    this.client = twilio(accountSid, authToken);
    
    // Log which mode will be used
    if (this.messagingServiceSid) {
      this.logger.log(
        `Twilio WhatsApp Content API initialized - Using Messaging Service SID mode (msgSvcSid: ${this.messagingServiceSid.substring(0, 6)}...)`,
      );
    } else if (this.fromNumber) {
      this.logger.log(
        `Twilio WhatsApp Content API initialized - Using From Number mode (from: ${this.fromNumber})`,
      );
    }

    this.initTemplateMap();
  }

  private initTemplateMap(): void {
    const envMapping: Record<WhatsAppTemplateKey, string> = {
      DONATION_THANK_YOU: "TWILIO_DONATION_THANK_YOU_CONTENT_SID",
      PLEDGE_DUE: "TWILIO_DONATION_REMINDER_CONTENT_SID",
      SPECIAL_DAY_WISH: "TWILIO_OCCASION_WISH_CONTENT_SID",
      FOLLOWUP_REMINDER: "TWILIO_DONATION_REMINDER_CONTENT_SID",
    };

    for (const [key, envVar] of Object.entries(envMapping)) {
      const sid = (process.env[envVar] || "").trim();
      if (!sid) {
        this.logger.warn(`${envVar} is missing (template key: ${key})`);
        this.templateMap[key as WhatsAppTemplateKey] = null;
      } else if (!sid.startsWith("HX")) {
        this.logger.warn(
          `${envVar} is invalid (does not start with "HX"): ${sid.substring(0, 12)}... (template key: ${key})`,
        );
        this.templateMap[key as WhatsAppTemplateKey] = null;
      } else {
        this.templateMap[key as WhatsAppTemplateKey] = sid;
        this.logger.log(`Template ${key} -> ${sid.substring(0, 8)}...`);
      }
    }
  }

  getContentSidForKey(templateKey: WhatsAppTemplateKey): string | null {
    return this.templateMap[templateKey] || null;
  }

  isTemplateConfigured(templateKey: WhatsAppTemplateKey): boolean {
    return !!this.templateMap[templateKey];
  }

  getConfiguredTemplates(): Record<WhatsAppTemplateKey, boolean> {
    return {
      DONATION_THANK_YOU: !!this.templateMap.DONATION_THANK_YOU,
      PLEDGE_DUE: !!this.templateMap.PLEDGE_DUE,
      SPECIAL_DAY_WISH: !!this.templateMap.SPECIAL_DAY_WISH,
      FOLLOWUP_REMINDER: !!this.templateMap.FOLLOWUP_REMINDER,
    };
  }

  isConfigured(): boolean {
    return this.client !== null && !this.disabled;
  }

  getDisableReason(): string {
    return this.disableReason;
  }

  async sendTemplate(
    toE164: string,
    contentSid: string,
    contentVariables?: Record<string, string>,
  ): Promise<SendTemplateResult> {
    if (!this.client || this.disabled) {
      return {
        success: false,
        errorCode: "NOT_CONFIGURED",
        errorMessage: this.disableReason || "Twilio client is not configured",
      };
    }

    try {
      const params: Record<string, any> = {
        contentSid,
        to: `whatsapp:${toE164}`,
      };

      if (this.fromNumber) {
        params.from = this.fromNumber;
      } else if (this.messagingServiceSid) {
        params.messagingServiceSid = this.messagingServiceSid;
      }

      if (contentVariables && Object.keys(contentVariables).length > 0) {
        params.contentVariables = JSON.stringify(contentVariables);
      }

      if (this.statusCallbackUrl) {
        params.statusCallback = this.statusCallbackUrl;
      }

      this.logger.log(
        `Sending WhatsApp template to ${toE164} | contentSid: ${contentSid} | from: ${params.from || "N/A"} | msgSvcSid: ${params.messagingServiceSid ? params.messagingServiceSid.substring(0, 6) + "..." : "N/A"}`,
      );

      const message = await this.client.messages.create(params as any);

      this.logger.log(
        `WhatsApp template sent to ${toE164} | SID: ${message.sid} | Status: ${message.status}`,
      );

      return { success: true, messageSid: message.sid, status: message.status };
    } catch (error: any) {
      const errorCode = error?.code?.toString() || "UNKNOWN";
      const errorMessage = error?.message || "Unknown Twilio error";
      const moreInfo = error?.moreInfo || "";
      this.logger.error(
        `WhatsApp template FAILED to ${toE164} | Code: ${errorCode} | Message: ${errorMessage}${moreInfo ? ` | Info: ${moreInfo}` : ""}`,
      );
      return { success: false, errorCode, errorMessage };
    }
  }
}
