import { PrismaService } from "../../prisma/prisma.service";
import { AuditService } from "../../audit/audit.service";
export declare class ExecutorService {
    private prisma;
    private auditService;
    constructor(prisma: PrismaService, auditService: AuditService);
    executeBulkImport(user: any, rows: any[], mapping: Record<string, string>, actions: Record<number, "skip" | "update" | "create">, ip?: string, agent?: string): Promise<{
        success: boolean;
    }>;
    bulkUpload(file: any, user: any): Promise<{
        message: string;
        user: any;
    }>;
}
