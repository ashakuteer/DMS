import { PrismaService } from '../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';
export declare class StaffSalaryService {
    private prisma;
    constructor(prisma: PrismaService);
    getSalaryStructure(staffId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        notes: string | null;
        staffId: string;
        baseSalary: Decimal;
        allowances: Decimal;
        deductions: Decimal;
        effectiveFrom: Date | null;
    }>;
    upsertSalaryStructure(staffId: string, data: {
        baseSalary: number;
        allowances?: number;
        deductions?: number;
        effectiveFrom?: string;
        notes?: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        notes: string | null;
        staffId: string;
        baseSalary: Decimal;
        allowances: Decimal;
        deductions: Decimal;
        effectiveFrom: Date | null;
    }>;
    getPayments(staffId: string, year?: number): Promise<{
        id: string;
        createdAt: Date;
        notes: string | null;
        month: number;
        paymentMode: string;
        year: number;
        staffId: string;
        baseSalary: Decimal;
        allowances: Decimal;
        deductions: Decimal;
        netSalary: Decimal;
        amountPaid: Decimal;
        paymentDate: Date | null;
    }[]>;
    recordPayment(staffId: string, data: {
        month: number;
        year: number;
        baseSalary: number;
        allowances?: number;
        deductions?: number;
        amountPaid: number;
        paymentDate?: string;
        paymentMode?: string;
        notes?: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        notes: string | null;
        month: number;
        paymentMode: string;
        year: number;
        staffId: string;
        baseSalary: Decimal;
        allowances: Decimal;
        deductions: Decimal;
        netSalary: Decimal;
        amountPaid: Decimal;
        paymentDate: Date | null;
    }>;
    deletePayment(paymentId: string): Promise<{
        id: string;
        createdAt: Date;
        notes: string | null;
        month: number;
        paymentMode: string;
        year: number;
        staffId: string;
        baseSalary: Decimal;
        allowances: Decimal;
        deductions: Decimal;
        netSalary: Decimal;
        amountPaid: Decimal;
        paymentDate: Date | null;
    }>;
    getPayrollOverview(homeId?: string): Promise<{
        id: string;
        name: string;
        designation: string;
        home: {
            name: string;
            id: string;
            address: string | null;
        };
        baseSalary: number;
        allowances: number;
        deductions: number;
        netSalary: number;
        lastPayment: {
            id: string;
            createdAt: Date;
            notes: string | null;
            month: number;
            paymentMode: string;
            year: number;
            staffId: string;
            baseSalary: Decimal;
            allowances: Decimal;
            deductions: Decimal;
            netSalary: Decimal;
            amountPaid: Decimal;
            paymentDate: Date | null;
        };
        hasSalary: boolean;
    }[]>;
}
