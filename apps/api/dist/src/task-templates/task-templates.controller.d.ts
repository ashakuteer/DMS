import { TaskTemplatesService } from './task-templates.service';
export declare class TaskTemplatesController {
    private readonly service;
    constructor(service: TaskTemplatesService);
    findAll(includeInactive?: string): Promise<({
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
    getPerformanceAll(days?: string, req?: any): Promise<{
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
    getAccountabilityScore(userId: string, days?: string): Promise<{
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
    generateToday(req: any): Promise<{
        generated: number;
        skipped: number;
        templates: number;
    }>;
    create(body: any, req: any): Promise<{
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
    generateTasks(id: string, body: {
        forDate?: string;
        targetUserIds?: string[];
    }, req: any): Promise<{
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
    markOverdueMissed(): Promise<{
        marked: number;
    }>;
    update(id: string, body: any): Promise<{
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
    addItem(id: string, body: {
        itemText: string;
        orderIndex?: number;
    }): Promise<{
        id: string;
        createdAt: Date;
        templateId: string;
        orderIndex: number;
        itemText: string;
    }>;
    updateItem(_id: string, itemId: string, body: {
        itemText?: string;
        orderIndex?: number;
    }): Promise<{
        id: string;
        createdAt: Date;
        templateId: string;
        orderIndex: number;
        itemText: string;
    }>;
    deleteItem(_id: string, itemId: string): Promise<{
        id: string;
        createdAt: Date;
        templateId: string;
        orderIndex: number;
        itemText: string;
    }>;
}
