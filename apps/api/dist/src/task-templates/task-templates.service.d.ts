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
        description: string | null;
        createdById: string;
        title: string;
        category: string;
        assignedToId: string | null;
        recurrenceType: string;
        assignedToRole: string | null;
    })[]>;
    findOne(id: string): Promise<{
        items: {
            id: string;
            createdAt: Date;
            templateId: string;
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
        description: string | null;
        createdById: string;
        title: string;
        category: string;
        assignedToId: string | null;
        recurrenceType: string;
        assignedToRole: string | null;
    }>;
    create(data: {
        title: string;
        description?: string;
        recurrenceType: string;
        category: string;
        priority: string;
        assignedToRole?: string;
        assignedToId?: string;
    }, createdById: string): Promise<{
        id: string;
        createdAt: Date;
        isActive: boolean;
        updatedAt: Date;
        priority: string;
        description: string | null;
        createdById: string;
        title: string;
        category: string;
        assignedToId: string | null;
        recurrenceType: string;
        assignedToRole: string | null;
    }>;
    update(id: string, data: {
        title?: string;
        description?: string;
        recurrenceType?: string;
        category?: string;
        priority?: string;
        assignedToRole?: string;
        assignedToId?: string;
        isActive?: boolean;
    }): Promise<{
        id: string;
        createdAt: Date;
        isActive: boolean;
        updatedAt: Date;
        priority: string;
        description: string | null;
        createdById: string;
        title: string;
        category: string;
        assignedToId: string | null;
        recurrenceType: string;
        assignedToRole: string | null;
    }>;
    delete(id: string): Promise<{
        id: string;
        createdAt: Date;
        isActive: boolean;
        updatedAt: Date;
        priority: string;
        description: string | null;
        createdById: string;
        title: string;
        category: string;
        assignedToId: string | null;
        recurrenceType: string;
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
        onTime: number;
        completionRate: number;
        timelinessScore: number;
        efficiencyScore: number;
        avgMinutesTaken: number;
        score: number;
        grade: string;
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
