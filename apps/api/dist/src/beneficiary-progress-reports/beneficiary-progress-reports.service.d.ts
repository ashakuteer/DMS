import { PrismaService } from '../prisma/prisma.service';
import { OrganizationProfileService } from '../organization-profile/organization-profile.service';
import { EmailJobsService } from '../email-jobs/email-jobs.service';
interface GenerateProgressReportDto {
    beneficiaryId: string;
    title?: string;
    periodStart: string;
    periodEnd: string;
    includePhotos?: boolean;
    includeHealth?: boolean;
    includeEducation?: boolean;
    includeUpdates?: boolean;
}
interface UserContext {
    id: string;
    email: string;
    role: string;
    name?: string;
}
export declare class BeneficiaryProgressReportsService {
    private prisma;
    private emailJobsService;
    private orgProfileService;
    private readonly logger;
    constructor(prisma: PrismaService, emailJobsService: EmailJobsService, orgProfileService: OrganizationProfileService);
    generate(dto: GenerateProgressReportDto, user: UserContext): Promise<{
        id: string;
        status: string;
    }>;
    private aggregateData;
    findAll(page?: number, limit?: number, filters?: {
        beneficiaryId?: string;
    }): Promise<{
        items: ({
            beneficiary: {
                code: string;
                fullName: string;
                homeType: import(".prisma/client").$Enums.HomeType;
            };
            generatedBy: {
                name: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.ProgressReportStatus;
            title: string;
            beneficiaryId: string;
            periodStart: Date;
            periodEnd: Date;
            reportData: import("@prisma/client/runtime/library").JsonValue | null;
            sharedAt: Date | null;
            sharedTo: string[];
            generatedById: string;
            includePhotos: boolean;
            includeHealth: boolean;
            includeEducation: boolean;
            includeUpdates: boolean;
        })[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    findOne(id: string): Promise<{
        beneficiary: {
            code: string;
            fullName: string;
            homeType: import(".prisma/client").$Enums.HomeType;
            photoUrl: string;
        };
        generatedBy: {
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.ProgressReportStatus;
        title: string;
        beneficiaryId: string;
        periodStart: Date;
        periodEnd: Date;
        reportData: import("@prisma/client/runtime/library").JsonValue | null;
        sharedAt: Date | null;
        sharedTo: string[];
        generatedById: string;
        includePhotos: boolean;
        includeHealth: boolean;
        includeEducation: boolean;
        includeUpdates: boolean;
    }>;
    generatePdf(id: string): Promise<Buffer>;
    private addWatermark;
    private addSectionHeader;
    private drawTableHeader;
    private checkPageBreak;
    private fetchImageBuffer;
    shareWithSponsors(id: string, user: UserContext): Promise<{
        sharedCount: number;
    }>;
    shareToDonors(id: string, donorIds: string[], user: UserContext): Promise<{
        sharedCount: number;
    }>;
    delete(id: string): Promise<{
        deleted: boolean;
    }>;
    searchBeneficiaries(q: string): Promise<{
        code: string;
        id: string;
        fullName: string;
        homeType: import(".prisma/client").$Enums.HomeType;
    }[]>;
    private buildShareEmail;
    private formatDateRange;
    private formatHomeType;
    private fmtDate;
}
export {};
