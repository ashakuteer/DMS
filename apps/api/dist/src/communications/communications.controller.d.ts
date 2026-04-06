import { CommunicationsService } from "./communications.service";
import { WhatsAppTemplateKey } from "./twilio-whatsapp.service";
export declare class CommunicationsController {
    private readonly service;
    constructor(service: CommunicationsService);
    sendWhatsAppTemplate(body: {
        donorId?: string;
        toE164: string;
        contentSid: string;
        variables?: Record<string, string>;
    }, req: any): Promise<{
        id: string;
        createdAt: Date;
        to: string;
        donorId: string | null;
        donationId: string | null;
        channel: import("@prisma/client").$Enums.CommChannel;
        status: import("@prisma/client").$Enums.CommStatus;
        errorMessage: string | null;
        sentAt: Date | null;
        errorCode: string | null;
        provider: import("@prisma/client").$Enums.CommProvider;
        providerMessageId: string | null;
        templateName: string | null;
        templateKey: string | null;
        templateVariables: import("@prisma/client/runtime/library").JsonValue | null;
        createdByUserId: string | null;
        deliveredAt: Date | null;
        readAt: Date | null;
    }>;
    sendByTemplateKey(body: {
        donorId: string;
        toE164: string;
        templateKey: WhatsAppTemplateKey;
        variables?: Record<string, string>;
    }, req: any): Promise<{
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
    sendFreeform(body: {
        donorId?: string;
        toE164: string;
        message: string;
        type?: string;
    }, req: any): Promise<{
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
    getConfiguredTemplates(): Promise<{
        configured: boolean;
        templates: Record<WhatsAppTemplateKey, boolean>;
    }>;
}
