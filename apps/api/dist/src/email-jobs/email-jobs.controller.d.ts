import { EmailJobsService } from './email-jobs.service';
import { Role, EmailJobStatus, EmailJobType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { OrganizationProfileService } from '../organization-profile/organization-profile.service';
import { CommunicationLogService } from '../communication-log/communication-log.service';
import { EmailService } from '../email/email.service';
interface UserContext {
    id: string;
    email: string;
    role: Role;
}
export declare class EmailJobsController {
    private readonly emailJobsService;
    private readonly prisma;
    private readonly orgProfileService;
    private readonly communicationLogService;
    private readonly emailService;
    private readonly logger;
    constructor(emailJobsService: EmailJobsService, prisma: PrismaService, orgProfileService: OrganizationProfileService, communicationLogService: CommunicationLogService, emailService: EmailService);
    findAll(status?: EmailJobStatus, type?: EmailJobType, startDate?: string, endDate?: string, page?: string, limit?: string): Promise<{
        jobs: ({
            donor: {
                id: string;
                donorCode: string;
                firstName: string;
                lastName: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            subject: string;
            body: string;
            donorId: string | null;
            type: import("@prisma/client").$Enums.EmailJobType;
            status: import("@prisma/client").$Enums.EmailJobStatus;
            toEmail: string;
            sentAt: Date | null;
            relatedId: string | null;
            attempts: number;
            lastError: string | null;
            scheduledAt: Date;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    getStats(): Promise<{
        queued: number;
        sent: number;
        failed: number;
        total: number;
    }>;
    retry(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        subject: string;
        body: string;
        donorId: string | null;
        type: import("@prisma/client").$Enums.EmailJobType;
        status: import("@prisma/client").$Enums.EmailJobStatus;
        toEmail: string;
        sentAt: Date | null;
        relatedId: string | null;
        attempts: number;
        lastError: string | null;
        scheduledAt: Date;
    }>;
    delete(id: string): Promise<{
        success: boolean;
    }>;
    queueEmail(user: UserContext, body: {
        donorId: string;
        type: 'special_day' | 'pledge';
        occasionType?: string;
        pledgeId?: string;
        relatedPersonName?: string;
    }): Promise<{
        success: boolean;
        message: string;
        jobId: any;
    }>;
    private getOccasionLabel;
    private getSpecialDayEmailBody;
}
export {};
