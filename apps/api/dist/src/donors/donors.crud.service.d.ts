import { PrismaService } from "../prisma/prisma.service";
import { UserContext, DonorQueryOptions } from "./donors.types";
import { DonorsEngagementService } from "./donors.engagement.service";
export declare class DonorsCrudService {
    private readonly prisma;
    private readonly engagementService;
    private readonly logger;
    constructor(prisma: PrismaService, engagementService: DonorsEngagementService);
    private getAccessFilter;
    private computeLocationCategory;
    private shouldMaskData;
    private readonly UUID_REGEX;
    private isValidUUID;
    private getActiveDonorOrThrow;
    findAll(user: UserContext, options?: DonorQueryOptions): Promise<{
        items: any;
        total: any;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findOne(user: UserContext, id: string): Promise<any>;
    create(user: UserContext, data: any, ipAddress?: string, userAgent?: string): Promise<any>;
    update(user: any, id: string, data: any, ipAddress?: string, userAgent?: string): Promise<any>;
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
    lookupByPhone(phone: string): Promise<{
        found: boolean;
        donor?: any;
    }>;
    assignDonor(id: string, assignedToUserId: string | null): Promise<any>;
    countDonorsByAssignee(userId: string): Promise<any>;
    bulkReassignDonors(fromUserId: string, toUserId: string): Promise<{
        count: any;
    }>;
}
