import { PrismaService } from '../prisma/prisma.service';
export declare class StaffSalaryService {
    private prisma;
    constructor(prisma: PrismaService);
    getSalaryStructure(staffId: string): Promise<any>;
    upsertSalaryStructure(staffId: string, data: {
        baseSalary: number;
        allowances?: number;
        deductions?: number;
        effectiveFrom?: string;
        notes?: string;
    }): Promise<any>;
    getPayments(staffId: string, year?: number): Promise<any>;
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
    }): Promise<any>;
    deletePayment(paymentId: string): Promise<any>;
    getPayrollOverview(homeId?: string): Promise<any>;
}
