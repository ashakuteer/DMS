import { PrismaService } from '../prisma/prisma.service';
import { TaskStatus, TaskPriority, TaskCategory } from '@prisma/client';
export declare class StaffTasksService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    private readonly includeRelations;
    findAll(query: {
        status?: string;
        priority?: string;
        assignedToId?: string;
        category?: string;
        search?: string;
        page?: number;
        limit?: number;
        isRecurring?: boolean;
    }): Promise<{
        items: ({
            assignedTo: {
                id: string;
                email: string;
                name: string;
            };
            createdBy: {
                id: string;
                name: string;
            };
            linkedDonor: {
                id: string;
                donorCode: string;
                firstName: string;
                lastName: string;
            };
        } & {
            id: string;
            title: string;
            description: string | null;
            status: import(".prisma/client").$Enums.TaskStatus;
            priority: import(".prisma/client").$Enums.TaskPriority;
            category: import(".prisma/client").$Enums.TaskCategory;
            assignedToId: string;
            createdById: string;
            linkedDonorId: string | null;
            dueDate: Date | null;
            startedAt: Date | null;
            completedAt: Date | null;
            notes: string | null;
            isRecurring: boolean;
            recurrenceType: import(".prisma/client").$Enums.RecurrenceType;
            parentTaskId: string | null;
            checklist: import("@prisma/client/runtime/library").JsonValue | null;
            templateId: string | null;
            minutesTaken: number | null;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findOne(id: string): Promise<{
        assignedTo: {
            id: string;
            email: string;
            name: string;
        };
        createdBy: {
            id: string;
            name: string;
        };
        linkedDonor: {
            id: string;
            donorCode: string;
            firstName: string;
            lastName: string;
        };
    } & {
        id: string;
        title: string;
        description: string | null;
        status: import(".prisma/client").$Enums.TaskStatus;
        priority: import(".prisma/client").$Enums.TaskPriority;
        category: import(".prisma/client").$Enums.TaskCategory;
        assignedToId: string;
        createdById: string;
        linkedDonorId: string | null;
        dueDate: Date | null;
        startedAt: Date | null;
        completedAt: Date | null;
        notes: string | null;
        isRecurring: boolean;
        recurrenceType: import(".prisma/client").$Enums.RecurrenceType;
        parentTaskId: string | null;
        checklist: import("@prisma/client/runtime/library").JsonValue | null;
        templateId: string | null;
        minutesTaken: number | null;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
    }>;
    create(data: {
        title: string;
        description?: string;
        status?: TaskStatus;
        priority?: TaskPriority;
        category?: TaskCategory;
        assignedToId: string;
        linkedDonorId?: string;
        dueDate?: string;
        notes?: string;
    }, userId: string): Promise<{
        assignedTo: {
            id: string;
            email: string;
            name: string;
        };
        createdBy: {
            id: string;
            name: string;
        };
        linkedDonor: {
            id: string;
            donorCode: string;
            firstName: string;
            lastName: string;
        };
    } & {
        id: string;
        title: string;
        description: string | null;
        status: import(".prisma/client").$Enums.TaskStatus;
        priority: import(".prisma/client").$Enums.TaskPriority;
        category: import(".prisma/client").$Enums.TaskCategory;
        assignedToId: string;
        createdById: string;
        linkedDonorId: string | null;
        dueDate: Date | null;
        startedAt: Date | null;
        completedAt: Date | null;
        notes: string | null;
        isRecurring: boolean;
        recurrenceType: import(".prisma/client").$Enums.RecurrenceType;
        parentTaskId: string | null;
        checklist: import("@prisma/client/runtime/library").JsonValue | null;
        templateId: string | null;
        minutesTaken: number | null;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
    }>;
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
    }, userId: string): Promise<{
        assignedTo: {
            id: string;
            email: string;
            name: string;
        };
        createdBy: {
            id: string;
            name: string;
        };
        linkedDonor: {
            id: string;
            donorCode: string;
            firstName: string;
            lastName: string;
        };
    } & {
        id: string;
        title: string;
        description: string | null;
        status: import(".prisma/client").$Enums.TaskStatus;
        priority: import(".prisma/client").$Enums.TaskPriority;
        category: import(".prisma/client").$Enums.TaskCategory;
        assignedToId: string;
        createdById: string;
        linkedDonorId: string | null;
        dueDate: Date | null;
        startedAt: Date | null;
        completedAt: Date | null;
        notes: string | null;
        isRecurring: boolean;
        recurrenceType: import(".prisma/client").$Enums.RecurrenceType;
        parentTaskId: string | null;
        checklist: import("@prisma/client/runtime/library").JsonValue | null;
        templateId: string | null;
        minutesTaken: number | null;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
    }>;
    delete(id: string): Promise<{
        id: string;
        title: string;
        description: string | null;
        status: import(".prisma/client").$Enums.TaskStatus;
        priority: import(".prisma/client").$Enums.TaskPriority;
        category: import(".prisma/client").$Enums.TaskCategory;
        assignedToId: string;
        createdById: string;
        linkedDonorId: string | null;
        dueDate: Date | null;
        startedAt: Date | null;
        completedAt: Date | null;
        notes: string | null;
        isRecurring: boolean;
        recurrenceType: import(".prisma/client").$Enums.RecurrenceType;
        parentTaskId: string | null;
        checklist: import("@prisma/client/runtime/library").JsonValue | null;
        templateId: string | null;
        minutesTaken: number | null;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
    }>;
    getStats(userId?: string): Promise<{
        pending: number;
        inProgress: number;
        completed: number;
        overdue: number;
        total: number;
    }>;
    getStaffList(): Promise<{
        taskStats: {
            assigned: number;
            completed: number;
            overdue: number;
        };
        latestPerformanceScore: number;
        id: string;
        email: string;
        name: string;
        role: import(".prisma/client").$Enums.Role;
    }[]>;
    getStaffPerformance(userId: string, year?: number): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        month: number;
        year: number;
        tasksAssigned: number;
        tasksCompleted: number;
        tasksOnTime: number;
        tasksOverdue: number;
        followUpsDone: number;
        donorResponses: number;
        score: number;
    }[]>;
    calculatePerformance(userId: string, month: number, year: number): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        month: number;
        year: number;
        tasksAssigned: number;
        tasksCompleted: number;
        tasksOnTime: number;
        tasksOverdue: number;
        followUpsDone: number;
        donorResponses: number;
        score: number;
    }>;
    getKanbanBoard(assignedToId?: string): Promise<{
        PENDING: ({
            assignedTo: {
                id: string;
                email: string;
                name: string;
            };
            createdBy: {
                id: string;
                name: string;
            };
            linkedDonor: {
                id: string;
                donorCode: string;
                firstName: string;
                lastName: string;
            };
        } & {
            id: string;
            title: string;
            description: string | null;
            status: import(".prisma/client").$Enums.TaskStatus;
            priority: import(".prisma/client").$Enums.TaskPriority;
            category: import(".prisma/client").$Enums.TaskCategory;
            assignedToId: string;
            createdById: string;
            linkedDonorId: string | null;
            dueDate: Date | null;
            startedAt: Date | null;
            completedAt: Date | null;
            notes: string | null;
            isRecurring: boolean;
            recurrenceType: import(".prisma/client").$Enums.RecurrenceType;
            parentTaskId: string | null;
            checklist: import("@prisma/client/runtime/library").JsonValue | null;
            templateId: string | null;
            minutesTaken: number | null;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
        })[];
        IN_PROGRESS: ({
            assignedTo: {
                id: string;
                email: string;
                name: string;
            };
            createdBy: {
                id: string;
                name: string;
            };
            linkedDonor: {
                id: string;
                donorCode: string;
                firstName: string;
                lastName: string;
            };
        } & {
            id: string;
            title: string;
            description: string | null;
            status: import(".prisma/client").$Enums.TaskStatus;
            priority: import(".prisma/client").$Enums.TaskPriority;
            category: import(".prisma/client").$Enums.TaskCategory;
            assignedToId: string;
            createdById: string;
            linkedDonorId: string | null;
            dueDate: Date | null;
            startedAt: Date | null;
            completedAt: Date | null;
            notes: string | null;
            isRecurring: boolean;
            recurrenceType: import(".prisma/client").$Enums.RecurrenceType;
            parentTaskId: string | null;
            checklist: import("@prisma/client/runtime/library").JsonValue | null;
            templateId: string | null;
            minutesTaken: number | null;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
        })[];
        COMPLETED: ({
            assignedTo: {
                id: string;
                email: string;
                name: string;
            };
            createdBy: {
                id: string;
                name: string;
            };
            linkedDonor: {
                id: string;
                donorCode: string;
                firstName: string;
                lastName: string;
            };
        } & {
            id: string;
            title: string;
            description: string | null;
            status: import(".prisma/client").$Enums.TaskStatus;
            priority: import(".prisma/client").$Enums.TaskPriority;
            category: import(".prisma/client").$Enums.TaskCategory;
            assignedToId: string;
            createdById: string;
            linkedDonorId: string | null;
            dueDate: Date | null;
            startedAt: Date | null;
            completedAt: Date | null;
            notes: string | null;
            isRecurring: boolean;
            recurrenceType: import(".prisma/client").$Enums.RecurrenceType;
            parentTaskId: string | null;
            checklist: import("@prisma/client/runtime/library").JsonValue | null;
            templateId: string | null;
            minutesTaken: number | null;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
        })[];
        OVERDUE: ({
            assignedTo: {
                id: string;
                email: string;
                name: string;
            };
            createdBy: {
                id: string;
                name: string;
            };
            linkedDonor: {
                id: string;
                donorCode: string;
                firstName: string;
                lastName: string;
            };
        } & {
            id: string;
            title: string;
            description: string | null;
            status: import(".prisma/client").$Enums.TaskStatus;
            priority: import(".prisma/client").$Enums.TaskPriority;
            category: import(".prisma/client").$Enums.TaskCategory;
            assignedToId: string;
            createdById: string;
            linkedDonorId: string | null;
            dueDate: Date | null;
            startedAt: Date | null;
            completedAt: Date | null;
            notes: string | null;
            isRecurring: boolean;
            recurrenceType: import(".prisma/client").$Enums.RecurrenceType;
            parentTaskId: string | null;
            checklist: import("@prisma/client/runtime/library").JsonValue | null;
            templateId: string | null;
            minutesTaken: number | null;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
        })[];
    }>;
    updateTaskStatus(id: string, newStatus: TaskStatus, userId: string, extra?: {
        minutesTaken?: number;
        startedAt?: string;
        completedAt?: string;
        notes?: string;
    }): Promise<{
        assignedTo: {
            id: string;
            email: string;
            name: string;
        };
        createdBy: {
            id: string;
            name: string;
        };
        linkedDonor: {
            id: string;
            donorCode: string;
            firstName: string;
            lastName: string;
        };
    } & {
        id: string;
        title: string;
        description: string | null;
        status: import(".prisma/client").$Enums.TaskStatus;
        priority: import(".prisma/client").$Enums.TaskPriority;
        category: import(".prisma/client").$Enums.TaskCategory;
        assignedToId: string;
        createdById: string;
        linkedDonorId: string | null;
        dueDate: Date | null;
        startedAt: Date | null;
        completedAt: Date | null;
        notes: string | null;
        isRecurring: boolean;
        recurrenceType: import(".prisma/client").$Enums.RecurrenceType;
        parentTaskId: string | null;
        checklist: import("@prisma/client/runtime/library").JsonValue | null;
        templateId: string | null;
        minutesTaken: number | null;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
    }>;
}
