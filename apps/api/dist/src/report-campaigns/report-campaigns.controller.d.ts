import { ReportCampaignsService } from './report-campaigns.service';
import { StorageService } from '../storage/storage.service';
export declare class ReportCampaignsController {
    private readonly service;
    private readonly storageService;
    constructor(service: ReportCampaignsService, storageService: StorageService);
    findAll(): Promise<any>;
    searchDonors(query: string): Promise<any>;
    findOne(id: string): Promise<any>;
    getCampaignDonors(id: string): Promise<any>;
    create(body: {
        name: string;
        type: 'QUARTERLY' | 'ANNUAL' | 'AUDIT' | 'EVENT';
        periodStart: string;
        periodEnd: string;
        target: string;
        customDonorIds?: string[];
        notes?: string;
    }, user: any): Promise<any>;
    attachDocument(id: string, file: Express.Multer.File, body: {
        title?: string;
    }, user: any): Promise<any>;
    send(id: string, user: any): Promise<{
        success: boolean;
        message: string;
        emailCount: number;
    }>;
    getWhatsAppText(id: string): Promise<{
        text: string;
        reportUrl: any;
    }>;
    markWhatsAppSent(id: string, donorId: string, user: any): Promise<{
        success: boolean;
    }>;
}
