import { PrismaService } from '../prisma/prisma.service';
export declare class NgoDocumentsService {
    private prisma;
    private readonly logger;
    private readonly uploadDir;
    constructor(prisma: PrismaService);
    findAll(params: {
        category?: string;
        search?: string;
        expiryStatus?: string;
        page: number;
        limit: number;
    }): Promise<{
        items: any;
        total: any;
        page: number;
        totalPages: number;
        stats: {
            totalDocs: any;
            expiredCount: any;
            expiringSoonCount: any;
            validCount: number;
            categoryBreakdown: any;
        };
    }>;
    getStats(): Promise<{
        totalDocs: any;
        expiredCount: any;
        expiringSoonCount: any;
        validCount: number;
        categoryBreakdown: any;
    }>;
    findOne(id: string, userId: string): Promise<any>;
    upload(file: Express.Multer.File, data: {
        title: string;
        description?: string;
        category: string;
        expiryDate?: string;
    }, userId: string): Promise<any>;
    uploadNewVersion(id: string, file: Express.Multer.File, changeNote: string | undefined, userId: string): Promise<any>;
    update(id: string, data: {
        title?: string;
        description?: string;
        category?: string;
        expiryDate?: string | null;
    }, userId: string): Promise<any>;
    remove(id: string, userId: string): Promise<{
        message: string;
    }>;
    getFilePath(id: string, userId: string, versionId?: string): Promise<{
        fullPath: string;
        fileName: string;
        mimeType: string;
    }>;
    getAccessLog(id: string): Promise<any>;
    getExpiringDocuments(daysAhead?: number): Promise<any>;
    getExpiredDocuments(): Promise<any>;
}
