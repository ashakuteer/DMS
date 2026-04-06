import { PrismaService } from '../prisma/prisma.service';
import { TaskStatus } from '@prisma/client';
import { CreateTaskDto, UpdateTaskDto, LogContactDto } from './tasks.dto';
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
        timeWindow?: string;
        assignedTo?: string;
        priority?: string;
        donorId?: string;
    }): Promise<any>;
    findOne(id: string): Promise<any>;
    updateStatus(id: string, status: TaskStatus): Promise<any>;
    updateTask(id: string, dto: UpdateTaskDto): Promise<any>;
    deleteTask(id: string): Promise<any>;
    logContact(taskId: string, dto: LogContactDto, userId: string): Promise<any>;
    getContactLogs(taskId: string): Promise<any>;
    getStaffList(): Promise<any>;
    getDebugInfo(): Promise<{
        serverTime: {
            nowUTC: string;
            todayMidnightUTC: string;
            end7UTC: string;
            nodeTimezone: string;
            utcOffset: number;
        };
        donors: {
            total: any;
            withDobData: any;
            withoutDobData: number;
        };
        occasions: any;
        taskSummary: any;
        birthdayTasks: {
            totalInDB: any;
            pendingNext7Days: any;
            pendingNext30Days: any;
            all: any;
        };
        anniversaryTasks: {
            totalInDB: any;
            all: any;
        };
        pledges: {
            pendingTotal: any;
            pendingDueIn30DaysOrOverdue: any;
            tasksGeneratedInDB: any;
            tasks: any;
        };
        filterWindowDates: {
            today: string;
            end7days: string;
            end30days: string;
        };
    }>;
    getToday(): Promise<{
        dueToday: any;
        overdue: any;
        total: any;
    }>;
}
