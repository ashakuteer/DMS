import { PrismaService } from "../../prisma/prisma.service";
export declare class AnalyticsRiskService {
    private prisma;
    constructor(prisma: PrismaService);
    computeAtRiskDonors(): Promise<any>;
}
