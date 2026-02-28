import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CommunicationChannel,
  CommunicationType,
  CommunicationStatus,
} from '@prisma/client';

export interface CreateCommunicationLogDto {
  donorId: string;
  donationId?: string;
  templateId?: string;
  channel: CommunicationChannel;
  type: CommunicationType;
  status: CommunicationStatus;
  recipient?: string;
  subject?: string;
  messagePreview?: string;
  errorMessage?: string;
  metadata?: Record<string, any>;
  sentById?: string;
}

@Injectable()
export class CommunicationLogService {
  private readonly logger = new Logger(CommunicationLogService.name);

  constructor(private prisma: PrismaService) {}

  async create(data: CreateCommunicationLogDto) {
    return this.prisma.communicationLog.create({
      data: {
        donorId: data.donorId,
        donationId: data.donationId || null,
        templateId: data.templateId || null,
        channel: data.channel,
        type: data.type,
        status: data.status,
        recipient: data.recipient || null,
        subject: data.subject || null,
        messagePreview: data.messagePreview || null,
        errorMessage: data.errorMessage || null,
        metadata: data.metadata || undefined,
        sentById: data.sentById || null,
      },
    });
  }

  async findByDonorId(donorId: string) {
    return this.prisma.communicationLog.findMany({
      where: { donorId },
      include: {
        sentBy: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        template: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        donation: {
          select: {
            id: true,
            receiptNumber: true,
            donationAmount: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByDonationId(donationId: string) {
    return this.prisma.communicationLog.findMany({
      where: { donationId },
      include: {
        sentBy: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        template: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async delete(id: string) {
    return this.prisma.communicationLog.delete({
      where: { id },
    });
  }

  async logEmail(params: {
    donorId: string;
    donationId?: string;
    templateId?: string;
    toEmail: string;
    subject: string;
    messagePreview?: string;
    status: 'SENT' | 'FAILED';
    errorMessage?: string;
    sentById?: string;
    type?: CommunicationType;
  }) {
    const commType = params.type || this.inferEmailType(params.subject);
    
    return this.create({
      donorId: params.donorId,
      donationId: params.donationId,
      templateId: params.templateId,
      channel: CommunicationChannel.EMAIL,
      type: commType,
      status: params.status === 'SENT' ? CommunicationStatus.SENT : CommunicationStatus.FAILED,
      recipient: params.toEmail,
      subject: params.subject,
      messagePreview: params.messagePreview?.substring(0, 200),
      errorMessage: params.errorMessage,
      sentById: params.sentById,
    });
  }

  async logWhatsApp(params: {
    donorId: string;
    donationId?: string;
    templateId?: string;
    phoneNumber: string;
    messagePreview?: string;
    sentById: string;
    type?: CommunicationType;
  }) {
    const commType = params.type || CommunicationType.GENERAL;
    
    return this.create({
      donorId: params.donorId,
      donationId: params.donationId,
      templateId: params.templateId,
      channel: CommunicationChannel.WHATSAPP,
      type: commType,
      status: CommunicationStatus.TRIGGERED,
      recipient: params.phoneNumber,
      messagePreview: params.messagePreview?.substring(0, 200),
      sentById: params.sentById,
    });
  }

  async logPostDonationAction(params: {
    donorId: string;
    donationId?: string;
    action: 'send_email' | 'send_whatsapp' | 'remind_later' | 'skip';
    sentById: string;
    userRole: string;
  }) {
    const actionDescriptions: Record<string, string> = {
      send_email: 'Sent thank-you email with receipt',
      send_whatsapp: 'Opened WhatsApp with thank-you message',
      remind_later: 'Set 60-day follow-up reminder',
      skip: 'Skipped post-donation action',
    };
    
    const channelMap: Record<string, CommunicationChannel> = {
      send_email: CommunicationChannel.EMAIL,
      send_whatsapp: CommunicationChannel.WHATSAPP,
      remind_later: CommunicationChannel.EMAIL,
      skip: CommunicationChannel.EMAIL,
    };

    if (params.action === 'remind_later') {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 60);
      
      await this.prisma.reminder.create({
        data: {
          donorId: params.donorId,
          donationId: params.donationId || null,
          type: 'FOLLOW_UP',
          title: 'Post-donation follow-up',
          description: `60-day follow-up reminder set after donation`,
          dueDate,
          status: 'PENDING',
          createdById: params.sentById,
        },
      });
    }

    return this.create({
      donorId: params.donorId,
      donationId: params.donationId,
      channel: channelMap[params.action],
      type: CommunicationType.GENERAL,
      status: CommunicationStatus.TRIGGERED,
      messagePreview: `Post-donation action (${params.userRole}): ${actionDescriptions[params.action]}`,
      sentById: params.sentById,
      metadata: { action: params.action, userRole: params.userRole },
    });
  }

  private inferEmailType(subject: string): CommunicationType {
    const lowerSubject = subject.toLowerCase();
    if (lowerSubject.includes('thank') || lowerSubject.includes('appreciation')) {
      return CommunicationType.THANK_YOU;
    }
    if (lowerSubject.includes('receipt')) {
      return CommunicationType.RECEIPT;
    }
    if (lowerSubject.includes('follow') || lowerSubject.includes('reminder')) {
      return CommunicationType.FOLLOW_UP;
    }
    if (lowerSubject.includes('greeting') || lowerSubject.includes('birthday') || lowerSubject.includes('anniversary') || lowerSubject.includes('festival')) {
      return CommunicationType.GREETING;
    }
    return CommunicationType.GENERAL;
  }
}
