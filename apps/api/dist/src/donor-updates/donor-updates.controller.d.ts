import { DonorUpdatesService } from './donor-updates.service';
import { HomeType } from '@prisma/client';
export declare class DonorUpdatesController {
    private readonly donorUpdatesService;
    constructor(donorUpdatesService: DonorUpdatesService);
    create(body: {
        title: string;
        content: string;
        photos?: string[];
        relatedBeneficiaryIds?: string[];
        relatedHomeTypes?: HomeType[];
        isDraft?: boolean;
    }, user: any): Promise<any>;
    update(id: string, body: {
        title?: string;
        content?: string;
        photos?: string[];
        relatedBeneficiaryIds?: string[];
        relatedHomeTypes?: HomeType[];
        isDraft?: boolean;
    }): Promise<any>;
    findAll(page?: string, limit?: string, draftsOnly?: string): Promise<{
        items: any[];
        total: any;
        page: number;
        totalPages: number;
    }>;
    searchDonors(search: string, limit?: string): Promise<any>;
    getDonorsByHome(homeTypes: string): Promise<any[]>;
    getDonorsByBeneficiaries(ids: string): Promise<any[]>;
    getHistory(page?: string, limit?: string): Promise<{
        items: any;
        total: any;
        page: number;
        totalPages: number;
    }>;
    findOne(id: string): Promise<any>;
    preview(id: string): Promise<{
        update: any;
        emailHtml: string;
        whatsappText: string;
        emailSubject: string;
    }>;
    send(id: string, body: {
        donorIds: string[];
        channel: 'EMAIL' | 'WHATSAPP';
    }, user: any): Promise<{
        sent: number;
        failed: number;
        errors: string[];
        message: string;
    }>;
    delete(id: string): Promise<{
        message: string;
    }>;
}
