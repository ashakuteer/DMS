import { FollowUpsService } from './follow-ups.service';
export declare class FollowUpsController {
    private followUpsService;
    constructor(followUpsService: FollowUpsService);
    findAll(status: string, assignedToId: string, donorId: string, priority: string, dueBefore: string, dueAfter: string, page: string, limit: string, req: any): Promise<{
        items: any;
        total: any;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    getStats(req: any): Promise<{
        total: any;
        pending: any;
        completed: any;
        overdue: any;
        dueToday: any;
        dueThisWeek: any;
    }>;
    findOne(id: string, req: any): Promise<any>;
    create(body: any, req: any): Promise<any>;
    update(id: string, body: any, req: any): Promise<any>;
    markComplete(id: string, body: any, req: any): Promise<any>;
    reopen(id: string, req: any): Promise<any>;
    remove(id: string, req: any): Promise<any>;
}
