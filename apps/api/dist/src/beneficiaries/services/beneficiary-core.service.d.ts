import { PrismaService } from "../../prisma/prisma.service";
import { AuditService } from "../../audit/audit.service";
import { RolePermissionsService } from "../../role-permissions/role-permissions.service";
export declare class BeneficiaryCoreService {
    private prisma;
    private auditService;
    private rolePermissionsService;
    constructor(prisma: PrismaService, auditService: AuditService, rolePermissionsService: RolePermissionsService);
    private generateBeneficiaryCode;
    quickSearch(q: string): Promise<any>;
    findAll(options: any): Promise<{
        data: any;
        pagination: {
            total: any;
            page: any;
            limit: any;
            totalPages: number;
        };
    }>;
    findById(id: string): Promise<any>;
    create(user: any, dto: any): Promise<any>;
    update(user: any, id: string, dto: any): Promise<any>;
    updatePhoto(id: string, url: string | null, path: string | null): Promise<any>;
    getTimelineEvents(beneficiaryId: string): Promise<any>;
    addTimelineEvent(beneficiaryId: string, dto: any): Promise<any>;
    delete(user: any, id: string, deleteReason?: string): Promise<{
        success: boolean;
    }>;
    restore(user: any, id: string): Promise<{
        success: boolean;
    }>;
    findArchived(user: any, search?: string, page?: number, limit?: number): Promise<{
        data: any;
        pagination: {
            total: any;
            page: number;
            limit: number;
            pages: number;
        };
    }>;
}
