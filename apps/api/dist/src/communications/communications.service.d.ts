import { PrismaService } from "../prisma/prisma.service";
import { TwilioWhatsAppService, WhatsAppTemplateKey } from "./twilio-whatsapp.service";
export interface SendWhatsAppTemplateDto {
    donorId?: string;
    donationId?: string;
    toE164: string;
    contentSid: string;
    variables?: Record<string, string>;
    templateKey?: WhatsAppTemplateKey;
}
export declare class CommunicationsService {
    private prisma;
    private twilioWhatsApp;
    private readonly logger;
    constructor(prisma: PrismaService, twilioWhatsApp: TwilioWhatsAppService);
    isWhatsAppConfigured(): boolean;
    getWhatsAppDisableReason(): string;
    isTemplateConfigured(templateKey: WhatsAppTemplateKey): boolean;
    getConfiguredTemplates(): Record<WhatsAppTemplateKey, boolean>;
    getContentSidForKey(templateKey: WhatsAppTemplateKey): string | null;
    private mapTwilioStatusToCommStatus;
    sendWhatsAppTemplate(dto: SendWhatsAppTemplateDto, userId?: string): Promise<any>;
    sendByTemplateKey(templateKey: WhatsAppTemplateKey, donorId: string, toE164: string, variables?: Record<string, string>, userId?: string, donationId?: string): Promise<{
        success: boolean;
        status: string;
        templateKey: WhatsAppTemplateKey;
        messageId?: undefined;
    } | {
        success: boolean;
        status: any;
        messageId: any;
        templateKey: WhatsAppTemplateKey;
    }>;
    sendFreeform(donorId: string, toE164: string, message: string, type?: string, userId?: string): Promise<{
        success: boolean;
        status: any;
        messageId: any;
        error?: undefined;
    } | {
        success: boolean;
        error: string;
        status?: undefined;
        messageId?: undefined;
    }>;
    getWhatsAppStatusForDonor(donorId: string, limit?: number): Promise<any>;
    updateStatusFromWebhook(providerMessageId: string, twilioStatus: string, errorCode?: string, errorMessage?: string): Promise<any>;
}
