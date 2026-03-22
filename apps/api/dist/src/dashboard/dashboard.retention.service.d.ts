import { PrismaService } from "../prisma/prisma.service";
export declare class DashboardRetentionService {
    private readonly prisma;
    private readonly logger;
    private readonly cache;
    private readonly CACHE_TTL_MS;
    constructor(prisma: PrismaService);
    private getCached;
    private setCached;
    getRetentionAnalytics(): Promise<any>;
}
