import { UsersService } from "./users.service";
import { Role } from "@prisma/client";
import { Request } from "express";
interface UserContext {
    id: string;
    role: Role;
    email: string;
}
export declare class UsersController {
    private usersService;
    constructor(usersService: UsersService);
    private getClientInfo;
    listStaff(): Promise<{
        email: string;
        name: string;
        role: import("@prisma/client").$Enums.Role;
        id: string;
    }[]>;
    listAllStaff(): Promise<{
        email: string;
        name: string;
        phone: string;
        role: import("@prisma/client").$Enums.Role;
        id: string;
        createdAt: Date;
        isActive: boolean;
    }[]>;
    createStaff(data: Record<string, any>): Promise<{
        email: string;
        name: string;
        phone: string;
        role: import("@prisma/client").$Enums.Role;
        id: string;
        createdAt: Date;
        assignedHome: import("@prisma/client").$Enums.HomeAssignment;
        isActive: boolean;
    }>;
    findAll(page?: string, limit?: string): Promise<{
        items: {
            email: string;
            name: string;
            phone: string;
            role: import("@prisma/client").$Enums.Role;
            id: string;
            createdAt: Date;
            assignedHome: import("@prisma/client").$Enums.HomeAssignment;
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
        role: import("@prisma/client").$Enums.Role;
        id: string;
        createdAt: Date;
        isActive: boolean;
        updatedAt: Date;
    }>;
    updateRole(id: string, role: Role, user: UserContext, req: Request): Promise<{
        email: string;
        name: string;
        phone: string;
        role: import("@prisma/client").$Enums.Role;
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
        role: import("@prisma/client").$Enums.Role;
        id: string;
        assignedHome: import("@prisma/client").$Enums.HomeAssignment;
        isActive: boolean;
        updatedAt: Date;
    }>;
    toggleActive(id: string): Promise<{
        email: string;
        name: string;
        phone: string;
        role: import("@prisma/client").$Enums.Role;
        id: string;
        isActive: boolean;
    }>;
    resetPassword(id: string, newPassword: string): Promise<{
        message: string;
    }>;
    reassignPhone(fromUserId: string, toUserId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    deleteUser(id: string): Promise<{
        email: string;
        name: string;
        role: import("@prisma/client").$Enums.Role;
        id: string;
        isActive: boolean;
    }>;
}
export {};
