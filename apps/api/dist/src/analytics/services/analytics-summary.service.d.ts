import { PrismaService } from "../../prisma/prisma.service";
export declare class AnalyticsSummaryService {
    private prisma;
    constructor(prisma: PrismaService);
    private cache;
    getSummary(): Promise<any>;
}
