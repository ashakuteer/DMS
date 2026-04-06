import { StaffAttendanceService } from './staff-attendance.service';
export declare class StaffAttendanceController {
    private readonly service;
    constructor(service: StaffAttendanceService);
    findAll(date?: string, staffId?: string, homeId?: string, month?: string, year?: string): Promise<({
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
        date: Date;
        status: string;
        notes: string | null;
        staffId: string;
        checkIn: Date | null;
        checkOut: Date | null;
    })[]>;
    getTodaySummary(homeId?: string): Promise<{
        PRESENT: number;
        ABSENT: number;
        HALF_DAY: number;
        LEAVE: number;
        total: number;
        date: string;
    }>;
    getMonthlySummary(staffId: string, year?: string, month?: string): Promise<{
        staffId: string;
        year: number;
        month: number;
        totalRecords: number;
        byStatus: Record<string, number>;
    }>;
    create(body: {
        staffId: string;
        date: string;
        status: string;
        checkIn?: string;
        checkOut?: string;
        notes?: string;
    }): Promise<{
        staff: {
            name: string;
            id: string;
            designation: string;
        };
    } & {
        id: string;
        createdAt: Date;
        date: Date;
        status: string;
        notes: string | null;
        staffId: string;
        checkIn: Date | null;
        checkOut: Date | null;
    }>;
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
    }): Promise<{
        staff: {
            name: string;
            id: string;
        };
    } & {
        id: string;
        createdAt: Date;
        date: Date;
        status: string;
        notes: string | null;
        staffId: string;
        checkIn: Date | null;
        checkOut: Date | null;
    }>;
    delete(id: string): Promise<{
        id: string;
        createdAt: Date;
        date: Date;
        status: string;
        notes: string | null;
        staffId: string;
        checkIn: Date | null;
        checkOut: Date | null;
    }>;
}
