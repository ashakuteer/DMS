import { NgoDocumentsService } from './ngo-documents.service';
import { Response } from 'express';
export declare class NgoDocumentsController {
    private ngoDocumentsService;
    constructor(ngoDocumentsService: NgoDocumentsService);
    findAll(category: string, search: string, expiryStatus: string, page: string, limit: string): Promise<{
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
    getExpiring(days: string): Promise<any>;
    findOne(id: string, req: any): Promise<any>;
    download(id: string, versionId: string, req: any, res: Response): Promise<void>;
    getAccessLog(id: string): Promise<any>;
    upload(file: Express.Multer.File, title: string, description: string, category: string, expiryDate: string, req: any): Promise<any>;
    uploadVersion(id: string, file: Express.Multer.File, changeNote: string, req: any): Promise<any>;
    update(id: string, body: {
        title?: string;
        description?: string;
        category?: string;
        expiryDate?: string | null;
    }, req: any): Promise<any>;
    remove(id: string, req: any): Promise<{
        message: string;
    }>;
}
