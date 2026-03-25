import { PrismaService } from '../prisma/prisma.service';
export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type LeaveType = 'CASUAL' | 'SICK' | 'EARNED' | 'UNPAID';
export declare class StaffLeavesService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(params: {
        staffId?: string;
        status?: string;
        type?: string;
        year?: number;
        homeId?: string;
    }): Promise<any>;
    findByStaff(staffId: string, year?: number): Promise<any>;
    create(data: {
        staffId: string;
        type: string;
        startDate: string;
        endDate: string;
        days: number;
        reason?: string;
    }): Promise<any>;
    updateStatus(id: string, status: LeaveStatus, notes?: string): Promise<any>;
    delete(id: string): Promise<any>;
    getSummary(staffId: string, year: number): Promise<{
        staffId: string;
        year: number;
        approved: any;
        totalDays: any;
        byType: Record<string, number>;
    }>;
}
