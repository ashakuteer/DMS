import { TaskTemplatesService } from './task-templates.service';
export declare class TaskTemplatesController {
    private readonly service;
    constructor(service: TaskTemplatesService);
    findAll(includeInactive?: string): Promise<any>;
    getPerformanceAll(days?: string, req?: any): Promise<any[]>;
    getAccountabilityScore(userId: string, days?: string): Promise<{
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
    findOne(id: string): Promise<any>;
    generateToday(req: any): Promise<{
        generated: number;
        skipped: number;
        templates: any;
    }>;
    create(body: any, req: any): Promise<any>;
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
        marked: any;
    }>;
    update(id: string, body: any): Promise<any>;
    delete(id: string): Promise<any>;
    addItem(id: string, body: {
        itemText: string;
        orderIndex?: number;
    }): Promise<any>;
    updateItem(_id: string, itemId: string, body: {
        itemText?: string;
        orderIndex?: number;
    }): Promise<any>;
    deleteItem(_id: string, itemId: string): Promise<any>;
}
