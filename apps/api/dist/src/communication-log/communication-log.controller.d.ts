import { CommunicationLogService } from './communication-log.service';
import { AuditService } from '../audit/audit.service';
export declare class CommunicationLogController {
    private communicationLogService;
    private auditService;
    constructor(communicationLogService: CommunicationLogService, auditService: AuditService);
    getByDonorId(donorId: string): Promise<({
        donation: {
            id: string;
            donationAmount: import("@prisma/client/runtime/library").Decimal;
            receiptNumber: string;
        };
        sentBy: {
            name: string;
            role: import(".prisma/client").$Enums.Role;
            id: string;
        };
        template: {
            name: string;
            id: string;
            type: import(".prisma/client").$Enums.TemplateType;
        };
    } & {
        id: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        createdAt: Date;
        subject: string | null;
        donorId: string;
        donationId: string | null;
        templateId: string | null;
        taskId: string | null;
        channel: import(".prisma/client").$Enums.CommunicationChannel;
        type: import(".prisma/client").$Enums.CommunicationType;
        status: import(".prisma/client").$Enums.CommunicationStatus;
        contactMethod: string | null;
        outcome: string | null;
        recipient: string | null;
        messagePreview: string | null;
        errorMessage: string | null;
        sentById: string | null;
    })[]>;
    getByDonationId(donationId: string): Promise<({
        sentBy: {
            name: string;
            role: import(".prisma/client").$Enums.Role;
            id: string;
        };
        template: {
            name: string;
            id: string;
            type: import(".prisma/client").$Enums.TemplateType;
        };
    } & {
        id: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        createdAt: Date;
        subject: string | null;
        donorId: string;
        donationId: string | null;
        templateId: string | null;
        taskId: string | null;
        channel: import(".prisma/client").$Enums.CommunicationChannel;
        type: import(".prisma/client").$Enums.CommunicationType;
        status: import(".prisma/client").$Enums.CommunicationStatus;
        contactMethod: string | null;
        outcome: string | null;
        recipient: string | null;
        messagePreview: string | null;
        errorMessage: string | null;
        sentById: string | null;
    })[]>;
    logWhatsAppClick(body: {
        donorId: string;
        donationId?: string;
        templateId?: string;
        phoneNumber: string;
        messagePreview?: string;
        type?: string;
    }, req: any): Promise<{
        id: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        createdAt: Date;
        subject: string | null;
        donorId: string;
        donationId: string | null;
        templateId: string | null;
        taskId: string | null;
        channel: import(".prisma/client").$Enums.CommunicationChannel;
        type: import(".prisma/client").$Enums.CommunicationType;
        status: import(".prisma/client").$Enums.CommunicationStatus;
        contactMethod: string | null;
        outcome: string | null;
        recipient: string | null;
        messagePreview: string | null;
        errorMessage: string | null;
        sentById: string | null;
    }>;
    logPostDonationAction(body: {
        donorId: string;
        donationId?: string;
        action: 'send_email' | 'send_whatsapp' | 'remind_later' | 'skip';
    }, req: any): Promise<{
        id: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        createdAt: Date;
        subject: string | null;
        donorId: string;
        donationId: string | null;
        templateId: string | null;
        taskId: string | null;
        channel: import(".prisma/client").$Enums.CommunicationChannel;
        type: import(".prisma/client").$Enums.CommunicationType;
        status: import(".prisma/client").$Enums.CommunicationStatus;
        contactMethod: string | null;
        outcome: string | null;
        recipient: string | null;
        messagePreview: string | null;
        errorMessage: string | null;
        sentById: string | null;
    }>;
    delete(id: string, req: any): Promise<{
        id: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        createdAt: Date;
        subject: string | null;
        donorId: string;
        donationId: string | null;
        templateId: string | null;
        taskId: string | null;
        channel: import(".prisma/client").$Enums.CommunicationChannel;
        type: import(".prisma/client").$Enums.CommunicationType;
        status: import(".prisma/client").$Enums.CommunicationStatus;
        contactMethod: string | null;
        outcome: string | null;
        recipient: string | null;
        messagePreview: string | null;
        errorMessage: string | null;
        sentById: string | null;
    }>;
}
