import { TemplatesService, CreateTemplateDto, UpdateTemplateDto } from './templates.service';
export declare class TemplatesController {
    private readonly templatesService;
    constructor(templatesService: TemplatesService);
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
        type: import(".prisma/client").$Enums.TemplateType;
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
        type: import(".prisma/client").$Enums.TemplateType;
        description: string | null;
        whatsappMessage: string;
        emailSubject: string;
        emailBody: string;
        createdById: string;
        updatedById: string | null;
    }>;
    create(dto: CreateTemplateDto, req: any): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        isActive: boolean;
        updatedAt: Date;
        type: import(".prisma/client").$Enums.TemplateType;
        description: string | null;
        whatsappMessage: string;
        emailSubject: string;
        emailBody: string;
        createdById: string;
        updatedById: string | null;
    }>;
    update(id: string, dto: UpdateTemplateDto, req: any): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        isActive: boolean;
        updatedAt: Date;
        type: import(".prisma/client").$Enums.TemplateType;
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
    seed(req: any): Promise<{
        success: boolean;
        message: string;
    }>;
    resolveTemplate(body: {
        template: string;
        data: {
            donorName?: string;
            amount?: string;
            donationDate?: string;
            programName?: string;
            receiptNumber?: string;
        };
    }): Promise<{
        resolved: string;
    }>;
}
