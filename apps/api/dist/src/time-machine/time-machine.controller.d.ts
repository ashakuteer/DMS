import { TimeMachineService } from './time-machine.service';
import { CreateTimeMachineEntryDto, UpdateTimeMachineEntryDto } from './time-machine.dto';
export declare class TimeMachineController {
    private readonly timeMachineService;
    constructor(timeMachineService: TimeMachineService);
    findAll(page?: string, limit?: string, category?: string, home?: string, search?: string, year?: string): Promise<{
        entries: any;
        total: any;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    getAvailableYears(): Promise<unknown[]>;
    findOne(id: string): Promise<any>;
    create(user: any, dto: CreateTimeMachineEntryDto): Promise<any>;
    update(id: string, dto: UpdateTimeMachineEntryDto): Promise<any>;
    remove(id: string): Promise<{
        success: boolean;
    }>;
    uploadPhoto(id: string, file: Express.Multer.File): Promise<{
        url: string;
        photos: any;
    }>;
    deletePhoto(id: string, body: {
        photoUrl: string;
    }): Promise<{
        success: boolean;
        photos: any;
    }>;
}
