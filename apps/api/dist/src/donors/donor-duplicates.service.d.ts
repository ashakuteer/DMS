import { PrismaService } from "../prisma/prisma.service";
export declare class DuplicatesService {
    private prisma;
    constructor(prisma: PrismaService);
    detectDuplicatesInBatch(rows: any[], mapping: Record<string, string>): Promise<{
        id: string;
        firstName: string;
        primaryPhone: string;
        personalEmail: string;
    }[]>;
}
