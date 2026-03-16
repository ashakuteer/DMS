import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { Role, AuditAction, ReminderTaskStatus } from '@prisma/client';
import { ReminderTasksCommunicationService } from './reminder-tasks.communication.service';
import { ReminderTasksGenerationService } from './reminder-tasks.generation.service';

interface UserContext {
  id: string;
  email: string;
  role: Role;
}

interface GetRemindersQuery {
  page?: number;
  limit?: number;
  type?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  filter?: 'today' | 'week' | 'month' | 'overdue';
}

@Injectable()
export class ReminderTasksService {
  private readonly logger = new Logger(ReminderTasksService.name);

  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
    private communicationService: ReminderTasksCommunicationService,
    private generationService: ReminderTasksGenerationService,
  ) {}

  async generateSpecialDayReminders(): Promise<number> {
    return this.generationService.generateSpecialDayReminders();
  }

  async processAutoEmails(): Promise<{ sent: number; failed: number }> {
    return this.communicationService.processAutoEmails();
  }

  async getReminders(user: UserContext, query: GetRemindersQuery = {}) {
    const {
      page = 1,
      limit = 20,
      type,
      status,
      dateFrom,
      dateTo,
    } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (type) where.type = type;

    if (status === 'ACTIVE') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      where.status = { in: [ReminderTaskStatus.OPEN, ReminderTaskStatus.SNOOZED] };
      where.OR = [{ snoozedUntil: null }, { snoozedUntil: { lte: today } }];
    } else if (status) {
      where.status = status;
    }

    if (dateFrom || dateTo) {
      where.dueDate = {};
      if (dateFrom) where.dueDate.gte = new Date(dateFrom);
      if (dateTo) where.dueDate.lte = new Date(dateTo);
    }

    const [reminderTasks, total] = await Promise.all([
      this.prisma.reminderTask.findMany({
        where,
        include: {
          donor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              donorCode: true,
              primaryPhone: true,
              primaryPhoneCode: true,
              whatsappPhone: true,
              personalEmail: true,
              officialEmail: true,
            },
          },
          sourceOccasion: {
            select: {
              id: true,
              type: true,
              relatedPersonName: true,
              month: true,
              day: true,
            },
          },
          sourceFamilyMember: {
            select: {
              id: true,
              name: true,
              relationType: true,
            },
          },
          sourcePledge: {
            select: {
              id: true,
              pledgeType: true,
              quantity: true,
              amount: true,
              expectedFulfillmentDate: true,
            },
          },
        },
        orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      this.prisma.reminderTask.count({ where }),
    ]);

    return {
      data: reminderTasks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async markDone(user: UserContext, reminderId: string) {
    const reminder = await this.prisma.reminderTask.findUnique({
      where: { id: reminderId },
    });

    if (!reminder) {
      throw new NotFoundException('Reminder task not found');
    }

    const updated = await this.prisma.reminderTask.update({
      where: { id: reminderId },
      data: {
        status: ReminderTaskStatus.DONE,
        completedAt: new Date(),
      },
    });

    await this.auditService.log({
      userId: user.id,
      action: AuditAction.DONOR_UPDATE,
      entityType: 'ReminderTask',
      entityId: reminderId,
      newValue: { status: 'DONE' },
    });

    return updated;
  }

  async snooze(user: UserContext, reminderId: string, snoozeDays: number) {
    const reminder = await this.prisma.reminderTask.findUnique({
      where: { id: reminderId },
    });

    if (!reminder) {
      throw new NotFoundException('Reminder task not found');
    }

    const snoozedUntil = new Date();
    snoozedUntil.setDate(snoozedUntil.getDate() + snoozeDays);
    snoozedUntil.setHours(0, 0, 0, 0);

    const updated = await this.prisma.reminderTask.update({
      where: { id: reminderId },
      data: {
        status: ReminderTaskStatus.SNOOZED,
        snoozedUntil,
      },
    });

    await this.auditService.log({
      userId: user.id,
      action: AuditAction.DONOR_UPDATE,
      entityType: 'ReminderTask',
      entityId: reminderId,
      newValue: { status: 'SNOOZED', snoozedUntil },
    });

    return updated;
  }

  async logWhatsAppClick(user: UserContext, reminderId: string) {
    return this.communicationService.logWhatsAppClick(user, reminderId);
  }

  async sendManualEmail(
    user: UserContext,
    reminderId: string,
  ): Promise<{ success: boolean; message: string }> {
    return this.communicationService.sendManualEmail(user, reminderId);
  }

  async getStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const endOfToday = new Date(today);
    endOfToday.setHours(23, 59, 59, 999);

    const weekFromNow = new Date(today);
    weekFromNow.setDate(weekFromNow.getDate() + 7);

    const monthFromNow = new Date(today);
    monthFromNow.setDate(monthFromNow.getDate() + 30);

    const [todayCount, weekCount, monthCount, overdueCount] = await Promise.all([
      this.prisma.reminderTask.count({
        where: {
          status: { in: [ReminderTaskStatus.OPEN, ReminderTaskStatus.SNOOZED] },
          dueDate: { gte: today, lte: endOfToday },
          OR: [{ snoozedUntil: null }, { snoozedUntil: { lte: today } }],
        },
      }),
      this.prisma.reminderTask.count({
        where: {
          status: { in: [ReminderTaskStatus.OPEN, ReminderTaskStatus.SNOOZED] },
          dueDate: { gte: today, lte: weekFromNow },
          OR: [{ snoozedUntil: null }, { snoozedUntil: { lte: today } }],
        },
      }),
      this.prisma.reminderTask.count({
        where: {
          status: { in: [ReminderTaskStatus.OPEN, ReminderTaskStatus.SNOOZED] },
          dueDate: { gte: today, lte: monthFromNow },
          OR: [{ snoozedUntil: null }, { snoozedUntil: { lte: today } }],
        },
      }),
      this.prisma.reminderTask.count({
        where: {
          status: ReminderTaskStatus.OPEN,
          dueDate: { lt: today },
        },
      }),
    ]);

    return {
      today: todayCount,
      week: weekCount,
      month: monthCount,
      overdue: overdueCount,
    };
  }
}
