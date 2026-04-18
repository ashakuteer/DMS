import { PrismaService } from '../prisma/prisma.service';
import { CommunicationsService } from '../communications/communications.service';
import { CommunicationLogService } from '../communication-log/communication-log.service';
import { EmailService } from '../email/email.service';
import { ReceiptService } from '../receipt/receipt.service';
import { DonationEmailType } from '../email/templates/donation.templates';
export interface DonationNotificationParams {
    donationId: string;
    donorId: string;
    receiptNumber: string;
    donationAmount: number;
    currency: string;
    donationType: string;
    donationDate: Date;
    donationMode?: string;
    donorPAN?: string;
    emailType?: DonationEmailType;
    userId?: string;
}
export declare class NotificationService {
    private prisma;
    private communicationsService;
    private communicationLogService;
    private emailService;
    private receiptService;
    private readonly logger;
    constructor(prisma: PrismaService, communicationsService: CommunicationsService, communicationLogService: CommunicationLogService, emailService: EmailService, receiptService: ReceiptService);
    hasDonationNotificationBeenSent(donationId: string, channel: 'EMAIL' | 'WHATSAPP'): Promise<boolean>;
    sendDonationEmail(params: DonationNotificationParams): Promise<{
        status: string;
        skipped?: boolean;
    }>;
    sendDonationWhatsApp(params: DonationNotificationParams, options?: {
        force?: boolean;
    }): Promise<{
        status: string;
        messageId?: string;
        skipped?: boolean;
    }>;
}
