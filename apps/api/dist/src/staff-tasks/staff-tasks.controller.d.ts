import { StaffTasksService } from './staff-tasks.service';
export declare class StaffTasksController {
    private staffTasksService;
    constructor(staffTasksService: StaffTasksService);
    private isAdminOrManager;
    findAll(status: string, priority: string, assignedToId: string, createdById: string, category: string, search: string, page: string, limit: string, isRecurring: string, req: any): Promise<{
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
    getStats(userId: string, req: any): Promise<{
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
    getStaffPerformance(userId: string, year: string): Promise<{
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
    getKanbanBoard(assignedToId: string, req: any): Promise<{
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
    findOne(id: string, req: any): Promise<{
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
    create(body: any, req: any): Promise<{
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
    update(id: string, body: any, req: any): Promise<{
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
    updateStatus(id: string, body: any, req: any): Promise<{
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
    remove(id: string): Promise<{
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
    calculatePerformance(body: any): Promise<{
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
}
