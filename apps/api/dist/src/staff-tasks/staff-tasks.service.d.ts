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
        items: ({
            createdBy: {
                name: string;
                id: string;
            };
            assignedTo: {
                email: string;
                name: string;
                id: string;
            };
            linkedDonor: {
                id: string;
                donorCode: string;
                firstName: string;
                lastName: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            priority: import(".prisma/client").$Enums.TaskPriority;
            status: import(".prisma/client").$Enums.TaskStatus;
            templateId: string | null;
            description: string | null;
            createdById: string;
            deletedAt: Date | null;
            title: string;
            dueDate: Date | null;
            completedAt: Date | null;
            notes: string | null;
            category: import(".prisma/client").$Enums.TaskCategory;
            assignedToId: string;
            linkedDonorId: string | null;
            startedAt: Date | null;
            instructions: string | null;
            completionNotes: string | null;
            estimatedMinutes: number | null;
            taskType: import(".prisma/client").$Enums.StaffTaskType;
            isRecurring: boolean;
            isRecurringInstance: boolean;
            recurrenceType: import(".prisma/client").$Enums.RecurrenceType;
            parentTaskId: string | null;
            checklist: import("@prisma/client/runtime/library").JsonValue | null;
            minutesTaken: number | null;
            missedAt: Date | null;
            delayDays: number | null;
            reminderBefore: number | null;
            escalationLevel: number | null;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findOne(id: string): Promise<{
        createdBy: {
            name: string;
            id: string;
        };
        assignedTo: {
            email: string;
            name: string;
            id: string;
        };
        linkedDonor: {
            id: string;
            donorCode: string;
            firstName: string;
            lastName: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        priority: import(".prisma/client").$Enums.TaskPriority;
        status: import(".prisma/client").$Enums.TaskStatus;
        templateId: string | null;
        description: string | null;
        createdById: string;
        deletedAt: Date | null;
        title: string;
        dueDate: Date | null;
        completedAt: Date | null;
        notes: string | null;
        category: import(".prisma/client").$Enums.TaskCategory;
        assignedToId: string;
        linkedDonorId: string | null;
        startedAt: Date | null;
        instructions: string | null;
        completionNotes: string | null;
        estimatedMinutes: number | null;
        taskType: import(".prisma/client").$Enums.StaffTaskType;
        isRecurring: boolean;
        isRecurringInstance: boolean;
        recurrenceType: import(".prisma/client").$Enums.RecurrenceType;
        parentTaskId: string | null;
        checklist: import("@prisma/client/runtime/library").JsonValue | null;
        minutesTaken: number | null;
        missedAt: Date | null;
        delayDays: number | null;
        reminderBefore: number | null;
        escalationLevel: number | null;
    }>;
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
        instructions?: string;
        estimatedMinutes?: number;
    }, userId: string): Promise<{
        createdBy: {
            name: string;
            id: string;
        };
        assignedTo: {
            email: string;
            name: string;
            id: string;
        };
        linkedDonor: {
            id: string;
            donorCode: string;
            firstName: string;
            lastName: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        priority: import(".prisma/client").$Enums.TaskPriority;
        status: import(".prisma/client").$Enums.TaskStatus;
        templateId: string | null;
        description: string | null;
        createdById: string;
        deletedAt: Date | null;
        title: string;
        dueDate: Date | null;
        completedAt: Date | null;
        notes: string | null;
        category: import(".prisma/client").$Enums.TaskCategory;
        assignedToId: string;
        linkedDonorId: string | null;
        startedAt: Date | null;
        instructions: string | null;
        completionNotes: string | null;
        estimatedMinutes: number | null;
        taskType: import(".prisma/client").$Enums.StaffTaskType;
        isRecurring: boolean;
        isRecurringInstance: boolean;
        recurrenceType: import(".prisma/client").$Enums.RecurrenceType;
        parentTaskId: string | null;
        checklist: import("@prisma/client/runtime/library").JsonValue | null;
        minutesTaken: number | null;
        missedAt: Date | null;
        delayDays: number | null;
        reminderBefore: number | null;
        escalationLevel: number | null;
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
        instructions?: string;
        completionNotes?: string;
        estimatedMinutes?: number | null;
    }, userId: string): Promise<{
        createdBy: {
            name: string;
            id: string;
        };
        assignedTo: {
            email: string;
            name: string;
            id: string;
        };
        linkedDonor: {
            id: string;
            donorCode: string;
            firstName: string;
            lastName: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        priority: import(".prisma/client").$Enums.TaskPriority;
        status: import(".prisma/client").$Enums.TaskStatus;
        templateId: string | null;
        description: string | null;
        createdById: string;
        deletedAt: Date | null;
        title: string;
        dueDate: Date | null;
        completedAt: Date | null;
        notes: string | null;
        category: import(".prisma/client").$Enums.TaskCategory;
        assignedToId: string;
        linkedDonorId: string | null;
        startedAt: Date | null;
        instructions: string | null;
        completionNotes: string | null;
        estimatedMinutes: number | null;
        taskType: import(".prisma/client").$Enums.StaffTaskType;
        isRecurring: boolean;
        isRecurringInstance: boolean;
        recurrenceType: import(".prisma/client").$Enums.RecurrenceType;
        parentTaskId: string | null;
        checklist: import("@prisma/client/runtime/library").JsonValue | null;
        minutesTaken: number | null;
        missedAt: Date | null;
        delayDays: number | null;
        reminderBefore: number | null;
        escalationLevel: number | null;
    }>;
    delete(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        priority: import(".prisma/client").$Enums.TaskPriority;
        status: import(".prisma/client").$Enums.TaskStatus;
        templateId: string | null;
        description: string | null;
        createdById: string;
        deletedAt: Date | null;
        title: string;
        dueDate: Date | null;
        completedAt: Date | null;
        notes: string | null;
        category: import(".prisma/client").$Enums.TaskCategory;
        assignedToId: string;
        linkedDonorId: string | null;
        startedAt: Date | null;
        instructions: string | null;
        completionNotes: string | null;
        estimatedMinutes: number | null;
        taskType: import(".prisma/client").$Enums.StaffTaskType;
        isRecurring: boolean;
        isRecurringInstance: boolean;
        recurrenceType: import(".prisma/client").$Enums.RecurrenceType;
        parentTaskId: string | null;
        checklist: import("@prisma/client/runtime/library").JsonValue | null;
        minutesTaken: number | null;
        missedAt: Date | null;
        delayDays: number | null;
        reminderBefore: number | null;
        escalationLevel: number | null;
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
        email: string;
        name: string;
        role: import(".prisma/client").$Enums.Role;
        id: string;
    }[]>;
    getStaffPerformance(userId: string, year?: number): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        updatedAt: Date;
        month: number;
        score: number;
        year: number;
        tasksAssigned: number;
        tasksCompleted: number;
        tasksOnTime: number;
        tasksOverdue: number;
        followUpsDone: number;
        donorResponses: number;
    }[]>;
    calculatePerformance(userId: string, month: number, year: number): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        updatedAt: Date;
        month: number;
        score: number;
        year: number;
        tasksAssigned: number;
        tasksCompleted: number;
        tasksOnTime: number;
        tasksOverdue: number;
        followUpsDone: number;
        donorResponses: number;
    }>;
    getKanbanBoard(assignedToId?: string): Promise<{
        PENDING: ({
            createdBy: {
                name: string;
                id: string;
            };
            assignedTo: {
                email: string;
                name: string;
                id: string;
            };
            linkedDonor: {
                id: string;
                donorCode: string;
                firstName: string;
                lastName: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            priority: import(".prisma/client").$Enums.TaskPriority;
            status: import(".prisma/client").$Enums.TaskStatus;
            templateId: string | null;
            description: string | null;
            createdById: string;
            deletedAt: Date | null;
            title: string;
            dueDate: Date | null;
            completedAt: Date | null;
            notes: string | null;
            category: import(".prisma/client").$Enums.TaskCategory;
            assignedToId: string;
            linkedDonorId: string | null;
            startedAt: Date | null;
            instructions: string | null;
            completionNotes: string | null;
            estimatedMinutes: number | null;
            taskType: import(".prisma/client").$Enums.StaffTaskType;
            isRecurring: boolean;
            isRecurringInstance: boolean;
            recurrenceType: import(".prisma/client").$Enums.RecurrenceType;
            parentTaskId: string | null;
            checklist: import("@prisma/client/runtime/library").JsonValue | null;
            minutesTaken: number | null;
            missedAt: Date | null;
            delayDays: number | null;
            reminderBefore: number | null;
            escalationLevel: number | null;
        })[];
        IN_PROGRESS: ({
            createdBy: {
                name: string;
                id: string;
            };
            assignedTo: {
                email: string;
                name: string;
                id: string;
            };
            linkedDonor: {
                id: string;
                donorCode: string;
                firstName: string;
                lastName: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            priority: import(".prisma/client").$Enums.TaskPriority;
            status: import(".prisma/client").$Enums.TaskStatus;
            templateId: string | null;
            description: string | null;
            createdById: string;
            deletedAt: Date | null;
            title: string;
            dueDate: Date | null;
            completedAt: Date | null;
            notes: string | null;
            category: import(".prisma/client").$Enums.TaskCategory;
            assignedToId: string;
            linkedDonorId: string | null;
            startedAt: Date | null;
            instructions: string | null;
            completionNotes: string | null;
            estimatedMinutes: number | null;
            taskType: import(".prisma/client").$Enums.StaffTaskType;
            isRecurring: boolean;
            isRecurringInstance: boolean;
            recurrenceType: import(".prisma/client").$Enums.RecurrenceType;
            parentTaskId: string | null;
            checklist: import("@prisma/client/runtime/library").JsonValue | null;
            minutesTaken: number | null;
            missedAt: Date | null;
            delayDays: number | null;
            reminderBefore: number | null;
            escalationLevel: number | null;
        })[];
        COMPLETED: ({
            createdBy: {
                name: string;
                id: string;
            };
            assignedTo: {
                email: string;
                name: string;
                id: string;
            };
            linkedDonor: {
                id: string;
                donorCode: string;
                firstName: string;
                lastName: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            priority: import(".prisma/client").$Enums.TaskPriority;
            status: import(".prisma/client").$Enums.TaskStatus;
            templateId: string | null;
            description: string | null;
            createdById: string;
            deletedAt: Date | null;
            title: string;
            dueDate: Date | null;
            completedAt: Date | null;
            notes: string | null;
            category: import(".prisma/client").$Enums.TaskCategory;
            assignedToId: string;
            linkedDonorId: string | null;
            startedAt: Date | null;
            instructions: string | null;
            completionNotes: string | null;
            estimatedMinutes: number | null;
            taskType: import(".prisma/client").$Enums.StaffTaskType;
            isRecurring: boolean;
            isRecurringInstance: boolean;
            recurrenceType: import(".prisma/client").$Enums.RecurrenceType;
            parentTaskId: string | null;
            checklist: import("@prisma/client/runtime/library").JsonValue | null;
            minutesTaken: number | null;
            missedAt: Date | null;
            delayDays: number | null;
            reminderBefore: number | null;
            escalationLevel: number | null;
        })[];
        OVERDUE: ({
            createdBy: {
                name: string;
                id: string;
            };
            assignedTo: {
                email: string;
                name: string;
                id: string;
            };
            linkedDonor: {
                id: string;
                donorCode: string;
                firstName: string;
                lastName: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            priority: import(".prisma/client").$Enums.TaskPriority;
            status: import(".prisma/client").$Enums.TaskStatus;
            templateId: string | null;
            description: string | null;
            createdById: string;
            deletedAt: Date | null;
            title: string;
            dueDate: Date | null;
            completedAt: Date | null;
            notes: string | null;
            category: import(".prisma/client").$Enums.TaskCategory;
            assignedToId: string;
            linkedDonorId: string | null;
            startedAt: Date | null;
            instructions: string | null;
            completionNotes: string | null;
            estimatedMinutes: number | null;
            taskType: import(".prisma/client").$Enums.StaffTaskType;
            isRecurring: boolean;
            isRecurringInstance: boolean;
            recurrenceType: import(".prisma/client").$Enums.RecurrenceType;
            parentTaskId: string | null;
            checklist: import("@prisma/client/runtime/library").JsonValue | null;
            minutesTaken: number | null;
            missedAt: Date | null;
            delayDays: number | null;
            reminderBefore: number | null;
            escalationLevel: number | null;
        })[];
    }>;
    updateTaskStatus(id: string, newStatus: TaskStatus, userId: string, extra?: {
        minutesTaken?: number;
        startedAt?: string;
        completedAt?: string;
        notes?: string;
        completionNotes?: string;
    }): Promise<{
        createdBy: {
            name: string;
            id: string;
        };
        assignedTo: {
            email: string;
            name: string;
            id: string;
        };
        linkedDonor: {
            id: string;
            donorCode: string;
            firstName: string;
            lastName: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        priority: import(".prisma/client").$Enums.TaskPriority;
        status: import(".prisma/client").$Enums.TaskStatus;
        templateId: string | null;
        description: string | null;
        createdById: string;
        deletedAt: Date | null;
        title: string;
        dueDate: Date | null;
        completedAt: Date | null;
        notes: string | null;
        category: import(".prisma/client").$Enums.TaskCategory;
        assignedToId: string;
        linkedDonorId: string | null;
        startedAt: Date | null;
        instructions: string | null;
        completionNotes: string | null;
        estimatedMinutes: number | null;
        taskType: import(".prisma/client").$Enums.StaffTaskType;
        isRecurring: boolean;
        isRecurringInstance: boolean;
        recurrenceType: import(".prisma/client").$Enums.RecurrenceType;
        parentTaskId: string | null;
        checklist: import("@prisma/client/runtime/library").JsonValue | null;
        minutesTaken: number | null;
        missedAt: Date | null;
        delayDays: number | null;
        reminderBefore: number | null;
        escalationLevel: number | null;
    }>;
}
