import { PrismaService } from "../prisma/prisma.service";
import { EngagementResult } from "./donors.types";
export declare class DonorsEngagementService {
    private prisma;
    constructor(prisma: PrismaService);
    computeEngagementScores(donorIds: string[]): Promise<Record<string, EngagementResult>>;
    private computeEngagementScoresChunk;
}
