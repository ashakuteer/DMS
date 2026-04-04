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
    }, user: any): Promise<{
        createdBy: {
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        content: string;
        createdById: string;
        title: string;
        photos: string[];
        relatedBeneficiaryIds: string[];
        relatedHomeTypes: import(".prisma/client").$Enums.HomeType[];
        isDraft: boolean;
    }>;
    update(id: string, body: {
        title?: string;
        content?: string;
        photos?: string[];
        relatedBeneficiaryIds?: string[];
        relatedHomeTypes?: HomeType[];
        isDraft?: boolean;
    }): Promise<{
        createdBy: {
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        content: string;
        createdById: string;
        title: string;
        photos: string[];
        relatedBeneficiaryIds: string[];
        relatedHomeTypes: import(".prisma/client").$Enums.HomeType[];
        isDraft: boolean;
    }>;
    findAll(page?: string, limit?: string, draftsOnly?: string): Promise<{
        items: {
            beneficiaries: any[];
            dispatchCount: number;
            _count: {
                dispatches: number;
            };
            createdBy: {
                name: string;
            };
            id: string;
            createdAt: Date;
            updatedAt: Date;
            content: string;
            createdById: string;
            title: string;
            photos: string[];
            relatedBeneficiaryIds: string[];
            relatedHomeTypes: import(".prisma/client").$Enums.HomeType[];
            isDraft: boolean;
        }[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    searchDonors(search: string, limit?: string): Promise<{
        id: string;
        donorCode: string;
        firstName: string;
        lastName: string;
        primaryPhone: string;
        whatsappPhone: string;
        personalEmail: string;
        officialEmail: string;
    }[]>;
    getDonorsByHome(homeTypes: string): Promise<any[]>;
    getDonorsByBeneficiaries(ids: string): Promise<any[]>;
    getHistory(page?: string, limit?: string): Promise<{
        items: {
            id: string;
            updateTitle: string;
            updateId: string;
            donorName: string;
            donorCode: string;
            donorId: string;
            channel: import(".prisma/client").$Enums.SponsorDispatchChannel;
            status: import(".prisma/client").$Enums.SponsorDispatchStatus;
            sentAt: Date;
            createdAt: Date;
        }[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    findOne(id: string): Promise<{
        beneficiaries: any[];
        createdBy: {
            name: string;
        };
        dispatches: ({
            donor: {
                id: string;
                donorCode: string;
                firstName: string;
                lastName: string;
                whatsappPhone: string;
                personalEmail: string;
                officialEmail: string;
            };
        } & {
            error: string | null;
            id: string;
            createdAt: Date;
            donorId: string;
            channel: import(".prisma/client").$Enums.SponsorDispatchChannel;
            status: import(".prisma/client").$Enums.SponsorDispatchStatus;
            sentAt: Date | null;
            updateId: string;
        })[];
        id: string;
        createdAt: Date;
        updatedAt: Date;
        content: string;
        createdById: string;
        title: string;
        photos: string[];
        relatedBeneficiaryIds: string[];
        relatedHomeTypes: import(".prisma/client").$Enums.HomeType[];
        isDraft: boolean;
    }>;
    preview(id: string): Promise<{
        update: {
            beneficiaries: any[];
            createdBy: {
                name: string;
            };
            dispatches: ({
                donor: {
                    id: string;
                    donorCode: string;
                    firstName: string;
                    lastName: string;
                    whatsappPhone: string;
                    personalEmail: string;
                    officialEmail: string;
                };
            } & {
                error: string | null;
                id: string;
                createdAt: Date;
                donorId: string;
                channel: import(".prisma/client").$Enums.SponsorDispatchChannel;
                status: import(".prisma/client").$Enums.SponsorDispatchStatus;
                sentAt: Date | null;
                updateId: string;
            })[];
            id: string;
            createdAt: Date;
            updatedAt: Date;
            content: string;
            createdById: string;
            title: string;
            photos: string[];
            relatedBeneficiaryIds: string[];
            relatedHomeTypes: import(".prisma/client").$Enums.HomeType[];
            isDraft: boolean;
        };
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
