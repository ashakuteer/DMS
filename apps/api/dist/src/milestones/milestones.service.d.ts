import { PrismaService } from '../prisma/prisma.service';
import { OrganizationProfileService } from '../organization-profile/organization-profile.service';
import { CreateMilestoneDto, UpdateMilestoneDto } from './milestones.dto';
interface UserContext {
    id: string;
    email: string;
    role: string;
}
export declare class MilestonesService {
    private prisma;
    private orgProfileService;
    private readonly logger;
    constructor(prisma: PrismaService, orgProfileService: OrganizationProfileService);
    findAll(includePrivate?: boolean): Promise<({
        createdBy: {
            name: string;
            id: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        date: Date;
        isPublic: boolean;
        description: string | null;
        createdById: string;
        title: string;
        homeType: import(".prisma/client").$Enums.HomeType | null;
        sortOrder: number;
        photos: string[];
    })[]>;
    findOne(id: string): Promise<{
        createdBy: {
            name: string;
            id: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        date: Date;
        isPublic: boolean;
        description: string | null;
        createdById: string;
        title: string;
        homeType: import(".prisma/client").$Enums.HomeType | null;
        sortOrder: number;
        photos: string[];
    }>;
    create(user: UserContext, dto: CreateMilestoneDto): Promise<{
        createdBy: {
            name: string;
            id: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        date: Date;
        isPublic: boolean;
        description: string | null;
        createdById: string;
        title: string;
        homeType: import(".prisma/client").$Enums.HomeType | null;
        sortOrder: number;
        photos: string[];
    }>;
    update(id: string, dto: UpdateMilestoneDto): Promise<{
        createdBy: {
            name: string;
            id: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        date: Date;
        isPublic: boolean;
        description: string | null;
        createdById: string;
        title: string;
        homeType: import(".prisma/client").$Enums.HomeType | null;
        sortOrder: number;
        photos: string[];
    }>;
    remove(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getForCommunication(): Promise<{
        year: number;
        formattedDate: string;
        snippet: string;
        id: string;
        date: Date;
        description: string;
        title: string;
        homeType: import(".prisma/client").$Enums.HomeType;
        photos: string[];
    }[]>;
    seed(userId: string): Promise<{
        message: string;
        seeded: number;
    }>;
}
export {};
