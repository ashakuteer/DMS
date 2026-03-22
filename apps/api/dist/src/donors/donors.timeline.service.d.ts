import { PrismaService } from "../prisma/prisma.service";
import { UserContext } from "./donors.types";
export declare class DonorsTimelineService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private getAccessFilter;
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
}
