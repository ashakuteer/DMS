import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { EmailService } from '../email/email.service';
import { CommunicationLogService } from '../communication-log/communication-log.service';
import { TemplatesService } from '../templates/templates.service';
import { OrganizationProfileService } from '../organization-profile/organization-profile.service';
import { EmailJobsService } from '../email-jobs/email-jobs.service';
import { CommunicationsService } from '../communications/communications.service';
import { Role } from '@prisma/client';
interface UserContext {
    id: string;
    email: string;
    role: Role;
}
export declare class ReminderTasksService {
    private prisma;
    private auditService;
    private emailService;
    private communicationLogService;
    private templatesService;
    private orgProfileService;
    private emailJobsService;
    private communicationsService;
    private readonly logger;
    constructor(prisma: PrismaService, auditService: AuditService, emailService: EmailService, communicationLogService: CommunicationLogService, templatesService: TemplatesService, orgProfileService: OrganizationProfileService, emailJobsService: EmailJobsService, communicationsService: CommunicationsService);
    private mapOccasionTypeToReminderType;
    private getOffsetText;
    private getOccasionTitle;
    private getFamilyBirthdayTitle;
    private calculateNextOccurrence;
    private subtractDays;
    private queueEmailJob;
    private sendAutoWhatsApp;
    generateSpecialDayReminders(): Promise<number>;
    getReminders(user: UserContext, filter: 'today' | 'week' | 'month' | 'overdue'): Promise<({
        donor: {
            id: string;
            donorCode: string;
            firstName: string;
            lastName: string;
            primaryPhone: string;
            primaryPhoneCode: string;
            whatsappPhone: string;
            whatsappPhoneCode: string;
            personalEmail: string;
            officialEmail: string;
        };
        sourceOccasion: {
            relatedPersonName: string;
        };
        sourceFamilyMember: {
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        type: import(".prisma/client").$Enums.ReminderTaskType;
        status: import(".prisma/client").$Enums.ReminderTaskStatus;
        donorId: string;
        title: string;
        dueDate: Date;
        completedAt: Date | null;
        offsetDays: number;
        createdByUserId: string | null;
        snoozedUntil: Date | null;
        sourceOccasionId: string | null;
        sourceFamilyId: string | null;
        sourcePledgeId: string | null;
        autoEmailSent: boolean;
        autoEmailSentAt: Date | null;
    })[]>;
    markDone(user: UserContext, id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        type: import(".prisma/client").$Enums.ReminderTaskType;
        status: import(".prisma/client").$Enums.ReminderTaskStatus;
        donorId: string;
        title: string;
        dueDate: Date;
        completedAt: Date | null;
        offsetDays: number;
        createdByUserId: string | null;
        snoozedUntil: Date | null;
        sourceOccasionId: string | null;
        sourceFamilyId: string | null;
        sourcePledgeId: string | null;
        autoEmailSent: boolean;
        autoEmailSentAt: Date | null;
    }>;
    snooze(user: UserContext, id: string, days: number): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        type: import(".prisma/client").$Enums.ReminderTaskType;
        status: import(".prisma/client").$Enums.ReminderTaskStatus;
        donorId: string;
        title: string;
        dueDate: Date;
        completedAt: Date | null;
        offsetDays: number;
        createdByUserId: string | null;
        snoozedUntil: Date | null;
        sourceOccasionId: string | null;
        sourceFamilyId: string | null;
        sourcePledgeId: string | null;
        autoEmailSent: boolean;
        autoEmailSentAt: Date | null;
    }>;
    processAutoEmails(): Promise<{
        sent: number;
        failed: number;
    }>;
    private getEmailSubject;
    private mapReminderTypeToTemplateType;
    private resolveTemplatePlaceholders;
    private getFallbackWhatsAppMessage;
    logWhatsAppClick(user: UserContext, reminderId: string): Promise<{
        phone: string;
        message: string;
        donorName: string;
    }>;
    sendManualEmail(user: UserContext, reminderId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    private getFallbackEmailBody;
    getStats(): Promise<{
        today: number;
        week: number;
        month: number;
        overdue: number;
    }>;
}
export {};
