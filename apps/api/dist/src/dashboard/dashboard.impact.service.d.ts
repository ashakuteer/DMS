import { PrismaService } from "../prisma/prisma.service";
export declare class DashboardImpactService {
    private readonly prisma;
    private readonly logger;
    private readonly cache;
    private readonly CACHE_TTL_MS;
    constructor(prisma: PrismaService);
    private getCached;
    private setCached;
    getImpactDashboard(): Promise<any>;
}
