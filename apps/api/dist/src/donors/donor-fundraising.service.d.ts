import { PrismaService } from '../prisma/prisma.service';
export interface HealthScoreResult {
    score: number;
    status: string;
    breakdown: {
        recency: number;
        frequency: number;
        lifetimeValue: number;
        yearsSupporting: number;
    };
}
export interface PredictionResult {
    probability: number;
    expectedDonation: number;
    averageDonation: number;
    lastDonationDate: string | null;
    donationCount: number;
}
export declare class DonorFundraisingService {
    private prisma;
    constructor(prisma: PrismaService);
    getHealthScore(donorId: string): Promise<HealthScoreResult>;
    getPrediction(donorId: string): Promise<PredictionResult>;
}
