import { FollowUpsService } from './follow-ups.service';
export declare class FollowUpsController {
    private followUpsService;
    constructor(followUpsService: FollowUpsService);
    findAll(status: string, assignedToId: string, donorId: string, priority: string, dueBefore: string, dueAfter: string, page: string, limit: string, req: any): Promise<{
        items: ({
            donor: {
                id: string;
                donorCode: string;
                firstName: string;
                lastName: string;
                primaryPhone: string;
                personalEmail: string;
                officialEmail: string;
            };
            createdBy: {
                name: string;
                id: string;
            };
            assignedTo: {
                email: string;
                name: string;
                id: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            priority: import(".prisma/client").$Enums.FollowUpPriority;
            donorId: string;
            status: import(".prisma/client").$Enums.FollowUpStatus;
            createdById: string;
            isDeleted: boolean;
            dueDate: Date;
            completedAt: Date | null;
            note: string;
            assignedToId: string;
            completedNote: string | null;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    getStats(req: any): Promise<{
        total: number;
        pending: number;
        completed: number;
        overdue: number;
        dueToday: number;
        dueThisWeek: number;
    }>;
    findOne(id: string, req: any): Promise<{
        donor: {
            id: string;
            donorCode: string;
            firstName: string;
            lastName: string;
            primaryPhone: string;
            personalEmail: string;
            officialEmail: string;
        };
        createdBy: {
            name: string;
            id: string;
        };
        assignedTo: {
            email: string;
            name: string;
            id: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        priority: import(".prisma/client").$Enums.FollowUpPriority;
        donorId: string;
        status: import(".prisma/client").$Enums.FollowUpStatus;
        createdById: string;
        isDeleted: boolean;
        dueDate: Date;
        completedAt: Date | null;
        note: string;
        assignedToId: string;
        completedNote: string | null;
    }>;
    create(body: any, req: any): Promise<{
        donor: {
            id: string;
            donorCode: string;
            firstName: string;
            lastName: string;
            primaryPhone: string;
            personalEmail: string;
            officialEmail: string;
        };
        createdBy: {
            name: string;
            id: string;
        };
        assignedTo: {
            email: string;
            name: string;
            id: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        priority: import(".prisma/client").$Enums.FollowUpPriority;
        donorId: string;
        status: import(".prisma/client").$Enums.FollowUpStatus;
        createdById: string;
        isDeleted: boolean;
        dueDate: Date;
        completedAt: Date | null;
        note: string;
        assignedToId: string;
        completedNote: string | null;
    }>;
    update(id: string, body: any, req: any): Promise<{
        donor: {
            id: string;
            donorCode: string;
            firstName: string;
            lastName: string;
            primaryPhone: string;
            personalEmail: string;
            officialEmail: string;
        };
        createdBy: {
            name: string;
            id: string;
        };
        assignedTo: {
            email: string;
            name: string;
            id: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        priority: import(".prisma/client").$Enums.FollowUpPriority;
        donorId: string;
        status: import(".prisma/client").$Enums.FollowUpStatus;
        createdById: string;
        isDeleted: boolean;
        dueDate: Date;
        completedAt: Date | null;
        note: string;
        assignedToId: string;
        completedNote: string | null;
    }>;
    markComplete(id: string, body: any, req: any): Promise<{
        donor: {
            id: string;
            donorCode: string;
            firstName: string;
            lastName: string;
            primaryPhone: string;
            personalEmail: string;
            officialEmail: string;
        };
        createdBy: {
            name: string;
            id: string;
        };
        assignedTo: {
            email: string;
            name: string;
            id: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        priority: import(".prisma/client").$Enums.FollowUpPriority;
        donorId: string;
        status: import(".prisma/client").$Enums.FollowUpStatus;
        createdById: string;
        isDeleted: boolean;
        dueDate: Date;
        completedAt: Date | null;
        note: string;
        assignedToId: string;
        completedNote: string | null;
    }>;
    reopen(id: string, req: any): Promise<{
        donor: {
            id: string;
            donorCode: string;
            firstName: string;
            lastName: string;
            primaryPhone: string;
            personalEmail: string;
            officialEmail: string;
        };
        createdBy: {
            name: string;
            id: string;
        };
        assignedTo: {
            email: string;
            name: string;
            id: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        priority: import(".prisma/client").$Enums.FollowUpPriority;
        donorId: string;
        status: import(".prisma/client").$Enums.FollowUpStatus;
        createdById: string;
        isDeleted: boolean;
        dueDate: Date;
        completedAt: Date | null;
        note: string;
        assignedToId: string;
        completedNote: string | null;
    }>;
    remove(id: string, req: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        priority: import(".prisma/client").$Enums.FollowUpPriority;
        donorId: string;
        status: import(".prisma/client").$Enums.FollowUpStatus;
        createdById: string;
        isDeleted: boolean;
        dueDate: Date;
        completedAt: Date | null;
        note: string;
        assignedToId: string;
        completedNote: string | null;
    }>;
}
