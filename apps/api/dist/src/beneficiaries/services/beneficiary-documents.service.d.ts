import { PrismaService } from "../../prisma/prisma.service";
export declare class BeneficiaryDocumentsService {
    private prisma;
    constructor(prisma: PrismaService);
    getDocuments(user: any, ownerType: string, ownerId?: string): Promise<any>;
    createDocument(user: any, dto: any): Promise<any>;
    getDocumentById(user: any, docId: string): Promise<any>;
}
