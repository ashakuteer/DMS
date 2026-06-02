import { BeneficiaryProgressReportsService } from './beneficiary-progress-reports.service';
import { Response } from 'express';
export declare class BeneficiaryProgressReportsController {
    private readonly service;
    constructor(service: BeneficiaryProgressReportsService);
    generate(body: any, req: any): Promise<{
        id: string;
        status: string;
    }>;
    findAll(page?: string, limit?: string, beneficiaryId?: string): Promise<{
        items: ({
            beneficiary: {
                code: string;
                fullName: string;
                homeType: import(".prisma/client").$Enums.HomeType;
            };
            generatedBy: {
                name: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.ProgressReportStatus;
            title: string;
            beneficiaryId: string;
            periodStart: Date;
            periodEnd: Date;
            reportData: import("@prisma/client/runtime/library").JsonValue | null;
            sharedAt: Date | null;
            sharedTo: string[];
            generatedById: string;
            includePhotos: boolean;
            includeHealth: boolean;
            includeEducation: boolean;
            includeUpdates: boolean;
        })[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    searchBeneficiaries(q: string): Promise<{
        id: string;
        code: string;
        fullName: string;
        homeType: import(".prisma/client").$Enums.HomeType;
    }[]>;
    findOne(id: string): Promise<{
        beneficiary: {
            code: string;
            fullName: string;
            homeType: import(".prisma/client").$Enums.HomeType;
            photoUrl: string;
        };
        generatedBy: {
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.ProgressReportStatus;
        title: string;
        beneficiaryId: string;
        periodStart: Date;
        periodEnd: Date;
        reportData: import("@prisma/client/runtime/library").JsonValue | null;
        sharedAt: Date | null;
        sharedTo: string[];
        generatedById: string;
        includePhotos: boolean;
        includeHealth: boolean;
        includeEducation: boolean;
        includeUpdates: boolean;
    }>;
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
