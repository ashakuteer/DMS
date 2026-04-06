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
    }, req: any): Promise<any>;
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
        status: any;
        messageId: any;
        templateKey: WhatsAppTemplateKey;
    }>;
    sendFreeform(body: {
        donorId?: string;
        toE164: string;
        message: string;
        type?: string;
    }, req: any): Promise<{
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
    getConfiguredTemplates(): Promise<{
        configured: boolean;
        templates: Record<WhatsAppTemplateKey, boolean>;
    }>;
}
