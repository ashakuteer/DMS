import { BeneficiaryProgressReportsService } from './beneficiary-progress-reports.service';
import { Response } from 'express';
export declare class BeneficiaryProgressReportsController {
    private readonly service;
    constructor(service: BeneficiaryProgressReportsService);
    generate(body: any, req: any): Promise<{
        id: any;
        status: string;
    }>;
    findAll(page?: string, limit?: string, beneficiaryId?: string): Promise<{
        items: any;
        total: any;
        page: number;
        totalPages: number;
    }>;
    searchBeneficiaries(q: string): Promise<any>;
    findOne(id: string): Promise<any>;
    downloadPdf(id: string, res: Response): Promise<void>;
    shareWithSponsors(id: string, req: any): Promise<{
        sharedCount: number;
    }>;
    shareToDonors(id: string, body: any, req: any): Promise<{
        sharedCount: number;
    }>;
    delete(id: string): Promise<{
        deleted: boolean;
    }>;
}
