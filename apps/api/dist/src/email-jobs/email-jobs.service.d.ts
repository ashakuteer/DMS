import { PrismaService } from '../prisma/prisma.service';
import { EmailJobType, EmailJobStatus } from '@prisma/client';
export interface CreateEmailJobDto {
    donorId?: string;
    toEmail: string;
    subject: string;
    body: string;
    type: EmailJobType;
    relatedId?: string;
    scheduledAt: Date;
}
export interface EmailJobFilters {
    status?: EmailJobStatus;
    type?: EmailJobType;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
}
export declare class EmailJobsService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    create(dto: CreateEmailJobDto): Promise<any>;
    findAll(filters?: EmailJobFilters): Promise<{
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
            type: import(".prisma/client").$Enums.EmailJobType;
            status: import(".prisma/client").$Enums.EmailJobStatus;
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
    findPendingJobs(limit?: number): Promise<({
        donor: {
            id: string;
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
        type: import(".prisma/client").$Enums.EmailJobType;
        status: import(".prisma/client").$Enums.EmailJobStatus;
        toEmail: string;
        sentAt: Date | null;
        relatedId: string | null;
        attempts: number;
        lastError: string | null;
        scheduledAt: Date;
    })[]>;
    markSent(id: string, messageId?: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        subject: string;
        body: string;
        donorId: string | null;
        type: import(".prisma/client").$Enums.EmailJobType;
        status: import(".prisma/client").$Enums.EmailJobStatus;
        toEmail: string;
        sentAt: Date | null;
        relatedId: string | null;
        attempts: number;
        lastError: string | null;
        scheduledAt: Date;
    }>;
    markFailed(id: string, error: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        subject: string;
        body: string;
        donorId: string | null;
        type: import(".prisma/client").$Enums.EmailJobType;
        status: import(".prisma/client").$Enums.EmailJobStatus;
        toEmail: string;
        sentAt: Date | null;
        relatedId: string | null;
        attempts: number;
        lastError: string | null;
        scheduledAt: Date;
    }>;
    getStats(): Promise<{
        queued: number;
        sent: number;
        failed: number;
        total: number;
    }>;
    findByRelatedId(relatedId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        subject: string;
        body: string;
        donorId: string | null;
        type: import(".prisma/client").$Enums.EmailJobType;
        status: import(".prisma/client").$Enums.EmailJobStatus;
        toEmail: string;
        sentAt: Date | null;
        relatedId: string | null;
        attempts: number;
        lastError: string | null;
        scheduledAt: Date;
    }>;
    retryFailed(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        subject: string;
        body: string;
        donorId: string | null;
        type: import(".prisma/client").$Enums.EmailJobType;
        status: import(".prisma/client").$Enums.EmailJobStatus;
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
}
