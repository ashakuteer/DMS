import { Response } from 'express';
import { DonorReportsService } from './donor-reports.service';
import { DonorReportType } from '@prisma/client';
export declare class DonorReportsController {
    private readonly service;
    private readonly logger;
    constructor(service: DonorReportsService);
    generate(body: {
        type: DonorReportType;
        periodStart: string;
        periodEnd: string;
        donorId?: string;
        campaignId?: string;
        templateId?: string;
        title?: string;
    }, user: any): Promise<any>;
    findAll(page?: string, limit?: string, type?: string, donorId?: string): Promise<{
        data: any;
        total: number;
        page: number;
        totalPages: number;
    }>;
    getTemplates(): Promise<any>;
    getCampaigns(): Promise<any>;
    searchDonors(search: string, limit?: string): Promise<any>;
    findOne(id: string): Promise<any>;
    downloadPdf(id: string, res: Response): Promise<void>;
    downloadExcel(id: string, res: Response): Promise<void>;
    shareReport(id: string, body: {
        donorIds: string[];
    }, user: any): Promise<{
        message: string;
        sentCount: number;
    }>;
    deleteReport(id: string): Promise<{
        message: string;
    }>;
    createTemplate(body: {
        name: string;
        headerText?: string;
        footerText?: string;
        showDonationSummary?: boolean;
        showDonationBreakdown?: boolean;
        showBeneficiaries?: boolean;
        showCampaigns?: boolean;
        showUsageSummary?: boolean;
        isDefault?: boolean;
    }, user: any): Promise<any>;
    updateTemplate(id: string, body: {
        name?: string;
        headerText?: string;
        footerText?: string;
        showDonationSummary?: boolean;
        showDonationBreakdown?: boolean;
        showBeneficiaries?: boolean;
        showCampaigns?: boolean;
        showUsageSummary?: boolean;
        isDefault?: boolean;
    }): Promise<any>;
    deleteTemplate(id: string): Promise<{
        message: string;
    }>;
}
