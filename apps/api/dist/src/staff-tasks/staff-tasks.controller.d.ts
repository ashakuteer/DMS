import { StaffTasksService } from './staff-tasks.service';
export declare class StaffTasksController {
    private staffTasksService;
    constructor(staffTasksService: StaffTasksService);
    private isAdminOrManager;
    findAll(status: string, priority: string, assignedToId: string, category: string, search: string, page: string, limit: string, isRecurring: string, req: any): Promise<{
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
        id: string;
        email: string;
        name: string;
        role: import(".prisma/client").$Enums.Role;
    }[]>;
    getStaffPerformance(userId: string, year: string): Promise<{
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
    getKanbanBoard(assignedToId: string, req: any): Promise<{
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
    findOne(id: string, req: any): Promise<{
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
    create(body: any, req: any): Promise<{
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
    update(id: string, body: any, req: any): Promise<{
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
    updateStatus(id: string, body: any, req: any): Promise<{
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
    remove(id: string): Promise<{
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
    calculatePerformance(body: any): Promise<{
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
}
