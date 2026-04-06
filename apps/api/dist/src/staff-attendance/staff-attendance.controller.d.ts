import { StaffAttendanceService } from './staff-attendance.service';
export declare class StaffAttendanceController {
    private readonly service;
    constructor(service: StaffAttendanceService);
    findAll(date?: string, staffId?: string, homeId?: string, month?: string, year?: string): Promise<any>;
    getTodaySummary(homeId?: string): Promise<{
        PRESENT: number;
        ABSENT: number;
        HALF_DAY: number;
        LEAVE: number;
        total: any;
        date: string;
    }>;
    getMonthlySummary(staffId: string, year?: string, month?: string): Promise<{
        staffId: string;
        year: number;
        month: number;
        totalRecords: any;
        byStatus: Record<string, number>;
    }>;
    create(body: {
        staffId: string;
        date: string;
        status: string;
        checkIn?: string;
        checkOut?: string;
        notes?: string;
    }): Promise<any>;
    bulkCreate(body: {
        date: string;
        entries: {
            staffId: string;
            status: string;
            checkIn?: string;
            checkOut?: string;
            notes?: string;
        }[];
    }): Promise<{
        created: number;
        skipped: number;
        errors: string[];
    }>;
    update(id: string, body: {
        status?: string;
        checkIn?: string | null;
        checkOut?: string | null;
        notes?: string | null;
    }): Promise<any>;
    delete(id: string): Promise<any>;
}
