import { StaffLeavesService } from './staff-leaves.service';
export declare class StaffLeavesController {
    private readonly service;
    constructor(service: StaffLeavesService);
    findAll(staffId?: string, status?: string, type?: string, year?: string, homeId?: string): Promise<({
        staff: {
            home: {
                name: string;
                id: string;
            };
            name: string;
            id: string;
            designation: string;
        };
    } & {
        id: string;
        createdAt: Date;
        reason: string | null;
        updatedAt: Date;
        days: number;
        startDate: Date;
        endDate: Date;
        type: string;
        status: string;
        notes: string | null;
        staffId: string;
    })[]>;
    findByStaff(staffId: string, year?: string): Promise<{
        id: string;
        createdAt: Date;
        reason: string | null;
        updatedAt: Date;
        days: number;
        startDate: Date;
        endDate: Date;
        type: string;
        status: string;
        notes: string | null;
        staffId: string;
    }[]>;
    getSummary(staffId: string, year?: string): Promise<{
        staffId: string;
        year: number;
        approved: number;
        totalDays: number;
        byType: Record<string, number>;
    }>;
    create(body: {
        staffId: string;
        type: string;
        startDate: string;
        endDate: string;
        days: number;
        reason?: string;
    }): Promise<{
        staff: {
            name: string;
            id: string;
            designation: string;
        };
    } & {
        id: string;
        createdAt: Date;
        reason: string | null;
        updatedAt: Date;
        days: number;
        startDate: Date;
        endDate: Date;
        type: string;
        status: string;
        notes: string | null;
        staffId: string;
    }>;
    updateStatus(id: string, body: {
        status: 'APPROVED' | 'REJECTED' | 'PENDING';
        notes?: string;
    }): Promise<{
        staff: {
            name: string;
            id: string;
        };
    } & {
        id: string;
        createdAt: Date;
        reason: string | null;
        updatedAt: Date;
        days: number;
        startDate: Date;
        endDate: Date;
        type: string;
        status: string;
        notes: string | null;
        staffId: string;
    }>;
    delete(id: string): Promise<{
        id: string;
        createdAt: Date;
        reason: string | null;
        updatedAt: Date;
        days: number;
        startDate: Date;
        endDate: Date;
        type: string;
        status: string;
        notes: string | null;
        staffId: string;
    }>;
}
