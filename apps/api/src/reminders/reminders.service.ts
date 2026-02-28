import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CommunicationLogService } from '../communication-log/communication-log.service';
import { CommunicationChannel, CommunicationType, CommunicationStatus } from '@prisma/client';

@Injectable()
export class RemindersService {
  private readonly logger = new Logger(RemindersService.name);

  constructor(
    private prisma: PrismaService,
    private communicationLogService: CommunicationLogService,
  ) {}

  async getDueReminders() {
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    return this.prisma.reminder.findMany({
      where: {
        status: 'PENDING',
        dueDate: {
          lte: today,
        },
      },
      include: {
        donor: {
          select: {
            id: true,
            donorCode: true,
            firstName: true,
            lastName: true,
            primaryPhone: true,
            personalEmail: true,
          },
        },
        donation: {
          select: {
            id: true,
            donationAmount: true,
            receiptNumber: true,
            donationDate: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { dueDate: 'asc' },
    });
  }

  async markComplete(id: string, userId: string, userRole: string) {
    const reminder = await this.prisma.reminder.findUnique({
      where: { id },
      include: { donor: { select: { id: true, firstName: true, lastName: true } } },
    });

    if (!reminder) {
      throw new Error('Reminder not found');
    }

    const updatedReminder = await this.prisma.reminder.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });

    await this.communicationLogService.create({
      donorId: reminder.donorId,
      donationId: reminder.donationId || undefined,
      channel: CommunicationChannel.EMAIL,
      type: CommunicationType.FOLLOW_UP,
      status: CommunicationStatus.TRIGGERED,
      messagePreview: `Follow-up reminder marked complete (${userRole})`,
      sentById: userId,
      metadata: { action: 'mark_complete', reminderId: id, userRole },
    });

    return updatedReminder;
  }

  async snooze(id: string, userId: string, userRole: string) {
    const reminder = await this.prisma.reminder.findUnique({
      where: { id },
      include: { donor: { select: { id: true, firstName: true, lastName: true } } },
    });

    if (!reminder) {
      throw new Error('Reminder not found');
    }

    const newDueDate = new Date(reminder.dueDate);
    newDueDate.setDate(newDueDate.getDate() + 30);

    const updatedReminder = await this.prisma.reminder.update({
      where: { id },
      data: {
        dueDate: newDueDate,
      },
    });

    await this.communicationLogService.create({
      donorId: reminder.donorId,
      donationId: reminder.donationId || undefined,
      channel: CommunicationChannel.EMAIL,
      type: CommunicationType.FOLLOW_UP,
      status: CommunicationStatus.TRIGGERED,
      messagePreview: `Follow-up reminder snoozed for 30 days (${userRole})`,
      sentById: userId,
      metadata: { action: 'snooze', reminderId: id, userRole, newDueDate: newDueDate.toISOString() },
    });

    return updatedReminder;
  }

  async logReminderAction(params: {
    reminderId: string;
    donorId: string;
    donationId?: string;
    action: 'send_email' | 'send_whatsapp';
    userId: string;
    userRole: string;
  }) {
    const actionDescriptions: Record<string, string> = {
      send_email: 'Follow-up email sent from reminder',
      send_whatsapp: 'Follow-up WhatsApp opened from reminder',
    };

    const channelMap: Record<string, CommunicationChannel> = {
      send_email: CommunicationChannel.EMAIL,
      send_whatsapp: CommunicationChannel.WHATSAPP,
    };

    return this.communicationLogService.create({
      donorId: params.donorId,
      donationId: params.donationId,
      channel: channelMap[params.action],
      type: CommunicationType.FOLLOW_UP,
      status: CommunicationStatus.TRIGGERED,
      messagePreview: `${actionDescriptions[params.action]} (${params.userRole})`,
      sentById: params.userId,
      metadata: { action: params.action, reminderId: params.reminderId, userRole: params.userRole },
    });
  }
}
