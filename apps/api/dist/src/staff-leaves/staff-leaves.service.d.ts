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
    }): Promise<({
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
        startDate: Date;
        endDate: Date;
        type: string;
        status: string;
        notes: string | null;
        days: number;
        staffId: string;
    })[]>;
    findByStaff(staffId: string, year?: number): Promise<{
        id: string;
        createdAt: Date;
        reason: string | null;
        updatedAt: Date;
        startDate: Date;
        endDate: Date;
        type: string;
        status: string;
        notes: string | null;
        days: number;
        staffId: string;
    }[]>;
    create(data: {
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
        startDate: Date;
        endDate: Date;
        type: string;
        status: string;
        notes: string | null;
        days: number;
        staffId: string;
    }>;
    updateStatus(id: string, status: LeaveStatus, notes?: string): Promise<{
        staff: {
            name: string;
            id: string;
        };
    } & {
        id: string;
        createdAt: Date;
        reason: string | null;
        updatedAt: Date;
        startDate: Date;
        endDate: Date;
        type: string;
        status: string;
        notes: string | null;
        days: number;
        staffId: string;
    }>;
    delete(id: string): Promise<{
        id: string;
        createdAt: Date;
        reason: string | null;
        updatedAt: Date;
        startDate: Date;
        endDate: Date;
        type: string;
        status: string;
        notes: string | null;
        days: number;
        staffId: string;
    }>;
    getSummary(staffId: string, year: number): Promise<{
        staffId: string;
        year: number;
        approved: number;
        totalDays: number;
        byType: Record<string, number>;
    }>;
}
