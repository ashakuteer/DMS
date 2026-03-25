import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { ReceiptService } from "../receipt/receipt.service";
import { EmailService } from "../email/email.service";
import { CommunicationLogService } from "../communication-log/communication-log.service";
import { OrganizationProfileService } from "../organization-profile/organization-profile.service";
import { Role } from "@prisma/client";
import { CommunicationsService } from "../communications/communications.service";
import { NotificationService } from "../notifications/notification.service";
export interface DonationQueryOptions {
    page?: number;
    limit?: number;
    donorId?: string;
    startDate?: string;
    endDate?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
    search?: string;
    donationType?: string;
    donationHomeType?: string;
}
export interface UserContext {
    id: string;
    role: Role;
    email: string;
}
export declare class DonationsService {
    private prisma;
    private auditService;
    private receiptService;
    private emailService;
    private communicationLogService;
    private orgProfileService;
    private communicationsService;
    private notificationService;
    private readonly logger;
    constructor(prisma: PrismaService, auditService: AuditService, receiptService: ReceiptService, emailService: EmailService, communicationLogService: CommunicationLogService, orgProfileService: OrganizationProfileService, communicationsService: CommunicationsService, notificationService: NotificationService);
    private getDonorAccessFilter;
    private shouldMaskDonorData;
    findAll(user: UserContext, options?: DonationQueryOptions): Promise<{
        items: any;
        total: any;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findOne(user: UserContext, id: string): Promise<any>;
    create(user: UserContext, data: any, ipAddress?: string, userAgent?: string): Promise<any>;
    private sendDonationReceiptEmail;
    update(user: UserContext, id: string, data: any, ipAddress?: string, userAgent?: string): Promise<any>;
    softDelete(user: UserContext, id: string, ipAddress?: string, userAgent?: string): Promise<any>;
    regenerateReceipt(user: UserContext, id: string, ipAddress?: string, userAgent?: string): Promise<{
        success: boolean;
        message: string;
        receiptNumber: any;
    }>;
    resendReceipt(user: UserContext, id: string, emailType?: 'GENERAL' | 'TAX' | 'KIND'): Promise<{
        success: boolean;
        message: string;
        receiptNumber: any;
        recipientEmail: any;
    }>;
    getStatsByHome(user: UserContext): Promise<{
        byHome: {
            cashTotal: number;
            inKindCount: number;
            totalCount: number;
            homeType: string;
            label: string;
        }[];
        totals: {
            cashTotal: number;
            inKindCount: number;
            totalDonations: any;
        };
    }>;
    exportDonations(user: UserContext, filters?: any, ipAddress?: string, userAgent?: string): Promise<any>;
    exportToExcel(user: UserContext, filters?: any, ipAddress?: string, userAgent?: string): Promise<Buffer>;
    private getHomeTypeLabel;
    getReceiptPdf(user: UserContext, donationId: string): Promise<{
        buffer: Buffer;
        filename: string;
    }>;
    private updatePrimaryHomeInterest;
}
