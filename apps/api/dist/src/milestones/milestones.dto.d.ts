import { HomeType } from '@prisma/client';
export declare class CreateMilestoneDto {
    title: string;
    date: string;
    description?: string;
    homeType?: HomeType;
    photos?: string[];
    isPublic?: boolean;
    sortOrder?: number;
}
export declare class UpdateMilestoneDto {
    title?: string;
    date?: string;
    description?: string;
    homeType?: HomeType;
    photos?: string[];
    isPublic?: boolean;
    sortOrder?: number;
}
