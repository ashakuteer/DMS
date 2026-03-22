import { OrganizationProfileService } from '../organization-profile/organization-profile.service';
import { DonationEmailType } from './templates/donation.templates';
export interface EmailAttachment {
    filename: string;
    content: Buffer;
    contentType: string;
}
export type EmailFeatureType = 'TEST' | 'AUTO' | 'PLEDGE' | 'SPECIALDAY' | 'RECEIPT' | 'QUEUE' | 'MANUAL' | 'RELAY';
export interface EmailOptions {
    to: string;
    subject: string;
    html: string;
    text?: string;
    attachments?: EmailAttachment[];
    featureType?: EmailFeatureType;
}
export interface EmailConfigStatus {
    configured: boolean;
    smtpUser?: string;
    smtpHost?: string;
    fromEmail?: string;
    error?: string;
}
export declare class EmailService {
    private orgProfileService;
    private readonly logger;
    private transporter;
    private configStatus;
    constructor(orgProfileService: OrganizationProfileService);
    private emailRelayUrl;
    private emailRelaySecret;
    private initializeTransporter;
    reinitialize(): void;
    getConfigStatus(): EmailConfigStatus;
    isConfigured(): boolean;
    getSmtpUser(): string | undefined;
    getMaskedSmtpUser(): string;
    private sendViaRelay;
    private buildFromAddress;
    sendEmail(options: EmailOptions): Promise<{
        success: boolean;
        messageId?: string;
        error?: string;
    }>;
    wrapWithBranding(bodyHtml: string): Promise<string>;
    sendReminderEmail(toEmail: string, donorName: string, reminderType: 'BIRTHDAY' | 'ANNIVERSARY' | 'MEMORIAL' | 'FOLLOW_UP' | 'FAMILY_BIRTHDAY' | 'PLEDGE', relatedPersonName?: string): Promise<{
        success: boolean;
        messageId?: string;
        error?: string;
    }>;
    sendDonationReceipt(toEmail: string, donorName: string, receiptNumber: string, pdfBuffer: Buffer, options?: {
        emailType?: DonationEmailType;
        donationAmount?: number;
        currency?: string;
        donationDate?: Date;
        donationMode?: string;
        donationType?: string;
        donorPAN?: string;
        kindDescription?: string;
    }): Promise<{
        success: boolean;
        messageId?: string;
        error?: string;
    }>;
    private sendEmailWithInline;
}
