import { TimeMachineService } from './time-machine.service';
import { CreateTimeMachineEntryDto, UpdateTimeMachineEntryDto } from './time-machine.dto';
export declare class TimeMachineController {
    private readonly timeMachineService;
    constructor(timeMachineService: TimeMachineService);
    findAll(page?: string, limit?: string, category?: string, home?: string, search?: string, year?: string): Promise<{
        entries: ({
            createdBy: {
                name: string;
                id: string;
            };
        } & {
            home: import(".prisma/client").$Enums.TimeMachineHome;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            isPublic: boolean;
            description: string | null;
            createdById: string;
            title: string;
            category: import(".prisma/client").$Enums.TimeMachineCategory;
            eventDate: Date;
            photos: string[];
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    getAvailableYears(): Promise<number[]>;
    findOne(id: string): Promise<{
        createdBy: {
            name: string;
            id: string;
        };
    } & {
        home: import(".prisma/client").$Enums.TimeMachineHome;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isPublic: boolean;
        description: string | null;
        createdById: string;
        title: string;
        category: import(".prisma/client").$Enums.TimeMachineCategory;
        eventDate: Date;
        photos: string[];
    }>;
    create(user: any, dto: CreateTimeMachineEntryDto): Promise<{
        createdBy: {
            name: string;
            id: string;
        };
    } & {
        home: import(".prisma/client").$Enums.TimeMachineHome;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isPublic: boolean;
        description: string | null;
        createdById: string;
        title: string;
        category: import(".prisma/client").$Enums.TimeMachineCategory;
        eventDate: Date;
        photos: string[];
    }>;
    update(id: string, dto: UpdateTimeMachineEntryDto): Promise<{
        createdBy: {
            name: string;
            id: string;
        };
    } & {
        home: import(".prisma/client").$Enums.TimeMachineHome;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isPublic: boolean;
        description: string | null;
        createdById: string;
        title: string;
        category: import(".prisma/client").$Enums.TimeMachineCategory;
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
    deletePhoto(id: string, body: {
        photoUrl: string;
    }): Promise<{
        success: boolean;
        photos: string[];
    }>;
}
