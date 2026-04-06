import { StaffLeavesService } from './staff-leaves.service';
export declare class StaffLeavesController {
    private readonly service;
    constructor(service: StaffLeavesService);
    findAll(staffId?: string, status?: string, type?: string, year?: string, homeId?: string): Promise<any>;
    findByStaff(staffId: string, year?: string): Promise<any>;
    getSummary(staffId: string, year?: string): Promise<{
        staffId: string;
        year: number;
        approved: any;
        totalDays: any;
        byType: Record<string, number>;
    }>;
    create(body: {
        staffId: string;
        type: string;
        startDate: string;
        endDate: string;
        days: number;
        reason?: string;
    }): Promise<any>;
    updateStatus(id: string, body: {
        status: 'APPROVED' | 'REJECTED' | 'PENDING';
        notes?: string;
    }): Promise<any>;
    delete(id: string): Promise<any>;
}
