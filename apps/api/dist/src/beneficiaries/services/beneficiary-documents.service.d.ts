import { PrismaService } from "../../prisma/prisma.service";
export declare class BeneficiaryDocumentsService {
    private prisma;
    constructor(prisma: PrismaService);
    getDocuments(user: any, ownerType: string, ownerId?: string): Promise<({
        createdBy: {
            name: string;
            id: string;
        };
    } & {
        id: string;
        createdAt: Date;
        description: string | null;
        createdById: string;
        title: string;
        shareWithDonor: boolean;
        ownerType: import(".prisma/client").$Enums.DocumentOwnerType;
        ownerId: string | null;
        docType: import(".prisma/client").$Enums.DocumentType;
        storageBucket: string;
        storagePath: string;
        mimeType: string;
        sizeBytes: number;
        isSensitive: boolean;
    })[]>;
    createDocument(user: any, dto: any): Promise<{
        id: string;
        createdAt: Date;
        description: string | null;
        createdById: string;
        title: string;
        shareWithDonor: boolean;
        ownerType: import(".prisma/client").$Enums.DocumentOwnerType;
        ownerId: string | null;
        docType: import(".prisma/client").$Enums.DocumentType;
        storageBucket: string;
        storagePath: string;
        mimeType: string;
        sizeBytes: number;
        isSensitive: boolean;
    }>;
    getDocumentById(user: any, docId: string): Promise<{
        id: string;
        createdAt: Date;
        description: string | null;
        createdById: string;
        title: string;
        shareWithDonor: boolean;
        ownerType: import(".prisma/client").$Enums.DocumentOwnerType;
        ownerId: string | null;
        docType: import(".prisma/client").$Enums.DocumentType;
        storageBucket: string;
        storagePath: string;
        mimeType: string;
        sizeBytes: number;
        isSensitive: boolean;
    }>;
}
