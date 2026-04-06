import { PrismaService } from '../prisma/prisma.service';
export declare class TaskTemplatesService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(includeInactive?: boolean): Promise<any>;
    findOne(id: string): Promise<any>;
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
    }, createdById: string): Promise<any>;
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
    }): Promise<any>;
    delete(id: string): Promise<any>;
    addItem(templateId: string, itemText: string, orderIndex?: number): Promise<any>;
    updateItem(itemId: string, data: {
        itemText?: string;
        orderIndex?: number;
    }): Promise<any>;
    deleteItem(itemId: string): Promise<any>;
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
        templates: any;
    }>;
    markOverdueMissed(): Promise<{
        marked: any;
    }>;
    getPerformanceAll(days?: number): Promise<any[]>;
    getAccountabilityScore(userId: string, days?: number): Promise<{
        userId: string;
        days: number;
        assigned: any;
        completed: any;
        missed: any;
        onTime: any;
        score: number;
        grade: string;
        avgMinutesTaken: number;
    }>;
}
