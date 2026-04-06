import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { UserContext } from "./donors.types";
export declare class DonorsExportService {
    private readonly prisma;
    private readonly auditService;
    constructor(prisma: PrismaService, auditService: AuditService);
    exportDonors(user: UserContext, filters?: any, ipAddress?: string, userAgent?: string): Promise<any>;
    exportMasterDonorExcel(user: UserContext, filters?: {
        home?: string;
        donorType?: string;
        activity?: string;
    }, ipAddress?: string, userAgent?: string): Promise<Buffer>;
}
