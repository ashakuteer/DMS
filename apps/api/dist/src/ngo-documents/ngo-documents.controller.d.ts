import { NgoDocumentsService } from './ngo-documents.service';
import { Response } from 'express';
export declare class NgoDocumentsController {
    private ngoDocumentsService;
    constructor(ngoDocumentsService: NgoDocumentsService);
    findAll(category: string, search: string, expiryStatus: string, page: string, limit: string): Promise<{
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
    getExpiring(days: string): Promise<({
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
    findOne(id: string, req: any): Promise<{
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
    download(id: string, versionId: string, req: any, res: Response): Promise<void>;
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
    upload(file: Express.Multer.File, title: string, description: string, category: string, expiryDate: string, req: any): Promise<{
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
    uploadVersion(id: string, file: Express.Multer.File, changeNote: string, req: any): Promise<{
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
    update(id: string, body: {
        title?: string;
        description?: string;
        category?: string;
        expiryDate?: string | null;
    }, req: any): Promise<{
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
    remove(id: string, req: any): Promise<{
        message: string;
    }>;
}
