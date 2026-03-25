import { DonorsService } from "./donors.service";
import { UserContext } from "./donors.types";
import { DuplicatesService } from "./donor-duplicates.service";
import { DonorFundraisingService } from "./donor-fundraising.service";
import { BeneficiariesService } from "../beneficiaries/beneficiaries.service";
import { Request, Response } from "express";
export declare class DonorsController {
    private readonly donorsService;
    private readonly donorDuplicatesService;
    private readonly donorFundraisingService;
    private readonly beneficiariesService;
    constructor(donorsService: DonorsService, donorDuplicatesService: DuplicatesService, donorFundraisingService: DonorFundraisingService, beneficiariesService: BeneficiariesService);
    private getClientInfo;
    findAll(user: UserContext, page?: string, limit?: string, search?: string, sortBy?: string, sortOrder?: "asc" | "desc", category?: string, city?: string, country?: string, religion?: string, assignedToUserId?: string, donationFrequency?: string, healthStatus?: string, supportPreferences?: string, locationCategory?: string): Promise<{
        items: any;
        total: any;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    checkDuplicate(phone?: string, email?: string): Promise<{
        duplicates: any;
    }>;
    lookupByPhone(phone: string): Promise<{
        found: boolean;
        donor?: any;
    }>;
    downloadBulkTemplate(res: Response): Promise<void>;
    bulkUpload(user: UserContext, file: Express.Multer.File, mode?: string, req?: Request): Promise<{
        message: string;
        user: any;
    }>;
    exportDonors(user: UserContext, search?: string, req?: Request): Promise<any>;
    exportMasterDonorExcel(user: UserContext, home?: string, donorType?: string, activity?: string, req?: Request, res?: Response): Promise<void>;
    findDuplicates(): Promise<void>;
    mergeDuplicates(): Promise<void>;
    bulkReassignDonors(body: {
        fromUserId: string;
        toUserId: string;
    }): Promise<{
        count: any;
    }>;
    countDonorsByAssignee(userId: string): Promise<{
        count: any;
    }>;
    findArchived(user: UserContext, search?: string, page?: string, limit?: string): Promise<{
        data: any;
        pagination: {
            total: any;
            page: number;
            limit: number;
            pages: number;
        };
    }>;
    findOne(user: UserContext, id: string): Promise<any>;
    create(user: UserContext, data: Record<string, unknown>, req: Request): Promise<any>;
    update(user: UserContext, id: string, data: Record<string, unknown>, req: Request): Promise<any>;
    remove(user: UserContext, id: string, req: Request, reason?: string): Promise<any>;
    restore(user: UserContext, id: string): Promise<any>;
    requestFullAccess(user: UserContext, id: string, reason?: string, req?: Request): Promise<{
        success: boolean;
        message: string;
    }>;
    parseImportFile(file: Express.Multer.File): Promise<{
        headers: string[];
        rows: any[][];
        totalRows: number;
    }>;
    detectDuplicates(data: {
        rows: any[];
        columnMapping: Record<string, string>;
    }): Promise<any>;
    executeBulkImport(user: UserContext, data: {
        rows: any[];
        columnMapping: Record<string, string>;
        actions: Record<number, "skip" | "update" | "create">;
    }, req: Request): Promise<{
        success: boolean;
    }>;
    getDonorSponsorships(id: string): Promise<any>;
    getTimeline(user: UserContext, id: string, page?: string, limit?: string, startDate?: string, endDate?: string, types?: string): Promise<{
        items: {
            id: string;
            type: string;
            date: string;
            title: string;
            description: string;
            amount?: number;
            currency?: string;
            status?: string;
            metadata?: Record<string, any>;
        }[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        typeCounts: Record<string, number>;
    }>;
    assignTelecaller(user: UserContext, donorId: string, assignedToUserId: string, req: Request): Promise<any>;
    assignDonor(id: string, body: {
        assignedToUserId: string | null;
    }): Promise<any>;
    getHealthScore(id: string): Promise<import("./donor-fundraising.service").HealthScoreResult>;
    getPrediction(id: string): Promise<import("./donor-fundraising.service").PredictionResult>;
    uploadPhoto(user: UserContext, id: string, file: Express.Multer.File): Promise<{
        profilePicUrl: string;
    }>;
}
