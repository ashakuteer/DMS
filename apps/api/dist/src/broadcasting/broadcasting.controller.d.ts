import { BroadcastingService, BroadcastFilters } from './broadcasting.service';
export declare class BroadcastingController {
    private readonly broadcastingService;
    constructor(broadcastingService: BroadcastingService);
    previewAudience(body: {
        filters: BroadcastFilters;
        channel: 'WHATSAPP' | 'EMAIL';
    }): Promise<{
        total: number;
        reachable: number;
        unreachable: number;
        sampleDonors: {
            id: string;
            name: string;
            contact: string;
        }[];
    }>;
    sendBroadcast(user: any, body: {
        channel: 'WHATSAPP' | 'EMAIL';
        filters: BroadcastFilters;
        contentSid?: string;
        contentVariables?: Record<string, string>;
        emailSubject?: string;
        emailBody?: string;
    }): Promise<import("./broadcasting.service").BroadcastResult>;
    getWhatsAppTemplates(): Promise<Record<import("../communications/twilio-whatsapp.service").WhatsAppTemplateKey, boolean>>;
    getEmailTemplates(): Promise<{
        name: string;
        id: string;
        type: import("@prisma/client").$Enums.TemplateType;
        description: string;
        emailSubject: string;
        emailBody: string;
    }[]>;
    getStaffList(): Promise<{
        name: string;
        role: import("@prisma/client").$Enums.Role;
        id: string;
    }[]>;
    getProfessionList(): Promise<string[]>;
}
