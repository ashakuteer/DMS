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
    listStaff(): Promise<any>;
    listAllStaff(): Promise<any>;
    createStaff(data: Record<string, any>): Promise<any>;
    findAll(page?: string, limit?: string): Promise<{
        items: any;
        total: any;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findOne(id: string): Promise<any>;
    updateRole(id: string, role: Role, user: UserContext, req: Request): Promise<any>;
    updateUser(id: string, data: {
        name?: string;
        phone?: string;
        role?: Role;
    }): Promise<any>;
    toggleActive(id: string): Promise<any>;
    resetPassword(id: string, newPassword: string): Promise<{
        message: string;
    }>;
    reassignPhone(fromUserId: string, toUserId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    deleteUser(id: string): Promise<any>;
}
export {};
