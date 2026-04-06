import { PrismaService } from '../prisma/prisma.service';
import { EmailJobsService } from '../email-jobs/email-jobs.service';
import { CommunicationLogService } from '../communication-log/communication-log.service';
import { HomeType } from '@prisma/client';
interface CreateDonorUpdateDto {
    title: string;
    content: string;
    photos?: string[];
    relatedBeneficiaryIds?: string[];
    relatedHomeTypes?: HomeType[];
    isDraft?: boolean;
}
interface SendDonorUpdateDto {
    donorIds: string[];
    channel: 'EMAIL' | 'WHATSAPP';
}
interface UserContext {
    id: string;
    email: string;
    role: string;
    name?: string;
}
export declare class DonorUpdatesService {
    private prisma;
    private emailJobsService;
    private communicationLogService;
    private readonly logger;
    constructor(prisma: PrismaService, emailJobsService: EmailJobsService, communicationLogService: CommunicationLogService);
    create(dto: CreateDonorUpdateDto, user: UserContext): Promise<{
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
        relatedHomeTypes: import("@prisma/client").$Enums.HomeType[];
        isDraft: boolean;
    }>;
    update(id: string, dto: Partial<CreateDonorUpdateDto>): Promise<{
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
        relatedHomeTypes: import("@prisma/client").$Enums.HomeType[];
        isDraft: boolean;
    }>;
    findAll(page?: number, limit?: number, draftsOnly?: boolean): Promise<{
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
            relatedHomeTypes: import("@prisma/client").$Enums.HomeType[];
            isDraft: boolean;
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
            channel: import("@prisma/client").$Enums.SponsorDispatchChannel;
            status: import("@prisma/client").$Enums.SponsorDispatchStatus;
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
        relatedHomeTypes: import("@prisma/client").$Enums.HomeType[];
        isDraft: boolean;
    }>;
    delete(id: string): Promise<{
        message: string;
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
                channel: import("@prisma/client").$Enums.SponsorDispatchChannel;
                status: import("@prisma/client").$Enums.SponsorDispatchStatus;
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
            relatedHomeTypes: import("@prisma/client").$Enums.HomeType[];
            isDraft: boolean;
        };
        emailHtml: string;
        whatsappText: string;
        emailSubject: string;
    }>;
    searchDonors(search: string, limit?: number): Promise<{
        id: string;
        donorCode: string;
        firstName: string;
        lastName: string;
        primaryPhone: string;
        whatsappPhone: string;
        personalEmail: string;
        officialEmail: string;
    }[]>;
    send(id: string, dto: SendDonorUpdateDto, user: UserContext): Promise<{
        sent: number;
        failed: number;
        errors: string[];
        message: string;
    }>;
    getHistory(page?: number, limit?: number): Promise<{
        items: {
            id: string;
            updateTitle: string;
            updateId: string;
            donorName: string;
            donorCode: string;
            donorId: string;
            channel: import("@prisma/client").$Enums.SponsorDispatchChannel;
            status: import("@prisma/client").$Enums.SponsorDispatchStatus;
            sentAt: Date;
            createdAt: Date;
        }[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    getDonorsByHome(homeTypes: HomeType[]): Promise<any[]>;
    getDonorsByBeneficiaries(beneficiaryIds: string[]): Promise<any[]>;
}
export {};
