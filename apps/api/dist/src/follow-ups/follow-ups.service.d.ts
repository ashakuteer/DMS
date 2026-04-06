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
        items: any;
        total: any;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findOne(id: string, userId?: string, userRole?: string): Promise<any>;
    create(data: {
        donorId: string;
        assignedToId: string;
        note: string;
        dueDate: string;
        priority?: FollowUpPriority;
        createdById: string;
    }): Promise<any>;
    update(id: string, data: {
        note?: string;
        dueDate?: string;
        priority?: FollowUpPriority;
        assignedToId?: string;
    }, userId: string, userRole: string): Promise<any>;
    markComplete(id: string, completedNote: string | null, userId: string, userRole: string): Promise<any>;
    reopen(id: string, userId: string, userRole: string): Promise<any>;
    remove(id: string, userId: string, userRole: string): Promise<any>;
    getDashboardStats(userId: string, userRole: string): Promise<{
        total: any;
        pending: any;
        completed: any;
        overdue: any;
        dueToday: any;
        dueThisWeek: any;
    }>;
}
