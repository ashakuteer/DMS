import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { HealthStatus } from '@prisma/client';
interface HealthScoreResult {
    score: number;
    status: HealthStatus;
    breakdown: {
        base: number;
        donationDeduction: number;
        donationBonus: number;
        missedSpecialDays: number;
        acknowledgedSpecialDays: number;
        overdueReminders: number;
        contactDeduction: number;
        contactBonus: number;
        pledgeDeduction: number;
    };
}
export declare class HealthScoreService {
    private prisma;
    private auditService;
    private readonly logger;
    constructor(prisma: PrismaService, auditService: AuditService);
    calculateHealthScore(donorId: string): Promise<HealthScoreResult>;
    updateDonorHealthScore(donorId: string, userId?: string): Promise<void>;
    recalculateAllHealthScores(): Promise<{
        updated: number;
        errors: number;
    }>;
    getStatusColor(status: HealthStatus): string;
    getStatusLabel(status: HealthStatus): string;
}
export {};
