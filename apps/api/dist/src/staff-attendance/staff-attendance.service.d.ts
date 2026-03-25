import { PrismaService } from '../prisma/prisma.service';
export declare class StaffAttendanceService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(params: {
        date?: string;
        staffId?: string;
        homeId?: string;
        month?: string;
        year?: string;
    }): Promise<any>;
    getTodaySummary(homeId?: string): Promise<{
        PRESENT: number;
        ABSENT: number;
        HALF_DAY: number;
        LEAVE: number;
        total: any;
        date: string;
    }>;
    create(data: {
        staffId: string;
        date: string;
        status: string;
        checkIn?: string;
        checkOut?: string;
        notes?: string;
    }): Promise<any>;
    bulkCreate(date: string, entries: {
        staffId: string;
        status: string;
        checkIn?: string;
        checkOut?: string;
        notes?: string;
    }[]): Promise<{
        created: number;
        skipped: number;
        errors: string[];
    }>;
    update(id: string, data: {
        status?: string;
        checkIn?: string | null;
        checkOut?: string | null;
        notes?: string | null;
    }): Promise<any>;
    delete(id: string): Promise<any>;
    getMonthlySummary(staffId: string, year: number, month: number): Promise<{
        staffId: string;
        year: number;
        month: number;
        totalRecords: any;
        byStatus: Record<string, number>;
    }>;
    private resolveStatus;
    private parseTime;
}
