import { PrismaService } from '../prisma/prisma.service';
import { OrganizationProfileService } from '../organization-profile/organization-profile.service';
export interface HomeSummaryData {
    month: number;
    year: number;
    monthLabel: string;
    generatedAt: string;
    homes: HomeStat[];
    totals: {
        totalBeneficiaries: number;
        totalActive: number;
        totalInactive: number;
        totalHealthNormal: number;
        totalHealthSick: number;
        totalHealthHospitalized: number;
        totalSchoolGoing: number;
        totalCollegeGoing: number;
        totalNewJoinings: number;
        totalExits: number;
    };
}
export interface HomeStat {
    homeType: string;
    homeLabel: string;
    totalBeneficiaries: number;
    activeBeneficiaries: number;
    inactiveBeneficiaries: number;
    healthNormal: number;
    healthSick: number;
    healthHospitalized: number;
    schoolGoing: number;
    collegeGoing: number;
    newJoinings: number;
    exits: number;
}
export declare class HomeSummaryService {
    private prisma;
    private orgProfileService;
    private readonly logger;
    constructor(prisma: PrismaService, orgProfileService: OrganizationProfileService);
    private homeLabel;
    private monthLabel;
    getSummary(month: number, year: number): Promise<HomeSummaryData>;
    generatePdf(month: number, year: number): Promise<Buffer>;
    private pdfSection;
    private pdfTable;
    generateExcel(month: number, year: number): Promise<Buffer>;
}
