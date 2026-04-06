import { PrismaService } from "../prisma/prisma.service";
import { TemplateType } from "@prisma/client";
import { OrganizationProfileService } from "../organization-profile/organization-profile.service";
export interface CreateTemplateDto {
    type: TemplateType;
    name: string;
    description?: string;
    whatsappMessage: string;
    emailSubject: string;
    emailBody: string;
}
export interface UpdateTemplateDto {
    name?: string;
    description?: string;
    whatsappMessage?: string;
    emailSubject?: string;
    emailBody?: string;
    isActive?: boolean;
}
export declare class TemplatesService {
    private prisma;
    private orgProfileService;
    constructor(prisma: PrismaService, orgProfileService: OrganizationProfileService);
    findAll(): Promise<any>;
    findOne(id: string): Promise<any>;
    findByType(type: TemplateType): Promise<any>;
    create(dto: CreateTemplateDto, userId: string): Promise<any>;
    update(id: string, dto: UpdateTemplateDto, userId: string): Promise<any>;
    delete(id: string): Promise<{
        success: boolean;
    }>;
    resolvePlaceholders(template: string, data: {
        donorName?: string;
        amount?: string;
        donationDate?: string;
        programName?: string;
        receiptNumber?: string;
    }): string;
    resolveWithOrgProfile(template: string, data: {
        donorName?: string;
        amount?: string;
        donationDate?: string;
        programName?: string;
        receiptNumber?: string;
    }): Promise<string>;
    seedDefaultTemplates(userId: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
