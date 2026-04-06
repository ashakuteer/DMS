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
    findAll(includePrivate?: boolean): Promise<any>;
    findOne(id: string): Promise<any>;
    create(user: UserContext, dto: CreateMilestoneDto): Promise<any>;
    update(id: string, dto: UpdateMilestoneDto): Promise<any>;
    remove(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getForCommunication(): Promise<any>;
    seed(userId: string): Promise<{
        message: string;
        seeded: number;
    }>;
}
export {};
