import { PrismaService } from '../prisma/prisma.service';
import { FollowUpPriority } from '@prisma/client';
export declare class FollowUpsService {
    private prisma;
    constructor(prisma: PrismaService);
    private readonly includeRelations;
    findAll(query: {
        status?: string;
        assignedToId?: string;
        donorId?: string;
        priority?: string;
        dueBefore?: string;
        dueAfter?: string;
        page?: number;
        limit?: number;
        userId: string;
        userRole: string;
    }): Promise<{
        items: ({
            donor: {
                id: string;
                donorCode: string;
                firstName: string;
                lastName: string;
                primaryPhone: string;
                personalEmail: string;
                officialEmail: string;
            };
            createdBy: {
                name: string;
                id: string;
            };
            assignedTo: {
                email: string;
                name: string;
                id: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            priority: import("@prisma/client").$Enums.FollowUpPriority;
            donorId: string;
            status: import("@prisma/client").$Enums.FollowUpStatus;
            createdById: string;
            isDeleted: boolean;
            dueDate: Date;
            completedAt: Date | null;
            note: string;
            assignedToId: string;
            completedNote: string | null;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findOne(id: string, userId?: string, userRole?: string): Promise<{
        donor: {
            id: string;
            donorCode: string;
            firstName: string;
            lastName: string;
            primaryPhone: string;
            personalEmail: string;
            officialEmail: string;
        };
        createdBy: {
            name: string;
            id: string;
        };
        assignedTo: {
            email: string;
            name: string;
            id: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        priority: import("@prisma/client").$Enums.FollowUpPriority;
        donorId: string;
        status: import("@prisma/client").$Enums.FollowUpStatus;
        createdById: string;
        isDeleted: boolean;
        dueDate: Date;
        completedAt: Date | null;
        note: string;
        assignedToId: string;
        completedNote: string | null;
    }>;
    create(data: {
        donorId: string;
        assignedToId: string;
        note: string;
        dueDate: string;
        priority?: FollowUpPriority;
        createdById: string;
    }): Promise<{
        donor: {
            id: string;
            donorCode: string;
            firstName: string;
            lastName: string;
            primaryPhone: string;
            personalEmail: string;
            officialEmail: string;
        };
        createdBy: {
            name: string;
            id: string;
        };
        assignedTo: {
            email: string;
            name: string;
            id: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        priority: import("@prisma/client").$Enums.FollowUpPriority;
        donorId: string;
        status: import("@prisma/client").$Enums.FollowUpStatus;
        createdById: string;
        isDeleted: boolean;
        dueDate: Date;
        completedAt: Date | null;
        note: string;
        assignedToId: string;
        completedNote: string | null;
    }>;
    update(id: string, data: {
        note?: string;
        dueDate?: string;
        priority?: FollowUpPriority;
        assignedToId?: string;
    }, userId: string, userRole: string): Promise<{
        donor: {
            id: string;
            donorCode: string;
            firstName: string;
            lastName: string;
            primaryPhone: string;
            personalEmail: string;
            officialEmail: string;
        };
        createdBy: {
            name: string;
            id: string;
        };
        assignedTo: {
            email: string;
            name: string;
            id: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        priority: import("@prisma/client").$Enums.FollowUpPriority;
        donorId: string;
        status: import("@prisma/client").$Enums.FollowUpStatus;
        createdById: string;
        isDeleted: boolean;
        dueDate: Date;
        completedAt: Date | null;
        note: string;
        assignedToId: string;
        completedNote: string | null;
    }>;
    markComplete(id: string, completedNote: string | null, userId: string, userRole: string): Promise<{
        donor: {
            id: string;
            donorCode: string;
            firstName: string;
            lastName: string;
            primaryPhone: string;
            personalEmail: string;
            officialEmail: string;
        };
        createdBy: {
            name: string;
            id: string;
        };
        assignedTo: {
            email: string;
            name: string;
            id: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        priority: import("@prisma/client").$Enums.FollowUpPriority;
        donorId: string;
        status: import("@prisma/client").$Enums.FollowUpStatus;
        createdById: string;
        isDeleted: boolean;
        dueDate: Date;
        completedAt: Date | null;
        note: string;
        assignedToId: string;
        completedNote: string | null;
    }>;
    reopen(id: string, userId: string, userRole: string): Promise<{
        donor: {
            id: string;
            donorCode: string;
            firstName: string;
            lastName: string;
            primaryPhone: string;
            personalEmail: string;
            officialEmail: string;
        };
        createdBy: {
            name: string;
            id: string;
        };
        assignedTo: {
            email: string;
            name: string;
            id: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        priority: import("@prisma/client").$Enums.FollowUpPriority;
        donorId: string;
        status: import("@prisma/client").$Enums.FollowUpStatus;
        createdById: string;
        isDeleted: boolean;
        dueDate: Date;
        completedAt: Date | null;
        note: string;
        assignedToId: string;
        completedNote: string | null;
    }>;
    remove(id: string, userId: string, userRole: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        priority: import("@prisma/client").$Enums.FollowUpPriority;
        donorId: string;
        status: import("@prisma/client").$Enums.FollowUpStatus;
        createdById: string;
        isDeleted: boolean;
        dueDate: Date;
        completedAt: Date | null;
        note: string;
        assignedToId: string;
        completedNote: string | null;
    }>;
    getDashboardStats(userId: string, userRole: string): Promise<{
        total: number;
        pending: number;
        completed: number;
        overdue: number;
        dueToday: number;
        dueThisWeek: number;
    }>;
}
