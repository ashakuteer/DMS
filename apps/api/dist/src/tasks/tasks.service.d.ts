import { PrismaService } from '../prisma/prisma.service';
import { TaskStatus } from '@prisma/client';
import { CreateTaskDto, UpdateTaskDto, LogContactDto } from './tasks.dto';
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
            whatsappPhone: string;
            prefWhatsapp: boolean;
            assignedToUser: {
                id: string;
                email: string;
                name: string;
            };
        };
        beneficiary: {
            id: string;
            fullName: string;
        };
        assignedUser: {
            id: string;
            email: string;
            name: string;
        };
        sourceOccasion: {
            id: string;
            type: import(".prisma/client").$Enums.OccasionType;
            relatedPersonName: string;
            month: number;
            day: number;
        };
        sourceSponsorship: {
            id: string;
            beneficiary: {
                id: string;
                fullName: string;
            };
            sponsorshipType: import(".prisma/client").$Enums.SponsorshipType;
        };
        sourcePledge: {
            id: string;
            amount: import("@prisma/client/runtime/library").Decimal;
            pledgeType: import(".prisma/client").$Enums.PledgeType;
            expectedFulfillmentDate: Date;
        };
    } & {
        id: string;
        title: string;
        description: string | null;
        type: import(".prisma/client").$Enums.TaskType;
        status: import(".prisma/client").$Enums.TaskStatus;
        priority: import(".prisma/client").$Enums.TaskPriority;
        dueDate: Date;
        completedAt: Date | null;
        donorId: string | null;
        beneficiaryId: string | null;
        assignedTo: string | null;
        autoWhatsAppPossible: boolean;
        manualRequired: boolean;
        sourceOccasionId: string | null;
        sourceSponsorshipId: string | null;
        sourcePledgeId: string | null;
        contactCount: number;
        lastContactedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    findAll(query: {
        status?: string;
        type?: string;
        category?: string;
        dueDate?: string;
        timeWindow?: string;
        assignedTo?: string;
        priority?: string;
        donorId?: string;
    }): Promise<any[]>;
    findOne(id: string): Promise<any>;
    updateStatus(id: string, status: TaskStatus): Promise<any>;
    updateTask(id: string, dto: UpdateTaskDto): Promise<any>;
    deleteTask(id: string): Promise<{
        id: string;
        title: string;
        description: string | null;
        type: import(".prisma/client").$Enums.TaskType;
        status: import(".prisma/client").$Enums.TaskStatus;
        priority: import(".prisma/client").$Enums.TaskPriority;
        dueDate: Date;
        completedAt: Date | null;
        donorId: string | null;
        beneficiaryId: string | null;
        assignedTo: string | null;
        autoWhatsAppPossible: boolean;
        manualRequired: boolean;
        sourceOccasionId: string | null;
        sourceSponsorshipId: string | null;
        sourcePledgeId: string | null;
        contactCount: number;
        lastContactedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    logContact(taskId: string, dto: LogContactDto, userId: string): Promise<{
        id: string;
        type: import(".prisma/client").$Enums.CommunicationType;
        status: import(".prisma/client").$Enums.CommunicationStatus;
        donorId: string;
        createdAt: Date;
        donationId: string | null;
        templateId: string | null;
        taskId: string | null;
        channel: import(".prisma/client").$Enums.CommunicationChannel;
        contactMethod: string | null;
        outcome: string | null;
        recipient: string | null;
        subject: string | null;
        messagePreview: string | null;
        errorMessage: string | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        sentById: string | null;
    }>;
    getContactLogs(taskId: string): Promise<({
        sentBy: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        type: import(".prisma/client").$Enums.CommunicationType;
        status: import(".prisma/client").$Enums.CommunicationStatus;
        donorId: string;
        createdAt: Date;
        donationId: string | null;
        templateId: string | null;
        taskId: string | null;
        channel: import(".prisma/client").$Enums.CommunicationChannel;
        contactMethod: string | null;
        outcome: string | null;
        recipient: string | null;
        subject: string | null;
        messagePreview: string | null;
        errorMessage: string | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        sentById: string | null;
    })[]>;
    getStaffList(): Promise<{
        id: string;
        name: string;
        role: import(".prisma/client").$Enums.Role;
    }[]>;
    getToday(): Promise<{
        dueToday: any[];
        overdue: any[];
        total: number;
    }>;
}
