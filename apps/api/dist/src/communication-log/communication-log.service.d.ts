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
    create(data: CreateCommunicationLogDto): Promise<any>;
    findByDonorId(donorId: string): Promise<any>;
    findByDonationId(donationId: string): Promise<any>;
    delete(id: string): Promise<any>;
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
    }): Promise<any>;
    logWhatsApp(params: {
        donorId: string;
        donationId?: string;
        templateId?: string;
        phoneNumber: string;
        messagePreview?: string;
        sentById: string;
        type?: CommunicationType;
    }): Promise<any>;
    logPostDonationAction(params: {
        donorId: string;
        donationId?: string;
        action: 'send_email' | 'send_whatsapp' | 'remind_later' | 'skip';
        sentById: string;
        userRole: string;
    }): Promise<any>;
    private inferEmailType;
}
