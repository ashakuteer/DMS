import { EmailService } from './email.service';
import { PrismaService } from '../prisma/prisma.service';
import { ReceiptService } from '../receipt/receipt.service';
import { CommunicationLogService } from '../communication-log/communication-log.service';
import { AuditService } from '../audit/audit.service';
interface SendEmailDto {
    donorId: string;
    donationId?: string;
    templateId?: string;
    toEmail: string;
    subject: string;
    body: string;
    attachReceipt?: boolean;
}
export declare class EmailController {
    private readonly emailService;
    private readonly prisma;
    private readonly receiptService;
    private readonly communicationLogService;
    private readonly auditService;
    constructor(emailService: EmailService, prisma: PrismaService, receiptService: ReceiptService, communicationLogService: CommunicationLogService, auditService: AuditService);
    getConfigStatus(): {
        configured: boolean;
        smtpHost: string;
        smtpUser: string;
        fromEmail: string;
        error: string;
    };
    testSend(body: {
        toEmail: string;
    }, req: any): Promise<{
        success: boolean;
        messageId?: string;
        error?: string;
    }>;
    sendEmail(dto: SendEmailDto, req: any): Promise<{
        success: boolean;
        messageId: string;
        message: string;
    }>;
}
export {};
