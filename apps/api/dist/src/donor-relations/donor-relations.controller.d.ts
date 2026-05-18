import { DonorRelationsService, UserContext } from './donor-relations.service';
import { Request } from 'express';
export declare class DonorRelationsController {
    private readonly donorRelationsService;
    constructor(donorRelationsService: DonorRelationsService);
    private getClientInfo;
    getFamilyMembers(user: UserContext, donorId: string): Promise<{
        email: string | null;
        name: string;
        phone: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        donorId: string;
        notes: string | null;
        relationType: import(".prisma/client").$Enums.FamilyRelationType;
        birthMonth: number | null;
        birthDay: number | null;
    }[]>;
    createFamilyMember(user: UserContext, donorId: string, data: any, req: Request): Promise<{
        email: string | null;
        name: string;
        phone: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        donorId: string;
        notes: string | null;
        relationType: import(".prisma/client").$Enums.FamilyRelationType;
        birthMonth: number | null;
        birthDay: number | null;
    }>;
    updateFamilyMember(user: UserContext, id: string, data: any, req: Request): Promise<{
        email: string | null;
        name: string;
        phone: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        donorId: string;
        notes: string | null;
        relationType: import(".prisma/client").$Enums.FamilyRelationType;
        birthMonth: number | null;
        birthDay: number | null;
    }>;
    deleteFamilyMember(user: UserContext, id: string, req: Request): Promise<{
        success: boolean;
    }>;
    getSpecialOccasions(user: UserContext, donorId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        day: number;
        donorId: string;
        type: import(".prisma/client").$Enums.OccasionType;
        notes: string | null;
        relatedPersonName: string | null;
        month: number;
    }[]>;
    getUpcomingSpecialOccasions(user: UserContext, donorId: string, days?: string): Promise<{
        nextOccurrence: string;
        daysUntil: number;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        day: number;
        donorId: string;
        type: import(".prisma/client").$Enums.OccasionType;
        notes: string | null;
        relatedPersonName: string | null;
        month: number;
    }[]>;
    createSpecialOccasion(user: UserContext, donorId: string, data: any, req: Request): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        day: number;
        donorId: string;
        type: import(".prisma/client").$Enums.OccasionType;
        notes: string | null;
        relatedPersonName: string | null;
        month: number;
    }>;
    updateSpecialOccasion(user: UserContext, id: string, data: any, req: Request): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        day: number;
        donorId: string;
        type: import(".prisma/client").$Enums.OccasionType;
        notes: string | null;
        relatedPersonName: string | null;
        month: number;
    }>;
    deleteSpecialOccasion(user: UserContext, id: string, req: Request): Promise<{
        success: boolean;
    }>;
}
