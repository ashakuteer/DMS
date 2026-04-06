import { PrismaService } from "../../prisma/prisma.service";
export declare class AnalyticsSegmentsService {
    private prisma;
    constructor(prisma: PrismaService);
    getTopDonorsSegment(): Promise<any>;
}
