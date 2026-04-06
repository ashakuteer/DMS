import { PledgesService, UserContext, FulfillPledgeDto } from './pledges.service';
import { PledgeStatus } from '@prisma/client';
import { Request } from 'express';
export declare class PledgesController {
    private readonly pledgesService;
    constructor(pledgesService: PledgesService);
    private getClientInfo;
    findAll(user: UserContext, page?: string, limit?: string, donorId?: string, status?: PledgeStatus, sortBy?: string, sortOrder?: 'asc' | 'desc'): Promise<{
        items: any;
        total: any;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    getDonorPledgeSuggestions(donorId: string): Promise<any>;
    findOne(user: UserContext, id: string): Promise<any>;
    getWhatsAppText(user: UserContext, id: string): Promise<{
        text: string;
    }>;
    create(user: UserContext, data: Record<string, unknown>, req: Request): Promise<any>;
    update(user: UserContext, id: string, data: Record<string, unknown>, req: Request): Promise<any>;
    markFulfilled(user: UserContext, id: string, body: FulfillPledgeDto, req: Request): Promise<any>;
    postpone(user: UserContext, id: string, body: {
        newDate: string;
        notes?: string;
    }, req: Request): Promise<any>;
    cancel(user: UserContext, id: string, body: {
        reason?: string;
    }, req: Request): Promise<any>;
    sendReminderEmail(user: UserContext, id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    logWhatsApp(user: UserContext, id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    delete(user: UserContext, id: string, req: Request): Promise<{
        success: boolean;
    }>;
}
