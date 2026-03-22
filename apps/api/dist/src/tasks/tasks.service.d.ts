import { PrismaService } from '../prisma/prisma.service';
import { TaskStatus } from '@prisma/client';
import { CreateTaskDto, UpdateTaskDto } from './tasks.dto';
export declare class TasksService {
    private prisma;
    constructor(prisma: PrismaService);
    private readonly includeRelations;
    private resolveStatus;
    private safeMapTask;
    create(dto: CreateTaskDto): Promise<{
        donor: {
            id: string;
            donorCode: string;
            firstName: string;
            lastName: string;
            primaryPhone: string;
        };
        beneficiary: {
            id: string;
            fullName: string;
        };
        assignedUser: {
            email: string;
            name: string;
            id: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        priority: import(".prisma/client").$Enums.TaskPriority;
        type: import(".prisma/client").$Enums.TaskType;
        status: import(".prisma/client").$Enums.TaskStatus;
        donorId: string | null;
        description: string | null;
        title: string;
        dueDate: Date;
        completedAt: Date | null;
        beneficiaryId: string | null;
        assignedTo: string | null;
    }>;
    findAll(query: {
        status?: string;
        type?: string;
        category?: string;
        dueDate?: string;
        assignedTo?: string;
        priority?: string;
    }): Promise<any[]>;
    findOne(id: string): Promise<any>;
    updateStatus(id: string, status: TaskStatus): Promise<any>;
    updateTask(id: string, dto: UpdateTaskDto): Promise<any>;
    deleteTask(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        priority: import(".prisma/client").$Enums.TaskPriority;
        type: import(".prisma/client").$Enums.TaskType;
        status: import(".prisma/client").$Enums.TaskStatus;
        donorId: string | null;
        description: string | null;
        title: string;
        dueDate: Date;
        completedAt: Date | null;
        beneficiaryId: string | null;
        assignedTo: string | null;
    }>;
    getStaffList(): Promise<{
        name: string;
        role: import(".prisma/client").$Enums.Role;
        id: string;
    }[]>;
    getToday(): Promise<{
        dueToday: any[];
        overdue: any[];
        total: number;
    }>;
}
