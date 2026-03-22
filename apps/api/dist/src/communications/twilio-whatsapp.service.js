"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var TwilioWhatsAppService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TwilioWhatsAppService = void 0;
const common_1 = require("@nestjs/common");
const twilio_1 = __importDefault(require("twilio"));
let TwilioWhatsAppService = TwilioWhatsAppService_1 = class TwilioWhatsAppService {
    constructor() {
        this.logger = new common_1.Logger(TwilioWhatsAppService_1.name);
        this.client = null;
        this.fromNumber = "";
        this.messagingServiceSid = "";
        this.disabled = false;
        this.disableReason = "";
        this.templateMap = {
            DONATION_THANK_YOU: null,
            PLEDGE_DUE: null,
            SPECIAL_DAY_WISH: null,
            FOLLOWUP_REMINDER: null,
        };
        const accountSid = (process.env.TWILIO_ACCOUNT_SID || "").trim();
        const authToken = (process.env.TWILIO_AUTH_TOKEN || "").trim();
        const rawMsgSid = (process.env.TWILIO_MESSAGING_SERVICE_SID || "").trim();
        const rawFrom = (process.env.TWILIO_WHATSAPP_NUMBER || "").replace(/\s+/g, "").trim();
        this.statusCallbackUrl = process.env.TWILIO_STATUS_WEBHOOK_URL || "";
        if (!accountSid || !authToken) {
            this.logger.warn("Twilio WhatsApp NOT configured — missing TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN");
            return;
        }
        if (!accountSid.startsWith("AC")) {
            this.logger.error(`TWILIO_ACCOUNT_SID must start with "AC" but got "${accountSid.substring(0, 6)}...". WhatsApp sending DISABLED. Please fix in Secrets.`);
            this.disabled = true;
            this.disableReason = `TWILIO_ACCOUNT_SID invalid (starts with "${accountSid.substring(0, 2)}", expected "AC")`;
            return;
        }
        if (rawFrom && !rawFrom.startsWith("whatsapp:+")) {
            if (rawFrom.startsWith("+")) {
                this.logger.warn(`TWILIO_WHATSAPP_NUMBER "${rawFrom}" missing "whatsapp:" prefix — adding it automatically.`);
            }
            else {
                this.logger.error(`TWILIO_WHATSAPP_NUMBER invalid format: "${rawFrom.substring(0, 15)}...". WhatsApp DISABLED.`);
                this.disabled = true;
                this.disableReason = `TWILIO_WHATSAPP_NUMBER invalid (expected "whatsapp:+..." or "+..." format)`;
                return;
            }
        }
        if (rawMsgSid && !rawMsgSid.startsWith("MG")) {
            this.logger.error(`TWILIO_MESSAGING_SERVICE_SID must start with "MG" but got "${rawMsgSid.substring(0, 12)}...". Ignoring this SID — will use from number instead.`);
        }
        else if (rawMsgSid.startsWith("MG")) {
            this.messagingServiceSid = rawMsgSid;
            this.logger.log(`Messaging Service SID: ${rawMsgSid.substring(0, 6)}...`);
        }
        if (rawFrom) {
            this.fromNumber = rawFrom.startsWith("whatsapp:")
                ? rawFrom
                : `whatsapp:${rawFrom}`;
            this.logger.log(`WhatsApp from number: ${this.fromNumber}`);
        }
        if (!this.fromNumber && !this.messagingServiceSid) {
            this.fromNumber = "whatsapp:+14155238886";
            this.logger.warn(`TWILIO_WHATSAPP_NUMBER not set — falling back to Twilio Sandbox (${this.fromNumber}). Recipients must opt-in first.`);
        }
        this.client = (0, twilio_1.default)(accountSid, authToken);
        if (this.messagingServiceSid) {
            this.logger.log(`Twilio WhatsApp Content API initialized - Using Messaging Service SID mode (msgSvcSid: ${this.messagingServiceSid.substring(0, 6)}...)`);
        }
        else if (this.fromNumber) {
            this.logger.log(`Twilio WhatsApp Content API initialized - Using From Number mode (from: ${this.fromNumber})`);
        }
        this.initTemplateMap();
    }
    initTemplateMap() {
        const envMapping = {
            DONATION_THANK_YOU: "TWILIO_DONATION_THANK_YOU_CONTENT_SID",
            PLEDGE_DUE: "TWILIO_DONATION_REMINDER_CONTENT_SID",
            SPECIAL_DAY_WISH: "TWILIO_OCCASION_WISH_CONTENT_SID",
            FOLLOWUP_REMINDER: "TWILIO_DONATION_REMINDER_CONTENT_SID",
        };
        for (const [key, envVar] of Object.entries(envMapping)) {
            const sid = (process.env[envVar] || "").trim();
            if (!sid) {
                this.logger.warn(`${envVar} is missing (template key: ${key})`);
                this.templateMap[key] = null;
            }
            else if (!sid.startsWith("HX")) {
                this.logger.warn(`${envVar} is invalid (does not start with "HX"): ${sid.substring(0, 12)}... (template key: ${key})`);
                this.templateMap[key] = null;
            }
            else {
                this.templateMap[key] = sid;
                this.logger.log(`Template ${key} -> ${sid.substring(0, 8)}...`);
            }
        }
    }
    getContentSidForKey(templateKey) {
        return this.templateMap[templateKey] || null;
    }
    isTemplateConfigured(templateKey) {
        return !!this.templateMap[templateKey];
    }
    getConfiguredTemplates() {
        return {
            DONATION_THANK_YOU: !!this.templateMap.DONATION_THANK_YOU,
            PLEDGE_DUE: !!this.templateMap.PLEDGE_DUE,
            SPECIAL_DAY_WISH: !!this.templateMap.SPECIAL_DAY_WISH,
            FOLLOWUP_REMINDER: !!this.templateMap.FOLLOWUP_REMINDER,
        };
    }
    isConfigured() {
        return this.client !== null && !this.disabled;
    }
    getDisableReason() {
        return this.disableReason;
    }
    async sendTemplate(toE164, contentSid, contentVariables) {
        if (!this.client || this.disabled) {
            return {
                success: false,
                errorCode: "NOT_CONFIGURED",
                errorMessage: this.disableReason || "Twilio client is not configured",
            };
        }
        try {
            const params = {
                contentSid,
                to: `whatsapp:${toE164}`,
            };
            if (this.fromNumber) {
                params.from = this.fromNumber;
            }
            else if (this.messagingServiceSid) {
                params.messagingServiceSid = this.messagingServiceSid;
            }
            if (contentVariables && Object.keys(contentVariables).length > 0) {
                params.contentVariables = JSON.stringify(contentVariables);
            }
            if (this.statusCallbackUrl) {
                params.statusCallback = this.statusCallbackUrl;
            }
            this.logger.log(`Sending WhatsApp template to ${toE164} | contentSid: ${contentSid} | from: ${params.from || "N/A"} | msgSvcSid: ${params.messagingServiceSid ? params.messagingServiceSid.substring(0, 6) + "..." : "N/A"}`);
            const message = await this.client.messages.create(params);
            this.logger.log(`WhatsApp template sent to ${toE164} | SID: ${message.sid} | Status: ${message.status}`);
            return { success: true, messageSid: message.sid, status: message.status };
        }
        catch (error) {
            const errorCode = error?.code?.toString() || "UNKNOWN";
            const errorMessage = error?.message || "Unknown Twilio error";
            const moreInfo = error?.moreInfo || "";
            this.logger.error(`WhatsApp template FAILED to ${toE164} | Code: ${errorCode} | Message: ${errorMessage}${moreInfo ? ` | Info: ${moreInfo}` : ""}`);
            return { success: false, errorCode, errorMessage };
        }
    }
    async sendFreeform(toE164, messageBody) {
        if (!this.client || this.disabled) {
            return {
                success: false,
                errorCode: "NOT_CONFIGURED",
                errorMessage: this.disableReason || "Twilio client is not configured",
            };
        }
        try {
            const params = {
                body: messageBody,
                to: `whatsapp:${toE164}`,
            };
            if (this.fromNumber) {
                params.from = this.fromNumber;
            }
            else if (this.messagingServiceSid) {
                params.messagingServiceSid = this.messagingServiceSid;
            }
            if (this.statusCallbackUrl) {
                params.statusCallback = this.statusCallbackUrl;
            }
            this.logger.log(`Sending freeform WhatsApp to ${toE164} | from: ${params.from || "N/A"}`);
            const message = await this.client.messages.create(params);
            this.logger.log(`Freeform WhatsApp sent to ${toE164} | SID: ${message.sid} | Status: ${message.status}`);
            return { success: true, messageSid: message.sid, status: message.status };
        }
        catch (error) {
            const errorCode = error?.code?.toString() || "UNKNOWN";
            const errorMessage = error?.message || "Unknown Twilio error";
            this.logger.error(`Freeform WhatsApp FAILED to ${toE164} | Code: ${errorCode} | Message: ${errorMessage}`);
            return { success: false, errorCode, errorMessage };
        }
    }
};
exports.TwilioWhatsAppService = TwilioWhatsAppService;
exports.TwilioWhatsAppService = TwilioWhatsAppService = TwilioWhatsAppService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], TwilioWhatsAppService);
//# sourceMappingURL=twilio-whatsapp.service.js.map