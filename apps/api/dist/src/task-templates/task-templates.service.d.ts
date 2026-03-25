import { PrismaService } from '../prisma/prisma.service';
export declare class TaskTemplatesService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(includeInactive?: boolean): Promise<({
        items: {
            id: string;
            orderIndex: number;
            itemText: string;
        }[];
        tasks: {
            id: string;
            createdAt: Date;
            status: import(".prisma/client").$Enums.TaskStatus;
        }[];
    } & {
        id: string;
        createdAt: Date;
        isActive: boolean;
        updatedAt: Date;
        priority: string;
        startDate: Date | null;
        description: string | null;
        createdById: string;
        title: string;
        category: string;
        nextDueDate: Date | null;
        assignedToId: string | null;
        instructions: string | null;
        estimatedMinutes: number | null;
        recurrenceType: string;
        reminderBefore: number | null;
        recurrenceRule: import("@prisma/client/runtime/library").JsonValue | null;
        assignedToRole: string | null;
    })[]>;
    findOne(id: string): Promise<{
        items: {
            id: string;
            orderIndex: number;
            itemText: string;
        }[];
        tasks: {
            id: string;
            createdAt: Date;
            status: import(".prisma/client").$Enums.TaskStatus;
            assignedTo: {
                name: string;
                id: string;
            };
        }[];
    } & {
        id: string;
        createdAt: Date;
        isActive: boolean;
        updatedAt: Date;
        priority: string;
        startDate: Date | null;
        description: string | null;
        createdById: string;
        title: string;
        category: string;
        nextDueDate: Date | null;
        assignedToId: string | null;
        instructions: string | null;
        estimatedMinutes: number | null;
        recurrenceType: string;
        reminderBefore: number | null;
        recurrenceRule: import("@prisma/client/runtime/library").JsonValue | null;
        assignedToRole: string | null;
    }>;
    create(data: {
        title: string;
        description?: string;
        recurrenceType: string;
        recurrenceRule?: any;
        category: string;
        priority: string;
        assignedToRole?: string;
        assignedToId?: string;
        estimatedMinutes?: number;
        instructions?: string;
        startDate?: string;
        reminderBefore?: number;
    }, createdById: string): Promise<{
        id: string;
        createdAt: Date;
        isActive: boolean;
        updatedAt: Date;
        priority: string;
        startDate: Date | null;
        description: string | null;
        createdById: string;
        title: string;
        category: string;
        nextDueDate: Date | null;
        assignedToId: string | null;
        instructions: string | null;
        estimatedMinutes: number | null;
        recurrenceType: string;
        reminderBefore: number | null;
        recurrenceRule: import("@prisma/client/runtime/library").JsonValue | null;
        assignedToRole: string | null;
    }>;
    update(id: string, data: {
        title?: string;
        description?: string;
        recurrenceType?: string;
        recurrenceRule?: any;
        category?: string;
        priority?: string;
        assignedToRole?: string;
        assignedToId?: string;
        estimatedMinutes?: number | null;
        instructions?: string | null;
        startDate?: string | null;
        nextDueDate?: string | null;
        reminderBefore?: number | null;
        isActive?: boolean;
    }): Promise<{
        id: string;
        createdAt: Date;
        isActive: boolean;
        updatedAt: Date;
        priority: string;
        startDate: Date | null;
        description: string | null;
        createdById: string;
        title: string;
        category: string;
        nextDueDate: Date | null;
        assignedToId: string | null;
        instructions: string | null;
        estimatedMinutes: number | null;
        recurrenceType: string;
        reminderBefore: number | null;
        recurrenceRule: import("@prisma/client/runtime/library").JsonValue | null;
        assignedToRole: string | null;
    }>;
    delete(id: string): Promise<{
        id: string;
        createdAt: Date;
        isActive: boolean;
        updatedAt: Date;
        priority: string;
        startDate: Date | null;
        description: string | null;
        createdById: string;
        title: string;
        category: string;
        nextDueDate: Date | null;
        assignedToId: string | null;
        instructions: string | null;
        estimatedMinutes: number | null;
        recurrenceType: string;
        reminderBefore: number | null;
        recurrenceRule: import("@prisma/client/runtime/library").JsonValue | null;
        assignedToRole: string | null;
    }>;
    addItem(templateId: string, itemText: string, orderIndex?: number): Promise<{
        id: string;
        createdAt: Date;
        templateId: string;
        orderIndex: number;
        itemText: string;
    }>;
    updateItem(itemId: string, data: {
        itemText?: string;
        orderIndex?: number;
    }): Promise<{
        id: string;
        createdAt: Date;
        templateId: string;
        orderIndex: number;
        itemText: string;
    }>;
    deleteItem(itemId: string): Promise<{
        id: string;
        createdAt: Date;
        templateId: string;
        orderIndex: number;
        itemText: string;
    }>;
    generateTasks(templateId: string, options: {
        forDate?: string;
        targetUserIds?: string[];
        createdById: string;
    }): Promise<{
        generated: number;
        message: string;
        total?: undefined;
        taskIds?: undefined;
    } | {
        generated: number;
        total: number;
        taskIds: string[];
        message?: undefined;
    }>;
    private shouldGenerateToday;
    private computeNextDueDate;
    generateTodayForAll(createdById: string): Promise<{
        generated: number;
        skipped: number;
        templates: number;
    }>;
    markOverdueMissed(): Promise<{
        marked: number;
    }>;
    getPerformanceAll(days?: number): Promise<{
        rank: number;
        isTopPerformer: boolean;
        userId: string;
        name: string;
        email: string;
        role: import(".prisma/client").$Enums.Role;
        total: number;
        completed: number;
        missed: number;
        onTime: number;
        completionRate: number;
        efficiencyScore: number;
        avgMinutesTaken: number;
        score: number;
        statusLevel: string;
        insight: string;
    }[]>;
    getAccountabilityScore(userId: string, days?: number): Promise<{
        userId: string;
        days: number;
        assigned: number;
        completed: number;
        missed: number;
        onTime: number;
        score: number;
        grade: string;
        avgMinutesTaken: number;
    }>;
}
