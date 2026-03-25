import { StreamableFile } from "@nestjs/common";
import { Request, Response } from "express";
import { DonationsService, UserContext } from "./donations.service";
export declare class DonationsController {
    private readonly donationsService;
    constructor(donationsService: DonationsService);
    private getClientInfo;
    findAll(user: UserContext, page?: string, limit?: string, donorId?: string, startDate?: string, endDate?: string, sortBy?: string, sortOrder?: "asc" | "desc", search?: string, donationType?: string, donationHomeType?: string): Promise<{
        items: any;
        total: any;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    getStatsByHome(user: UserContext): Promise<{
        byHome: {
            cashTotal: number;
            inKindCount: number;
            totalCount: number;
            homeType: string;
            label: string;
        }[];
        totals: {
            cashTotal: number;
            inKindCount: number;
            totalDonations: any;
        };
    }>;
    exportDonations(user: UserContext, req: Request, startDate?: string, endDate?: string, donorId?: string): Promise<any>;
    exportToExcel(user: UserContext, req: Request, res: Response, startDate?: string, endDate?: string, donationType?: string, donationHomeType?: string): Promise<StreamableFile>;
    downloadReceipt(user: UserContext, id: string, res: Response): Promise<StreamableFile>;
    findOne(user: UserContext, id: string): Promise<any>;
    create(user: UserContext, data: Record<string, unknown>, req: Request): Promise<any>;
    update(user: UserContext, id: string, data: Record<string, unknown>, req: Request): Promise<any>;
    remove(user: UserContext, id: string, req: Request): Promise<any>;
    regenerateReceipt(user: UserContext, id: string, req: Request): Promise<{
        success: boolean;
        message: string;
        receiptNumber: any;
    }>;
    resendReceipt(user: UserContext, id: string, body?: {
        emailType?: 'GENERAL' | 'TAX' | 'KIND';
    }): Promise<{
        success: boolean;
        message: string;
        receiptNumber: any;
        recipientEmail: any;
    }>;
}
