import { BroadcastingService, BroadcastFilters } from './broadcasting.service';
export declare class BroadcastingController {
    private readonly broadcastingService;
    constructor(broadcastingService: BroadcastingService);
    previewAudience(body: {
        filters: BroadcastFilters;
        channel: 'WHATSAPP' | 'EMAIL';
    }): Promise<{
        total: any;
        reachable: number;
        unreachable: number;
        sampleDonors: any;
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
    getEmailTemplates(): Promise<any>;
    getStaffList(): Promise<any>;
    getProfessionList(): Promise<string[]>;
}
