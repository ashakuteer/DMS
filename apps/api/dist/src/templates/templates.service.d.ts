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
    findAll(): Promise<({
        createdBy: {
            name: string;
            id: string;
        };
        updatedBy: {
            name: string;
            id: string;
        };
    } & {
        name: string;
        id: string;
        createdAt: Date;
        isActive: boolean;
        updatedAt: Date;
        type: import("@prisma/client").$Enums.TemplateType;
        description: string | null;
        whatsappMessage: string;
        emailSubject: string;
        emailBody: string;
        createdById: string;
        updatedById: string | null;
    })[]>;
    findOne(id: string): Promise<{
        createdBy: {
            name: string;
            id: string;
        };
        updatedBy: {
            name: string;
            id: string;
        };
    } & {
        name: string;
        id: string;
        createdAt: Date;
        isActive: boolean;
        updatedAt: Date;
        type: import("@prisma/client").$Enums.TemplateType;
        description: string | null;
        whatsappMessage: string;
        emailSubject: string;
        emailBody: string;
        createdById: string;
        updatedById: string | null;
    }>;
    findByType(type: TemplateType): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        isActive: boolean;
        updatedAt: Date;
        type: import("@prisma/client").$Enums.TemplateType;
        description: string | null;
        whatsappMessage: string;
        emailSubject: string;
        emailBody: string;
        createdById: string;
        updatedById: string | null;
    }>;
    create(dto: CreateTemplateDto, userId: string): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        isActive: boolean;
        updatedAt: Date;
        type: import("@prisma/client").$Enums.TemplateType;
        description: string | null;
        whatsappMessage: string;
        emailSubject: string;
        emailBody: string;
        createdById: string;
        updatedById: string | null;
    }>;
    update(id: string, dto: UpdateTemplateDto, userId: string): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        isActive: boolean;
        updatedAt: Date;
        type: import("@prisma/client").$Enums.TemplateType;
        description: string | null;
        whatsappMessage: string;
        emailSubject: string;
        emailBody: string;
        createdById: string;
        updatedById: string | null;
    }>;
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
