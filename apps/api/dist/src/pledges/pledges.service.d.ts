import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CommunicationLogService } from '../communication-log/communication-log.service';
import { EmailJobsService } from '../email-jobs/email-jobs.service';
import { OrganizationProfileService } from '../organization-profile/organization-profile.service';
import { Role, PledgeStatus } from '@prisma/client';
export interface PledgeQueryOptions {
    page?: number;
    limit?: number;
    donorId?: string;
    status?: PledgeStatus;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
export interface UserContext {
    id: string;
    role: Role;
    email: string;
}
export interface FulfillPledgeDto {
    donationId?: string;
    donationAmount?: number;
    donationDate?: string;
    donationMode?: string;
    donationType?: string;
    remarks?: string;
    autoCreateDonation?: boolean;
}
export declare class PledgesService {
    private prisma;
    private auditService;
    private communicationLogService;
    private emailJobsService;
    private orgProfileService;
    private readonly logger;
    constructor(prisma: PrismaService, auditService: AuditService, communicationLogService: CommunicationLogService, emailJobsService: EmailJobsService, orgProfileService: OrganizationProfileService);
    private getDonorAccessFilter;
    findAll(user: UserContext, options?: PledgeQueryOptions): Promise<{
        items: any;
        total: any;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findOne(user: UserContext, id: string): Promise<any>;
    create(user: UserContext, data: any, ipAddress: string, userAgent: string): Promise<any>;
    update(user: UserContext, id: string, data: any, ipAddress: string, userAgent: string): Promise<any>;
    markFulfilled(user: UserContext, id: string, dto?: FulfillPledgeDto, ipAddress?: string, userAgent?: string): Promise<any>;
    postpone(user: UserContext, id: string, newDate: string, notes?: string, ipAddress?: string, userAgent?: string): Promise<any>;
    cancel(user: UserContext, id: string, reason?: string, ipAddress?: string, userAgent?: string): Promise<any>;
    delete(user: UserContext, id: string, ipAddress: string, userAgent: string): Promise<{
        success: boolean;
    }>;
    getDonorPledgeSuggestions(donorId: string): Promise<any>;
    sendPledgeReminderEmail(user: UserContext, id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    buildWhatsAppReminderText(pledge: any): Promise<string>;
    logWhatsAppReminder(user: UserContext, id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    private generatePledgeReminders;
}
