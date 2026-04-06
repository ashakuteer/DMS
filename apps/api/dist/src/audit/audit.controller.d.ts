import { AuditService } from './audit.service';
import { PrismaService } from '../prisma/prisma.service';
export declare class AuditController {
    private readonly auditService;
    private readonly prisma;
    constructor(auditService: AuditService, prisma: PrismaService);
    getAuditLogs(page?: string, limit?: string, userId?: string, action?: string, entityType?: string, startDate?: string, endDate?: string): Promise<{
        items: any;
        total: any;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    getUsers(): Promise<any>;
    getActions(): Promise<unknown[]>;
}
