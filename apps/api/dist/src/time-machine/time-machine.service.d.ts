import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { CreateTimeMachineEntryDto, UpdateTimeMachineEntryDto } from './time-machine.dto';
export declare class TimeMachineService {
    private readonly prisma;
    private readonly storageService;
    constructor(prisma: PrismaService, storageService: StorageService);
    findAll(params: {
        page?: number;
        limit?: number;
        category?: string;
        home?: string;
        search?: string;
        year?: number;
    }): Promise<{
        entries: ({
            createdBy: {
                name: string;
                id: string;
            };
        } & {
            home: import("@prisma/client").$Enums.TimeMachineHome;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            isPublic: boolean;
            description: string | null;
            createdById: string;
            title: string;
            category: import("@prisma/client").$Enums.TimeMachineCategory;
            eventDate: Date;
            photos: string[];
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findOne(id: string): Promise<{
        createdBy: {
            name: string;
            id: string;
        };
    } & {
        home: import("@prisma/client").$Enums.TimeMachineHome;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isPublic: boolean;
        description: string | null;
        createdById: string;
        title: string;
        category: import("@prisma/client").$Enums.TimeMachineCategory;
        eventDate: Date;
        photos: string[];
    }>;
    create(userId: string, dto: CreateTimeMachineEntryDto): Promise<{
        createdBy: {
            name: string;
            id: string;
        };
    } & {
        home: import("@prisma/client").$Enums.TimeMachineHome;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isPublic: boolean;
        description: string | null;
        createdById: string;
        title: string;
        category: import("@prisma/client").$Enums.TimeMachineCategory;
        eventDate: Date;
        photos: string[];
    }>;
    update(id: string, dto: UpdateTimeMachineEntryDto): Promise<{
        createdBy: {
            name: string;
            id: string;
        };
    } & {
        home: import("@prisma/client").$Enums.TimeMachineHome;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isPublic: boolean;
        description: string | null;
        createdById: string;
        title: string;
        category: import("@prisma/client").$Enums.TimeMachineCategory;
        eventDate: Date;
        photos: string[];
    }>;
    remove(id: string): Promise<{
        success: boolean;
    }>;
    uploadPhoto(id: string, file: Express.Multer.File): Promise<{
        url: string;
        photos: string[];
    }>;
    deletePhoto(id: string, photoUrl: string): Promise<{
        success: boolean;
        photos: string[];
    }>;
    getAvailableYears(): Promise<number[]>;
}
