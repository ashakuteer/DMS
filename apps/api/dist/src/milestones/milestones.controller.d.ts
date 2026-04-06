import { MilestonesService } from './milestones.service';
import { CreateMilestoneDto, UpdateMilestoneDto } from './milestones.dto';
export declare class MilestonesController {
    private readonly milestonesService;
    constructor(milestonesService: MilestonesService);
    findAll(user: any): Promise<({
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
        homeType: import("@prisma/client").$Enums.HomeType | null;
        sortOrder: number;
        photos: string[];
    })[]>;
    getForCommunication(): Promise<{
        year: number;
        formattedDate: string;
        snippet: string;
        id: string;
        date: Date;
        description: string;
        title: string;
        homeType: import("@prisma/client").$Enums.HomeType;
        photos: string[];
    }[]>;
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
        homeType: import("@prisma/client").$Enums.HomeType | null;
        sortOrder: number;
        photos: string[];
    }>;
    create(user: any, dto: CreateMilestoneDto): Promise<{
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
        homeType: import("@prisma/client").$Enums.HomeType | null;
        sortOrder: number;
        photos: string[];
    }>;
    seed(user: any): Promise<{
        message: string;
        seeded: number;
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
        homeType: import("@prisma/client").$Enums.HomeType | null;
        sortOrder: number;
        photos: string[];
    }>;
    remove(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
