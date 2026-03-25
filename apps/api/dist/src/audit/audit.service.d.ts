import { PrismaService } from '../prisma/prisma.service';
import { AuditAction } from '@prisma/client';
export interface AuditLogInput {
    userId: string;
    action: AuditAction;
    entityType?: string;
    entityId?: string;
    oldValue?: Record<string, any>;
    newValue?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
    metadata?: Record<string, any>;
}
export declare class AuditService {
    private prisma;
    constructor(prisma: PrismaService);
    log(input: AuditLogInput): Promise<void>;
    logDonorCreate(userId: string, donorId: string, donorData: Record<string, any>, ipAddress?: string, userAgent?: string): Promise<void>;
    logDonorUpdate(userId: string, donorId: string, oldData: Record<string, any>, newData: Record<string, any>, ipAddress?: string, userAgent?: string): Promise<void>;
    logDonorDelete(userId: string, donorId: string, donorData: Record<string, any>, ipAddress?: string, userAgent?: string): Promise<void>;
    logDonorAssignmentChange(userId: string, donorId: string, oldAssigneeId: string | null, newAssigneeId: string | null, ipAddress?: string, userAgent?: string): Promise<void>;
    logDonationCreate(userId: string, donationId: string, donationData: Record<string, any>, ipAddress?: string, userAgent?: string): Promise<void>;
    logDonationUpdate(userId: string, donationId: string, oldData: Record<string, any>, newData: Record<string, any>, ipAddress?: string, userAgent?: string): Promise<void>;
    logDonationDelete(userId: string, donationId: string, donationData: Record<string, any>, ipAddress?: string, userAgent?: string): Promise<void>;
    logReceiptRegenerate(userId: string, donationId: string, metadata?: Record<string, any>, ipAddress?: string, userAgent?: string): Promise<void>;
    logDataExport(userId: string, exportType: string, filters?: Record<string, any>, recordCount?: number, ipAddress?: string, userAgent?: string): Promise<void>;
    logRoleChange(userId: string, targetUserId: string, oldRole: string, newRole: string, ipAddress?: string, userAgent?: string): Promise<void>;
    logFullAccessRequest(userId: string, donorId: string, reason?: string, ipAddress?: string, userAgent?: string): Promise<void>;
    logPledgeCreate(userId: string, pledgeId: string, pledgeData: Record<string, any>, ipAddress?: string, userAgent?: string): Promise<void>;
    logPledgeUpdate(userId: string, pledgeId: string, oldData: Record<string, any>, newData: Record<string, any>, ipAddress?: string, userAgent?: string): Promise<void>;
    logPledgeDelete(userId: string, pledgeId: string, pledgeData: Record<string, any>, ipAddress?: string, userAgent?: string): Promise<void>;
    logPledgeFulfilled(userId: string, pledgeId: string, oldData: Record<string, any>, newData: Record<string, any>, ipAddress?: string, userAgent?: string): Promise<void>;
    logPledgePostponed(userId: string, pledgeId: string, oldData: Record<string, any>, newData: Record<string, any>, ipAddress?: string, userAgent?: string): Promise<void>;
    logPledgeCancelled(userId: string, pledgeId: string, oldData: Record<string, any>, newData: Record<string, any>, ipAddress?: string, userAgent?: string): Promise<void>;
    logBeneficiaryCreate(userId: string, beneficiaryId: string, data: Record<string, any>, ipAddress?: string, userAgent?: string): Promise<void>;
    logBeneficiaryUpdate(userId: string, beneficiaryId: string, oldData: Record<string, any>, newData: Record<string, any>, ipAddress?: string, userAgent?: string): Promise<void>;
    logBeneficiaryDelete(userId: string, beneficiaryId: string, data: Record<string, any>, ipAddress?: string, userAgent?: string): Promise<void>;
    logEmailSend(userId: string, entityType: string, entityId: string, metadata?: Record<string, any>): Promise<void>;
    logWhatsAppSend(userId: string, entityType: string, entityId: string, metadata?: Record<string, any>): Promise<void>;
    getAuditLogs(filters?: {
        userId?: string;
        action?: AuditAction;
        entityType?: string;
        entityId?: string;
        startDate?: Date;
        endDate?: Date;
    }, page?: number, limit?: number): Promise<{
        items: any;
        total: any;
        page: number;
        limit: number;
        totalPages: number;
    }>;
}
