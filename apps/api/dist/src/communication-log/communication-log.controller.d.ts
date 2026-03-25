import { CommunicationLogService } from './communication-log.service';
import { AuditService } from '../audit/audit.service';
export declare class CommunicationLogController {
    private communicationLogService;
    private auditService;
    constructor(communicationLogService: CommunicationLogService, auditService: AuditService);
    getByDonorId(donorId: string): Promise<any>;
    getByDonationId(donationId: string): Promise<any>;
    logWhatsAppClick(body: {
        donorId: string;
        donationId?: string;
        templateId?: string;
        phoneNumber: string;
        messagePreview?: string;
        type?: string;
    }, req: any): Promise<any>;
    logPostDonationAction(body: {
        donorId: string;
        donationId?: string;
        action: 'send_email' | 'send_whatsapp' | 'remind_later' | 'skip';
    }, req: any): Promise<any>;
    delete(id: string, req: any): Promise<any>;
}
