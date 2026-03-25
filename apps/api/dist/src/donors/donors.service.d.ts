import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { DonorsCrudService } from "./donors.crud.service";
import { DonorsImportService } from "./import/donors-import.service";
import { DonorsExportService } from "./donors.export.service";
import { UserContext, DonorQueryOptions } from "./donors.types";
import { StorageService } from "../storage/storage.service";
import { DonorsTimelineService } from "./donors.timeline.service";
export declare class DonorsService {
    private readonly prisma;
    private readonly auditService;
    private readonly storageService;
    private readonly crud;
    private readonly importService;
    private readonly exportService;
    private readonly timelineService;
    constructor(prisma: PrismaService, auditService: AuditService, storageService: StorageService, crud: DonorsCrudService, importService: DonorsImportService, exportService: DonorsExportService, timelineService: DonorsTimelineService);
    private getActiveDonorOrThrow;
    findAll(user: UserContext, options?: DonorQueryOptions): Promise<{
        items: any;
        total: any;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findOne(user: UserContext, id: string): Promise<any>;
    lookupByPhone(phone: string): Promise<{
        found: boolean;
        donor?: any;
    }>;
    create(user: UserContext, data: any, ipAddress?: string, userAgent?: string): Promise<any>;
    update(user: UserContext, id: string, data: any, ipAddress?: string, userAgent?: string): Promise<any>;
    softDelete(user: UserContext, id: string, deleteReason?: string, ipAddress?: string, userAgent?: string): Promise<any>;
    restore(user: UserContext, id: string): Promise<any>;
    findArchived(user: UserContext, search?: string, page?: number, limit?: number): Promise<{
        data: any;
        pagination: {
            total: any;
            page: number;
            limit: number;
            pages: number;
        };
    }>;
    assignDonor(id: string, assignedToUserId: string | null): Promise<any>;
    bulkReassignDonors(fromUserId: string, toUserId: string): Promise<{
        count: any;
    }>;
    countDonorsByAssignee(userId: string): Promise<any>;
    getTimeline(user: UserContext, donorId: string, options?: {
        page?: number;
        limit?: number;
        startDate?: string;
        endDate?: string;
        types?: string[];
    }): Promise<{
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
    parseImportFile(file: Express.Multer.File): Promise<{
        headers: string[];
        rows: any[][];
        totalRows: number;
    }>;
    detectDuplicatesInBatch(rows: any[], columnMapping: Record<string, string>): Promise<any>;
    executeBulkImport(user: UserContext, rows: any[], columnMapping: Record<string, string>, actions: Record<number, "skip" | "update" | "create">, ipAddress?: string, userAgent?: string): Promise<{
        success: boolean;
    }>;
    generateBulkTemplate(): Promise<Buffer>;
    bulkUpload(file: Express.Multer.File, user: UserContext, mode?: "upsert" | "insert_only", ipAddress?: string, userAgent?: string): Promise<{
        message: string;
        user: any;
    }>;
    exportDonors(user: UserContext, filters?: any, ipAddress?: string, userAgent?: string): Promise<any>;
    exportMasterDonorExcel(user: UserContext, filters?: {
        home?: string;
        donorType?: string;
        activity?: string;
    }, ipAddress?: string, userAgent?: string): Promise<Buffer>;
    uploadPhoto(user: UserContext, id: string, file: Express.Multer.File): Promise<{
        profilePicUrl: string;
    }>;
    requestFullAccess(user: UserContext, donorId: string, reason?: string, ipAddress?: string, userAgent?: string): Promise<{
        success: boolean;
        message: string;
    }>;
    checkDuplicate(phone?: string, email?: string): Promise<{
        duplicates: any;
    }>;
    assignTelecaller(user: UserContext, donorId: string, assignedToUserId: string, ipAddress?: string, userAgent?: string): Promise<any>;
}
