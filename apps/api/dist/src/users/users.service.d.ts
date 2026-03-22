import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { Role } from "@prisma/client";
export declare class UsersService {
    private prisma;
    private auditService;
    constructor(prisma: PrismaService, auditService: AuditService);
    findAll(page?: number, limit?: number): Promise<{
        items: {
            email: string;
            name: string;
            phone: string;
            role: import(".prisma/client").$Enums.Role;
            id: string;
            createdAt: Date;
            isActive: boolean;
            updatedAt: Date;
        }[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findOne(id: string): Promise<{
        email: string;
        name: string;
        phone: string;
        role: import(".prisma/client").$Enums.Role;
        id: string;
        createdAt: Date;
        isActive: boolean;
        updatedAt: Date;
    }>;
    updateRole(id: string, role: Role, currentUserId: string, ipAddress?: string, userAgent?: string): Promise<{
        email: string;
        name: string;
        phone: string;
        role: import(".prisma/client").$Enums.Role;
        id: string;
        isActive: boolean;
    }>;
    updateUser(id: string, data: {
        name?: string;
        phone?: string;
        role?: Role;
    }): Promise<{
        email: string;
        name: string;
        phone: string;
        role: import(".prisma/client").$Enums.Role;
        id: string;
        isActive: boolean;
        updatedAt: Date;
    }>;
    toggleActive(id: string): Promise<{
        email: string;
        name: string;
        phone: string;
        role: import(".prisma/client").$Enums.Role;
        id: string;
        isActive: boolean;
    }>;
    listStaffForAssignment(): Promise<{
        email: string;
        name: string;
        role: import(".prisma/client").$Enums.Role;
        id: string;
    }[]>;
    createStaff(data: {
        name: string;
        email: string;
        phone?: string;
        role: string;
        password: string;
    }): Promise<{
        email: string;
        name: string;
        phone: string;
        role: import(".prisma/client").$Enums.Role;
        id: string;
        createdAt: Date;
        isActive: boolean;
    }>;
    resetUserPassword(id: string, newPassword: string): Promise<{
        message: string;
    }>;
    reassignPhone(fromUserId: string, toUserId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    listAllStaff(): Promise<{
        email: string;
        name: string;
        phone: string;
        role: import(".prisma/client").$Enums.Role;
        id: string;
        createdAt: Date;
        isActive: boolean;
    }[]>;
}
