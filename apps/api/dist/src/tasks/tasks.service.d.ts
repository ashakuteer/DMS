import { PrismaService } from '../prisma/prisma.service';
import { TaskStatus } from '@prisma/client';
import { CreateTaskDto, UpdateTaskDto } from './tasks.dto';
export declare class TasksService {
    private prisma;
    constructor(prisma: PrismaService);
    private readonly includeRelations;
    private resolveStatus;
    private safeMapTask;
    create(dto: CreateTaskDto): Promise<any>;
    findAll(query: {
        status?: string;
        type?: string;
        category?: string;
        dueDate?: string;
        assignedTo?: string;
        priority?: string;
    }): Promise<any>;
    findOne(id: string): Promise<any>;
    updateStatus(id: string, status: TaskStatus): Promise<any>;
    updateTask(id: string, dto: UpdateTaskDto): Promise<any>;
    deleteTask(id: string): Promise<any>;
    getStaffList(): Promise<any>;
    getToday(): Promise<{
        dueToday: any;
        overdue: any;
        total: any;
    }>;
}
