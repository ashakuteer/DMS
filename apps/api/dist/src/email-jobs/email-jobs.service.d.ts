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
        jobs: any;
        total: any;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findPendingJobs(limit?: number): Promise<any>;
    markSent(id: string, messageId?: string): Promise<any>;
    markFailed(id: string, error: string): Promise<any>;
    getStats(): Promise<{
        queued: any;
        sent: any;
        failed: any;
        total: any;
    }>;
    findByRelatedId(relatedId: string): Promise<any>;
    retryFailed(id: string): Promise<any>;
    delete(id: string): Promise<{
        success: boolean;
    }>;
}
