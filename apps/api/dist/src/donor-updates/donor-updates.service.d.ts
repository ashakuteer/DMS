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
    create(dto: CreateDonorUpdateDto, user: UserContext): Promise<any>;
    update(id: string, dto: Partial<CreateDonorUpdateDto>): Promise<any>;
    findAll(page?: number, limit?: number, draftsOnly?: boolean): Promise<{
        items: any[];
        total: any;
        page: number;
        totalPages: number;
    }>;
    findOne(id: string): Promise<any>;
    delete(id: string): Promise<{
        message: string;
    }>;
    preview(id: string): Promise<{
        update: any;
        emailHtml: string;
        whatsappText: string;
        emailSubject: string;
    }>;
    searchDonors(search: string, limit?: number): Promise<any>;
    send(id: string, dto: SendDonorUpdateDto, user: UserContext): Promise<{
        sent: number;
        failed: number;
        errors: string[];
        message: string;
    }>;
    getHistory(page?: number, limit?: number): Promise<{
        items: any;
        total: any;
        page: number;
        totalPages: number;
    }>;
    getDonorsByHome(homeTypes: HomeType[]): Promise<any[]>;
    getDonorsByBeneficiaries(beneficiaryIds: string[]): Promise<any[]>;
}
export {};
