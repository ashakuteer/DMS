import { StaffSalaryService } from './staff-salary.service';
export declare class StaffSalaryController {
    private readonly service;
    constructor(service: StaffSalaryService);
    getOverview(homeId?: string): Promise<any>;
    getSalaryStructure(staffId: string): Promise<any>;
    upsertSalaryStructure(staffId: string, body: {
        baseSalary: number;
        allowances?: number;
        deductions?: number;
        effectiveFrom?: string;
        notes?: string;
    }): Promise<any>;
    getPayments(staffId: string, year?: string): Promise<any>;
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
    }): Promise<any>;
    deletePayment(paymentId: string): Promise<any>;
}
