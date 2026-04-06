import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { Role, FamilyRelationType, OccasionType } from '@prisma/client';
export interface UserContext {
    id: string;
    email: string;
    name: string;
    role: Role;
}
interface CreateFamilyMemberDto {
    name: string;
    relationType: FamilyRelationType;
    birthMonth?: number;
    birthDay?: number;
    phone?: string;
    email?: string;
    notes?: string;
}
interface UpdateFamilyMemberDto {
    name?: string;
    relationType?: FamilyRelationType;
    birthMonth?: number;
    birthDay?: number;
    phone?: string;
    email?: string;
    notes?: string;
}
interface CreateSpecialOccasionDto {
    type: OccasionType;
    month: number;
    day: number;
    relatedPersonName?: string;
    notes?: string;
}
interface UpdateSpecialOccasionDto {
    type?: OccasionType;
    month?: number;
    day?: number;
    relatedPersonName?: string;
    notes?: string;
}
export declare class DonorRelationsService {
    private prisma;
    private auditService;
    constructor(prisma: PrismaService, auditService: AuditService);
    private canEdit;
    private normalizeName;
    private validateMonthDay;
    private verifyDonorAccess;
    getFamilyMembers(user: UserContext, donorId: string): Promise<{
        email: string | null;
        name: string;
        phone: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        donorId: string;
        notes: string | null;
        relationType: import("@prisma/client").$Enums.FamilyRelationType;
        birthMonth: number | null;
        birthDay: number | null;
    }[]>;
    createFamilyMember(user: UserContext, donorId: string, data: CreateFamilyMemberDto, ipAddress?: string, userAgent?: string): Promise<{
        email: string | null;
        name: string;
        phone: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        donorId: string;
        notes: string | null;
        relationType: import("@prisma/client").$Enums.FamilyRelationType;
        birthMonth: number | null;
        birthDay: number | null;
    }>;
    updateFamilyMember(user: UserContext, memberId: string, data: UpdateFamilyMemberDto, ipAddress?: string, userAgent?: string): Promise<{
        email: string | null;
        name: string;
        phone: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        donorId: string;
        notes: string | null;
        relationType: import("@prisma/client").$Enums.FamilyRelationType;
        birthMonth: number | null;
        birthDay: number | null;
    }>;
    deleteFamilyMember(user: UserContext, memberId: string, ipAddress?: string, userAgent?: string): Promise<{
        success: boolean;
    }>;
    getSpecialOccasions(user: UserContext, donorId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        donorId: string;
        type: import("@prisma/client").$Enums.OccasionType;
        notes: string | null;
        relatedPersonName: string | null;
        month: number;
        day: number;
    }[]>;
    createSpecialOccasion(user: UserContext, donorId: string, data: CreateSpecialOccasionDto, ipAddress?: string, userAgent?: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        donorId: string;
        type: import("@prisma/client").$Enums.OccasionType;
        notes: string | null;
        relatedPersonName: string | null;
        month: number;
        day: number;
    }>;
    updateSpecialOccasion(user: UserContext, occasionId: string, data: UpdateSpecialOccasionDto, ipAddress?: string, userAgent?: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        donorId: string;
        type: import("@prisma/client").$Enums.OccasionType;
        notes: string | null;
        relatedPersonName: string | null;
        month: number;
        day: number;
    }>;
    deleteSpecialOccasion(user: UserContext, occasionId: string, ipAddress?: string, userAgent?: string): Promise<{
        success: boolean;
    }>;
    getUpcomingSpecialOccasions(user: UserContext, donorId: string, days?: number): Promise<{
        nextOccurrence: string;
        daysUntil: number;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        donorId: string;
        type: import("@prisma/client").$Enums.OccasionType;
        notes: string | null;
        relatedPersonName: string | null;
        month: number;
        day: number;
    }[]>;
}
export {};
