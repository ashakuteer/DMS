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
        items: ({
            _count: {
                versions: number;
            };
            uploadedBy: {
                name: string;
                id: string;
            };
        } & {
            id: string;
            createdAt: Date;
            isActive: boolean;
            updatedAt: Date;
            description: string | null;
            title: string;
            category: import("@prisma/client").$Enums.NgoDocCategory;
            mimeType: string;
            sizeBytes: number;
            fileName: string;
            expiryDate: Date | null;
            filePath: string;
            currentVersion: number;
            uploadedById: string;
        })[];
        total: number;
        page: number;
        totalPages: number;
        stats: {
            totalDocs: number;
            expiredCount: number;
            expiringSoonCount: number;
            validCount: number;
            categoryBreakdown: {
                category: import("@prisma/client").$Enums.NgoDocCategory;
                count: number;
            }[];
        };
    }>;
    getStats(): Promise<{
        totalDocs: number;
        expiredCount: number;
        expiringSoonCount: number;
        validCount: number;
        categoryBreakdown: {
            category: import("@prisma/client").$Enums.NgoDocCategory;
            count: number;
        }[];
    }>;
    findOne(id: string, userId: string): Promise<{
        _count: {
            versions: number;
        };
        uploadedBy: {
            name: string;
            id: string;
        };
        versions: ({
            uploadedBy: {
                name: string;
                id: string;
            };
        } & {
            id: string;
            createdAt: Date;
            documentId: string;
            mimeType: string;
            sizeBytes: number;
            fileName: string;
            filePath: string;
            uploadedById: string;
            versionNumber: number;
            changeNote: string | null;
        })[];
    } & {
        id: string;
        createdAt: Date;
        isActive: boolean;
        updatedAt: Date;
        description: string | null;
        title: string;
        category: import("@prisma/client").$Enums.NgoDocCategory;
        mimeType: string;
        sizeBytes: number;
        fileName: string;
        expiryDate: Date | null;
        filePath: string;
        currentVersion: number;
        uploadedById: string;
    }>;
    upload(file: Express.Multer.File, data: {
        title: string;
        description?: string;
        category: string;
        expiryDate?: string;
    }, userId: string): Promise<{
        uploadedBy: {
            name: string;
            id: string;
        };
    } & {
        id: string;
        createdAt: Date;
        isActive: boolean;
        updatedAt: Date;
        description: string | null;
        title: string;
        category: import("@prisma/client").$Enums.NgoDocCategory;
        mimeType: string;
        sizeBytes: number;
        fileName: string;
        expiryDate: Date | null;
        filePath: string;
        currentVersion: number;
        uploadedById: string;
    }>;
    uploadNewVersion(id: string, file: Express.Multer.File, changeNote: string | undefined, userId: string): Promise<{
        uploadedBy: {
            name: string;
            id: string;
        };
    } & {
        id: string;
        createdAt: Date;
        isActive: boolean;
        updatedAt: Date;
        description: string | null;
        title: string;
        category: import("@prisma/client").$Enums.NgoDocCategory;
        mimeType: string;
        sizeBytes: number;
        fileName: string;
        expiryDate: Date | null;
        filePath: string;
        currentVersion: number;
        uploadedById: string;
    }>;
    update(id: string, data: {
        title?: string;
        description?: string;
        category?: string;
        expiryDate?: string | null;
    }, userId: string): Promise<{
        uploadedBy: {
            name: string;
            id: string;
        };
    } & {
        id: string;
        createdAt: Date;
        isActive: boolean;
        updatedAt: Date;
        description: string | null;
        title: string;
        category: import("@prisma/client").$Enums.NgoDocCategory;
        mimeType: string;
        sizeBytes: number;
        fileName: string;
        expiryDate: Date | null;
        filePath: string;
        currentVersion: number;
        uploadedById: string;
    }>;
    remove(id: string, userId: string): Promise<{
        message: string;
    }>;
    getFilePath(id: string, userId: string, versionId?: string): Promise<{
        fullPath: string;
        fileName: string;
        mimeType: string;
    }>;
    getAccessLog(id: string): Promise<({
        user: {
            name: string;
            id: string;
        };
    } & {
        id: string;
        userId: string;
        action: string;
        documentId: string;
        accessedAt: Date;
    })[]>;
    getExpiringDocuments(daysAhead?: number): Promise<({
        uploadedBy: {
            email: string;
            name: string;
            id: string;
        };
    } & {
        id: string;
        createdAt: Date;
        isActive: boolean;
        updatedAt: Date;
        description: string | null;
        title: string;
        category: import("@prisma/client").$Enums.NgoDocCategory;
        mimeType: string;
        sizeBytes: number;
        fileName: string;
        expiryDate: Date | null;
        filePath: string;
        currentVersion: number;
        uploadedById: string;
    })[]>;
    getExpiredDocuments(): Promise<({
        uploadedBy: {
            email: string;
            name: string;
            id: string;
        };
    } & {
        id: string;
        createdAt: Date;
        isActive: boolean;
        updatedAt: Date;
        description: string | null;
        title: string;
        category: import("@prisma/client").$Enums.NgoDocCategory;
        mimeType: string;
        sizeBytes: number;
        fileName: string;
        expiryDate: Date | null;
        filePath: string;
        currentVersion: number;
        uploadedById: string;
    })[]>;
}
