import { PrismaService } from "../../prisma/prisma.service";
export declare class DuplicatesService {
    private prisma;
    constructor(prisma: PrismaService);
    detectDuplicates(rows: any[], mapping: Record<string, string>): Promise<any>;
}
