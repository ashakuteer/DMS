import { PrismaService } from "../../prisma/prisma.service";
export declare class DuplicatesService {
    private prisma;
    constructor(prisma: PrismaService);
    detectDuplicates(rows: any[], mapping: Record<string, string>): Promise<{
        id: string;
        donorCode: string;
        firstName: string;
        lastName: string;
        primaryPhone: string;
        personalEmail: string;
    }[]>;
}
