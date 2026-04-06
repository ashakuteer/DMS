import { StaffTasksService } from './staff-tasks.service';
export declare class StaffTasksController {
    private staffTasksService;
    constructor(staffTasksService: StaffTasksService);
    private isAdminOrManager;
    findAll(status: string, priority: string, assignedToId: string, createdById: string, category: string, search: string, page: string, limit: string, isRecurring: string, taskType: string, excludePersonal: string, req: any): Promise<{
        items: any;
        total: any;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    getStats(userId: string, req: any): Promise<{
        pending: any;
        inProgress: any;
        completed: any;
        overdue: any;
        total: any;
    }>;
    getStaffList(): Promise<any[]>;
    getStaffPerformance(userId: string, year: string): Promise<any>;
    getKanbanBoard(assignedToId: string, req: any): Promise<{
        PENDING: any;
        IN_PROGRESS: any;
        COMPLETED: any;
        OVERDUE: any;
    }>;
    findOne(id: string, req: any): Promise<any>;
    create(body: any, req: any): Promise<any>;
    update(id: string, body: any, req: any): Promise<any>;
    updateStatus(id: string, body: any, req: any): Promise<any>;
    remove(id: string): Promise<any>;
    calculatePerformance(body: any): Promise<any>;
}
