import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { Role } from "@prisma/client";
export declare class UsersService {
    private prisma;
    private auditService;
    constructor(prisma: PrismaService, auditService: AuditService);
    findAll(page?: number, limit?: number): Promise<{
        items: any;
        total: any;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findOne(id: string): Promise<any>;
    updateRole(id: string, role: Role, currentUserId: string, ipAddress?: string, userAgent?: string): Promise<any>;
    updateUser(id: string, data: {
        name?: string;
        phone?: string;
        role?: Role;
    }): Promise<any>;
    toggleActive(id: string): Promise<any>;
    listStaffForAssignment(): Promise<any>;
    createStaff(data: {
        name: string;
        email: string;
        phone?: string;
        role: string;
        password: string;
    }): Promise<any>;
    resetUserPassword(id: string, newPassword: string): Promise<{
        message: string;
    }>;
    reassignPhone(fromUserId: string, toUserId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    listAllStaff(): Promise<any>;
    deleteUser(id: string): Promise<any>;
}
