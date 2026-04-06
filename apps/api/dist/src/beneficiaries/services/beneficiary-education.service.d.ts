import { PrismaService } from "../../prisma/prisma.service";
export declare class BeneficiaryEducationService {
    private prisma;
    constructor(prisma: PrismaService);
    getProgressCards(beneficiaryId: string): Promise<any>;
    addProgressCard(user: any, beneficiaryId: string, dto: any): Promise<any>;
    getEducationTimeline(beneficiaryId: string): Promise<any>;
    exportEducationSummaryPdf(beneficiaryId: string): Promise<any>;
}
