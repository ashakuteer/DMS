import { MilestonesService } from './milestones.service';
import { CreateMilestoneDto, UpdateMilestoneDto } from './milestones.dto';
export declare class MilestonesController {
    private readonly milestonesService;
    constructor(milestonesService: MilestonesService);
    findAll(user: any): Promise<any>;
    getForCommunication(): Promise<any>;
    findOne(id: string): Promise<any>;
    create(user: any, dto: CreateMilestoneDto): Promise<any>;
    seed(user: any): Promise<{
        message: string;
        seeded: number;
    }>;
    update(id: string, dto: UpdateMilestoneDto): Promise<any>;
    remove(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
