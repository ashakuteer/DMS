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
    sendWhatsAppTemplate(dto: SendWhatsAppTemplateDto, userId?: string): Promise<{
        id: string;
        createdAt: Date;
        to: string;
        donorId: string | null;
        donationId: string | null;
        channel: import(".prisma/client").$Enums.CommChannel;
        status: import(".prisma/client").$Enums.CommStatus;
        errorMessage: string | null;
        sentAt: Date | null;
        errorCode: string | null;
        provider: import(".prisma/client").$Enums.CommProvider;
        providerMessageId: string | null;
        templateName: string | null;
        templateKey: string | null;
        templateVariables: import("@prisma/client/runtime/library").JsonValue | null;
        createdByUserId: string | null;
        deliveredAt: Date | null;
        readAt: Date | null;
    }>;
    sendByTemplateKey(templateKey: WhatsAppTemplateKey, donorId: string, toE164: string, variables?: Record<string, string>, userId?: string, donationId?: string): Promise<{
        success: boolean;
        status: string;
        templateKey: WhatsAppTemplateKey;
        messageId?: undefined;
    } | {
        success: boolean;
        status: string;
        messageId: string;
        templateKey: WhatsAppTemplateKey;
    }>;
    sendFreeform(donorId: string, toE164: string, message: string, type?: string, userId?: string): Promise<{
        success: boolean;
        status: string;
        messageId: string;
        error?: undefined;
    } | {
        success: boolean;
        error: string;
        status?: undefined;
        messageId?: undefined;
    }>;
    getWhatsAppStatusForDonor(donorId: string, limit?: number): Promise<{
        id: string;
        createdAt: Date;
        to: string;
        status: import(".prisma/client").$Enums.CommStatus;
        errorMessage: string;
        sentAt: Date;
        errorCode: string;
        providerMessageId: string;
        templateKey: string;
        deliveredAt: Date;
    }[]>;
    updateStatusFromWebhook(providerMessageId: string, twilioStatus: string, errorCode?: string, errorMessage?: string): Promise<{
        id: string;
        createdAt: Date;
        to: string;
        donorId: string | null;
        donationId: string | null;
        channel: import(".prisma/client").$Enums.CommChannel;
        status: import(".prisma/client").$Enums.CommStatus;
        errorMessage: string | null;
        sentAt: Date | null;
        errorCode: string | null;
        provider: import(".prisma/client").$Enums.CommProvider;
        providerMessageId: string | null;
        templateName: string | null;
        templateKey: string | null;
        templateVariables: import("@prisma/client/runtime/library").JsonValue | null;
        createdByUserId: string | null;
        deliveredAt: Date | null;
        readAt: Date | null;
    }>;
}
