import { PrismaService } from '../prisma/prisma.service';
import { CommunicationChannel, CommunicationType, CommunicationStatus } from '@prisma/client';
export interface CreateCommunicationLogDto {
    donorId: string;
    donationId?: string;
    templateId?: string;
    channel: CommunicationChannel;
    type: CommunicationType;
    status: CommunicationStatus;
    recipient?: string;
    subject?: string;
    messagePreview?: string;
    errorMessage?: string;
    metadata?: Record<string, any>;
    sentById?: string;
}
export declare class CommunicationLogService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    create(data: CreateCommunicationLogDto): Promise<{
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
    findByDonorId(donorId: string): Promise<({
        donation: {
            id: string;
            receiptNumber: string;
            donationAmount: import("@prisma/client/runtime/library").Decimal;
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
    findByDonationId(donationId: string): Promise<({
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
    delete(id: string): Promise<{
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
    logEmail(params: {
        donorId: string;
        donationId?: string;
        templateId?: string;
        toEmail: string;
        subject: string;
        messagePreview?: string;
        status: 'SENT' | 'FAILED';
        errorMessage?: string;
        sentById?: string;
        type?: CommunicationType;
    }): Promise<{
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
    logWhatsApp(params: {
        donorId: string;
        donationId?: string;
        templateId?: string;
        phoneNumber: string;
        messagePreview?: string;
        sentById: string;
        type?: CommunicationType;
    }): Promise<{
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
    logPostDonationAction(params: {
        donorId: string;
        donationId?: string;
        action: 'send_email' | 'send_whatsapp' | 'remind_later' | 'skip';
        sentById: string;
        userRole: string;
    }): Promise<{
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
    private inferEmailType;
}
