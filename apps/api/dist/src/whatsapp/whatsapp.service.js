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
var WhatsappService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsappService = void 0;
const common_1 = require("@nestjs/common");
const twilio_1 = __importDefault(require("twilio"));
let WhatsappService = WhatsappService_1 = class WhatsappService {
    constructor() {
        this.logger = new common_1.Logger(WhatsappService_1.name);
        this.client = null;
        this.disabled = false;
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
        this.client = (0, twilio_1.default)(accountSid, authToken);
        const twilioPhone = (process.env.TWILIO_PHONE || "").trim();
        const resolvedSender = twilioPhone
            ? (twilioPhone.startsWith("whatsapp:") ? twilioPhone : `whatsapp:${twilioPhone}`)
            : "(NOT SET — OTP sending will fail)";
        console.log("Using TWILIO_PHONE:", twilioPhone || "(NOT SET)");
        this.logger.log(`Twilio client initialized | OTP sender: ${resolvedSender}`);
    }
    normalizeToE164(phone) {
        if (!phone)
            return null;
        let cleaned = phone.replace(/\D/g, "");
        if (cleaned.startsWith("0"))
            cleaned = cleaned.substring(1);
        if (cleaned.startsWith("91") && cleaned.length === 12)
            return `+${cleaned}`;
        if (cleaned.length === 10)
            return `+91${cleaned}`;
        if (cleaned.length > 10)
            return `+${cleaned}`;
        return null;
    }
    async sendOtpTemplate(to, otp) {
        if (!this.client || this.disabled) {
            this.logger.warn(`[OTP-WA][NO-CLIENT] OTP for ${to}: ${otp}`);
            return false;
        }
        const rawPhone = (process.env.TWILIO_PHONE || "").trim();
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
        const body = `Your Asha Kuteer login OTP is ${otp}. It is valid for 5 minutes.`;
        try {
            const params = {
                body,
                from: fromPhone,
                to: `whatsapp:${e164}`,
            };
            const contentSid = (process.env.TWILIO_OTP_CONTENT_SID || "").trim();
            if (contentSid.startsWith("HX")) {
                delete params.body;
                params.contentSid = contentSid;
                params.contentVariables = JSON.stringify({ "1": otp });
                this.logger.log(`[OTP-WA] Using Content SID: ${contentSid.substring(0, 8)}...`);
            }
            this.logger.log(`[OTP-WA] Sending from ${fromPhone} → ${`whatsapp:${e164}`}`);
            const result = await this.client.messages.create(params);
            this.logger.log(`[OTP-WA] Sent to ${e164} | SID: ${result.sid}`);
            return true;
        }
        catch (error) {
            this.logger.error(`[OTP-WA] FAILED to ${e164} | Code: ${error?.code} | ${error?.message}`);
            this.logger.warn(`[OTP-WA][FALLBACK] OTP for ${e164}: ${otp}`);
            return false;
        }
    }
    async sendWhatsApp(to, message) {
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
        }
        catch (error) {
            this.logger.error(`[WhatsApp] FAILED to ${e164} | Code: ${error?.code} | ${error?.message}`);
            return false;
        }
    }
};
exports.WhatsappService = WhatsappService;
exports.WhatsappService = WhatsappService = WhatsappService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], WhatsappService);
//# sourceMappingURL=whatsapp.service.js.map