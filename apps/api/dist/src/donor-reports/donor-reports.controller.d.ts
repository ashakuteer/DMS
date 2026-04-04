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
    }, user: any): Promise<{
        donor: {
            donorCode: string;
            firstName: string;
            lastName: string;
        };
        template: {
            name: string;
            headerText: string;
            footerText: string;
            showDonationSummary: boolean;
            showDonationBreakdown: boolean;
            showBeneficiaries: boolean;
            showCampaigns: boolean;
            showUsageSummary: boolean;
        };
        generatedBy: {
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        donorId: string | null;
        templateId: string | null;
        type: import(".prisma/client").$Enums.DonorReportType;
        status: import(".prisma/client").$Enums.DonorReportStatus;
        campaignId: string | null;
        title: string;
        periodStart: Date;
        periodEnd: Date;
        reportData: import("@prisma/client/runtime/library").JsonValue | null;
        pdfUrl: string | null;
        excelUrl: string | null;
        sharedAt: Date | null;
        sharedTo: string[];
        generatedById: string;
    }>;
    findAll(page?: string, limit?: string, type?: string, donorId?: string): Promise<{
        data: any[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    getTemplates(): Promise<({
        createdBy: {
            name: string;
        };
    } & {
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        createdById: string;
        isDefault: boolean;
        headerText: string | null;
        footerText: string | null;
        showDonationSummary: boolean;
        showDonationBreakdown: boolean;
        showBeneficiaries: boolean;
        showCampaigns: boolean;
        showUsageSummary: boolean;
        customSections: import("@prisma/client/runtime/library").JsonValue | null;
    })[]>;
    getCampaigns(): Promise<{
        name: string;
        id: string;
        status: import(".prisma/client").$Enums.CampaignStatus;
    }[]>;
    searchDonors(search: string, limit?: string): Promise<{
        id: string;
        donorCode: string;
        firstName: string;
        lastName: string;
        personalEmail: string;
        officialEmail: string;
    }[]>;
    findOne(id: string): Promise<{
        donor: {
            donorCode: string;
            firstName: string;
            lastName: string;
        };
        template: {
            name: string;
            headerText: string;
            footerText: string;
            showDonationSummary: boolean;
            showDonationBreakdown: boolean;
            showBeneficiaries: boolean;
            showCampaigns: boolean;
            showUsageSummary: boolean;
        };
        generatedBy: {
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        donorId: string | null;
        templateId: string | null;
        type: import(".prisma/client").$Enums.DonorReportType;
        status: import(".prisma/client").$Enums.DonorReportStatus;
        campaignId: string | null;
        title: string;
        periodStart: Date;
        periodEnd: Date;
        reportData: import("@prisma/client/runtime/library").JsonValue | null;
        pdfUrl: string | null;
        excelUrl: string | null;
        sharedAt: Date | null;
        sharedTo: string[];
        generatedById: string;
    }>;
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
    }, user: any): Promise<{
        createdBy: {
            name: string;
        };
    } & {
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        createdById: string;
        isDefault: boolean;
        headerText: string | null;
        footerText: string | null;
        showDonationSummary: boolean;
        showDonationBreakdown: boolean;
        showBeneficiaries: boolean;
        showCampaigns: boolean;
        showUsageSummary: boolean;
        customSections: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
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
    }): Promise<{
        createdBy: {
            name: string;
        };
    } & {
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        createdById: string;
        isDefault: boolean;
        headerText: string | null;
        footerText: string | null;
        showDonationSummary: boolean;
        showDonationBreakdown: boolean;
        showBeneficiaries: boolean;
        showCampaigns: boolean;
        showUsageSummary: boolean;
        customSections: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    deleteTemplate(id: string): Promise<{
        message: string;
    }>;
}
