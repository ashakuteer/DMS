import { StaffSalaryService } from './staff-salary.service';
export declare class StaffSalaryController {
    private readonly service;
    constructor(service: StaffSalaryService);
    getOverview(homeId?: string): Promise<{
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
            baseSalary: import("@prisma/client/runtime/library").Decimal;
            allowances: import("@prisma/client/runtime/library").Decimal;
            deductions: import("@prisma/client/runtime/library").Decimal;
            netSalary: import("@prisma/client/runtime/library").Decimal;
            amountPaid: import("@prisma/client/runtime/library").Decimal;
            paymentDate: Date | null;
        };
        hasSalary: boolean;
    }[]>;
    getSalaryStructure(staffId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        notes: string | null;
        staffId: string;
        baseSalary: import("@prisma/client/runtime/library").Decimal;
        allowances: import("@prisma/client/runtime/library").Decimal;
        deductions: import("@prisma/client/runtime/library").Decimal;
        effectiveFrom: Date | null;
    }>;
    upsertSalaryStructure(staffId: string, body: {
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
        baseSalary: import("@prisma/client/runtime/library").Decimal;
        allowances: import("@prisma/client/runtime/library").Decimal;
        deductions: import("@prisma/client/runtime/library").Decimal;
        effectiveFrom: Date | null;
    }>;
    getPayments(staffId: string, year?: string): Promise<{
        id: string;
        createdAt: Date;
        notes: string | null;
        month: number;
        paymentMode: string;
        year: number;
        staffId: string;
        baseSalary: import("@prisma/client/runtime/library").Decimal;
        allowances: import("@prisma/client/runtime/library").Decimal;
        deductions: import("@prisma/client/runtime/library").Decimal;
        netSalary: import("@prisma/client/runtime/library").Decimal;
        amountPaid: import("@prisma/client/runtime/library").Decimal;
        paymentDate: Date | null;
    }[]>;
    recordPayment(staffId: string, body: {
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
        baseSalary: import("@prisma/client/runtime/library").Decimal;
        allowances: import("@prisma/client/runtime/library").Decimal;
        deductions: import("@prisma/client/runtime/library").Decimal;
        netSalary: import("@prisma/client/runtime/library").Decimal;
        amountPaid: import("@prisma/client/runtime/library").Decimal;
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
        baseSalary: import("@prisma/client/runtime/library").Decimal;
        allowances: import("@prisma/client/runtime/library").Decimal;
        deductions: import("@prisma/client/runtime/library").Decimal;
        netSalary: import("@prisma/client/runtime/library").Decimal;
        amountPaid: import("@prisma/client/runtime/library").Decimal;
        paymentDate: Date | null;
    }>;
}
