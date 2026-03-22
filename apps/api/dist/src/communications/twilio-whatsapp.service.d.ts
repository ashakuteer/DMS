export type WhatsAppTemplateKey = "DONATION_THANK_YOU" | "PLEDGE_DUE" | "SPECIAL_DAY_WISH" | "FOLLOWUP_REMINDER";
export interface SendTemplateResult {
    success: boolean;
    messageSid?: string;
    status?: string;
    errorCode?: string;
    errorMessage?: string;
}
export declare class TwilioWhatsAppService {
    private readonly logger;
    private client;
    private fromNumber;
    private messagingServiceSid;
    private statusCallbackUrl;
    private disabled;
    private disableReason;
    private templateMap;
    constructor();
    private initTemplateMap;
    getContentSidForKey(templateKey: WhatsAppTemplateKey): string | null;
    isTemplateConfigured(templateKey: WhatsAppTemplateKey): boolean;
    getConfiguredTemplates(): Record<WhatsAppTemplateKey, boolean>;
    isConfigured(): boolean;
    getDisableReason(): string;
    sendTemplate(toE164: string, contentSid: string, contentVariables?: Record<string, string>): Promise<SendTemplateResult>;
    sendFreeform(toE164: string, messageBody: string): Promise<SendTemplateResult>;
}
