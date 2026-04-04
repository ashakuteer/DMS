import { AuditService } from './audit.service';
import { PrismaService } from '../prisma/prisma.service';
export declare class AuditController {
    private readonly auditService;
    private readonly prisma;
    constructor(auditService: AuditService, prisma: PrismaService);
    getAuditLogs(page?: string, limit?: string, userId?: string, action?: string, entityType?: string, startDate?: string, endDate?: string): Promise<{
        items: ({
            user: {
                email: string;
                name: string;
                role: import(".prisma/client").$Enums.Role;
                id: string;
            };
        } & {
            id: string;
            userId: string;
            action: import(".prisma/client").$Enums.AuditAction;
            entityType: string | null;
            entityId: string | null;
            oldValue: import("@prisma/client/runtime/library").JsonValue | null;
            newValue: import("@prisma/client/runtime/library").JsonValue | null;
            ipAddress: string | null;
            userAgent: string | null;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
            createdAt: Date;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    getUsers(): Promise<{
        email: string;
        name: string;
        role: import(".prisma/client").$Enums.Role;
        id: string;
    }[]>;
    getActions(): Promise<("DONOR_CREATE" | "DONOR_UPDATE" | "DONOR_DELETE" | "DONOR_ASSIGNMENT_CHANGE" | "DONOR_MERGE" | "DONATION_CREATE" | "DONATION_UPDATE" | "DONATION_DELETE" | "BENEFICIARY_CREATE" | "BENEFICIARY_UPDATE" | "BENEFICIARY_DELETE" | "PLEDGE_CREATE" | "PLEDGE_UPDATE" | "PLEDGE_DELETE" | "PLEDGE_FULFILLED" | "PLEDGE_POSTPONED" | "PLEDGE_CANCELLED" | "EMAIL_SEND" | "WHATSAPP_SEND" | "RECEIPT_REGENERATE" | "DATA_EXPORT" | "ROLE_CHANGE" | "FULL_ACCESS_REQUEST" | "LOGIN" | "LOGOUT" | "HEALTH_STATUS_CHANGE" | "PERMISSION_CHANGE" | "SENSITIVE_DATA_ACCESS" | "BROADCAST_SENT")[]>;
}
