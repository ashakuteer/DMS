import { PrismaService } from '../prisma/prisma.service';
import { TaskStatus, TaskPriority, TaskCategory, StaffTaskType } from '@prisma/client';
export declare class StaffTasksService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    private readonly includeRelations;
    findAll(query: {
        status?: string;
        priority?: string;
        assignedToId?: string;
        createdById?: string;
        category?: string;
        search?: string;
        page?: number;
        limit?: number;
        isRecurring?: boolean;
        taskType?: string;
        excludePersonal?: boolean;
    }): Promise<{
        items: any;
        total: any;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findOne(id: string): Promise<any>;
    create(data: {
        title: string;
        description?: string;
        status?: TaskStatus;
        priority?: TaskPriority;
        category?: TaskCategory;
        taskType?: StaffTaskType;
        assignedToId: string;
        linkedDonorId?: string;
        dueDate?: string;
        notes?: string;
    }, userId: string): Promise<any>;
    update(id: string, data: {
        title?: string;
        description?: string;
        status?: TaskStatus;
        priority?: TaskPriority;
        category?: TaskCategory;
        assignedToId?: string;
        linkedDonorId?: string;
        dueDate?: string;
        notes?: string;
    }, userId: string): Promise<any>;
    delete(id: string): Promise<any>;
    getStats(userId?: string): Promise<{
        pending: any;
        inProgress: any;
        completed: any;
        overdue: any;
        total: any;
    }>;
    getStaffList(): Promise<any[]>;
    getStaffPerformance(userId: string, year?: number): Promise<any>;
    calculatePerformance(userId: string, month: number, year: number): Promise<any>;
    getKanbanBoard(assignedToId?: string): Promise<{
        PENDING: any;
        IN_PROGRESS: any;
        COMPLETED: any;
        OVERDUE: any;
    }>;
    updateTaskStatus(id: string, newStatus: TaskStatus, userId: string, extra?: {
        minutesTaken?: number;
        startedAt?: string;
        completedAt?: string;
        notes?: string;
    }): Promise<any>;
}
