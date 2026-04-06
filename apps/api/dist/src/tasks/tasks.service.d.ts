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
                email: string;
                name: string;
                id: string;
            };
        };
        beneficiary: {
            id: string;
            fullName: string;
        };
        sourceOccasion: {
            id: string;
            type: import("@prisma/client").$Enums.OccasionType;
            relatedPersonName: string;
            month: number;
            day: number;
        };
        sourcePledge: {
            id: string;
            quantity: string;
            amount: import("@prisma/client/runtime/library").Decimal;
            pledgeType: import("@prisma/client").$Enums.PledgeType;
            expectedFulfillmentDate: Date;
        };
        assignedUser: {
            email: string;
            name: string;
            id: string;
        };
        sourceSponsorship: {
            beneficiary: {
                id: string;
                fullName: string;
            };
            id: string;
            sponsorshipType: import("@prisma/client").$Enums.SponsorshipType;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        priority: import("@prisma/client").$Enums.TaskPriority;
        donorId: string | null;
        type: import("@prisma/client").$Enums.TaskType;
        status: import("@prisma/client").$Enums.TaskStatus;
        description: string | null;
        title: string;
        dueDate: Date;
        completedAt: Date | null;
        beneficiaryId: string | null;
        assignedTo: string | null;
        sourceOccasionId: string | null;
        sourcePledgeId: string | null;
        autoWhatsAppPossible: boolean;
        manualRequired: boolean;
        sourceSponsorshipId: string | null;
        sourceFamilyMemberId: string | null;
        contactCount: number;
        lastContactedAt: Date | null;
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
        createdAt: Date;
        updatedAt: Date;
        priority: import("@prisma/client").$Enums.TaskPriority;
        donorId: string | null;
        type: import("@prisma/client").$Enums.TaskType;
        status: import("@prisma/client").$Enums.TaskStatus;
        description: string | null;
        title: string;
        dueDate: Date;
        completedAt: Date | null;
        beneficiaryId: string | null;
        assignedTo: string | null;
        sourceOccasionId: string | null;
        sourcePledgeId: string | null;
        autoWhatsAppPossible: boolean;
        manualRequired: boolean;
        sourceSponsorshipId: string | null;
        sourceFamilyMemberId: string | null;
        contactCount: number;
        lastContactedAt: Date | null;
    }>;
    logContact(taskId: string, dto: LogContactDto, userId: string): Promise<{
        id: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        createdAt: Date;
        subject: string | null;
        donorId: string;
        donationId: string | null;
        templateId: string | null;
        taskId: string | null;
        channel: import("@prisma/client").$Enums.CommunicationChannel;
        type: import("@prisma/client").$Enums.CommunicationType;
        status: import("@prisma/client").$Enums.CommunicationStatus;
        contactMethod: string | null;
        outcome: string | null;
        recipient: string | null;
        messagePreview: string | null;
        errorMessage: string | null;
        sentById: string | null;
    }>;
    getContactLogs(taskId: string): Promise<({
        sentBy: {
            name: string;
            id: string;
        };
    } & {
        id: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        createdAt: Date;
        subject: string | null;
        donorId: string;
        donationId: string | null;
        templateId: string | null;
        taskId: string | null;
        channel: import("@prisma/client").$Enums.CommunicationChannel;
        type: import("@prisma/client").$Enums.CommunicationType;
        status: import("@prisma/client").$Enums.CommunicationStatus;
        contactMethod: string | null;
        outcome: string | null;
        recipient: string | null;
        messagePreview: string | null;
        errorMessage: string | null;
        sentById: string | null;
    })[]>;
    getStaffList(): Promise<{
        name: string;
        role: import("@prisma/client").$Enums.Role;
        id: string;
    }[]>;
    getDebugInfo(): Promise<{
        serverTime: {
            nowUTC: string;
            todayMidnightUTC: string;
            end7UTC: string;
            nodeTimezone: string;
            utcOffset: number;
        };
        donors: {
            total: number;
            withDobData: number;
            withoutDobData: number;
        };
        occasions: {
            type: import("@prisma/client").$Enums.OccasionType;
            count: number;
        }[];
        taskSummary: {
            type: import("@prisma/client").$Enums.TaskType;
            status: import("@prisma/client").$Enums.TaskStatus;
            count: number;
        }[];
        birthdayTasks: {
            totalInDB: number;
            pendingNext7Days: number;
            pendingNext30Days: number;
            all: {
                id: string;
                title: string;
                dueDate: Date;
                dueDateISO: string;
                status: import("@prisma/client").$Enums.TaskStatus;
                daysUntil: number;
            }[];
        };
        anniversaryTasks: {
            totalInDB: number;
            all: {
                id: string;
                title: string;
                dueDate: Date;
                dueDateISO: string;
                status: import("@prisma/client").$Enums.TaskStatus;
                daysUntil: number;
            }[];
        };
        pledges: {
            pendingTotal: number;
            pendingDueIn30DaysOrOverdue: number;
            tasksGeneratedInDB: number;
            tasks: {
                id: string;
                title: string;
                dueDate: Date;
                dueDateISO: string;
                status: import("@prisma/client").$Enums.TaskStatus;
                sourcePledgeId: string;
                daysUntil: number;
            }[];
        };
        filterWindowDates: {
            today: string;
            end7days: string;
            end30days: string;
        };
    }>;
    getToday(): Promise<{
        dueToday: any[];
        overdue: any[];
        total: number;
    }>;
}
