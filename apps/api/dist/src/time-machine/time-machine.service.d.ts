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
        entries: any;
        total: any;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findOne(id: string): Promise<any>;
    create(userId: string, dto: CreateTimeMachineEntryDto): Promise<any>;
    update(id: string, dto: UpdateTimeMachineEntryDto): Promise<any>;
    remove(id: string): Promise<{
        success: boolean;
    }>;
    uploadPhoto(id: string, file: Express.Multer.File): Promise<{
        url: string;
        photos: any;
    }>;
    deletePhoto(id: string, photoUrl: string): Promise<{
        success: boolean;
        photos: any;
    }>;
    getAvailableYears(): Promise<unknown[]>;
}
