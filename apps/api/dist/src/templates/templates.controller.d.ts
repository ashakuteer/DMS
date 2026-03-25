import { TemplatesService, CreateTemplateDto, UpdateTemplateDto } from './templates.service';
export declare class TemplatesController {
    private readonly templatesService;
    constructor(templatesService: TemplatesService);
    findAll(): Promise<any>;
    findOne(id: string): Promise<any>;
    create(dto: CreateTemplateDto, req: any): Promise<any>;
    update(id: string, dto: UpdateTemplateDto, req: any): Promise<any>;
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
