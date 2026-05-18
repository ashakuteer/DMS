import { PrismaService } from "../../prisma/prisma.service";
export declare class BeneficiaryEducationService {
    private prisma;
    constructor(prisma: PrismaService);
    getProgressCards(beneficiaryId: string): Promise<({
        createdBy: {
            name: string;
            id: string;
        };
    } & {
        id: string;
        createdAt: Date;
        createdById: string;
        remarks: string | null;
        classGrade: string;
        school: string | null;
        academicYear: string;
        beneficiaryId: string;
        term: import(".prisma/client").$Enums.ProgressTerm;
        overallPercentage: import("@prisma/client/runtime/library").Decimal | null;
        fileDocumentId: string | null;
    })[]>;
    addProgressCard(user: any, beneficiaryId: string, dto: any): Promise<{
        id: string;
        createdAt: Date;
        createdById: string;
        remarks: string | null;
        classGrade: string;
        school: string | null;
        academicYear: string;
        beneficiaryId: string;
        term: import(".prisma/client").$Enums.ProgressTerm;
        overallPercentage: import("@prisma/client/runtime/library").Decimal | null;
        fileDocumentId: string | null;
    }>;
    getEducationTimeline(beneficiaryId: string): Promise<{
        id: string;
        createdAt: Date;
        createdById: string;
        remarks: string | null;
        classGrade: string;
        school: string | null;
        academicYear: string;
        beneficiaryId: string;
        term: import(".prisma/client").$Enums.ProgressTerm;
        overallPercentage: import("@prisma/client/runtime/library").Decimal | null;
        fileDocumentId: string | null;
    }[]>;
    exportEducationSummaryPdf(beneficiaryId: string): Promise<({
        createdBy: {
            name: string;
            id: string;
        };
    } & {
        id: string;
        createdAt: Date;
        createdById: string;
        remarks: string | null;
        classGrade: string;
        school: string | null;
        academicYear: string;
        beneficiaryId: string;
        term: import(".prisma/client").$Enums.ProgressTerm;
        overallPercentage: import("@prisma/client/runtime/library").Decimal | null;
        fileDocumentId: string | null;
    })[]>;
}
