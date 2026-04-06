import { DonorRelationsService, UserContext } from './donor-relations.service';
import { Request } from 'express';
export declare class DonorRelationsController {
    private readonly donorRelationsService;
    constructor(donorRelationsService: DonorRelationsService);
    private getClientInfo;
    getFamilyMembers(user: UserContext, donorId: string): Promise<any>;
    createFamilyMember(user: UserContext, donorId: string, data: any, req: Request): Promise<any>;
    updateFamilyMember(user: UserContext, id: string, data: any, req: Request): Promise<any>;
    deleteFamilyMember(user: UserContext, id: string, req: Request): Promise<{
        success: boolean;
    }>;
    getSpecialOccasions(user: UserContext, donorId: string): Promise<any>;
    getUpcomingSpecialOccasions(user: UserContext, donorId: string, days?: string): Promise<any>;
    createSpecialOccasion(user: UserContext, donorId: string, data: any, req: Request): Promise<any>;
    updateSpecialOccasion(user: UserContext, id: string, data: any, req: Request): Promise<any>;
    deleteSpecialOccasion(user: UserContext, id: string, req: Request): Promise<{
        success: boolean;
    }>;
}
