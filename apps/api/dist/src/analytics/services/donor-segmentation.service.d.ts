import { PrismaService } from '../../prisma/prisma.service';
export interface DonorSegmentationResult {
    championDonors: number;
    majorDonors: number;
    activeDonors: number;
    smallDonors: number;
    total: number;
}
export declare class DonorSegmentationService {
    private prisma;
    constructor(prisma: PrismaService);
    getDonorSegmentation(): Promise<DonorSegmentationResult>;
}
