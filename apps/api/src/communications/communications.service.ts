import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { TwilioWhatsAppService, WhatsAppTemplateKey } from "./twilio-whatsapp.service";
import { CommChannel, CommProvider, CommStatus } from "@prisma/client";

export interface SendWhatsAppTemplateDto {
  donorId?: string;
  toE164: string;
  contentSid: string;
  variables?: Record<string, string>;
  templateKey?: WhatsAppTemplateKey;
}

@Injectable()
export class CommunicationsService {
  private readonly logger = new Logger(CommunicationsService.name);

  constructor(
    private prisma: PrismaService,
    private twilioWhatsApp: TwilioWhatsAppService,
  ) {}

  isWhatsAppConfigured(): boolean {
    return this.twilioWhatsApp.isConfigured();
  }

  getWhatsAppDisableReason(): string {
    return this.twilioWhatsApp.getDisableReason();
  }

  isTemplateConfigured(templateKey: WhatsAppTemplateKey): boolean {
    return this.twilioWhatsApp.isTemplateConfigured(templateKey);
  }

  getConfiguredTemplates() {
    return this.twilioWhatsApp.getConfiguredTemplates();
  }

  getContentSidForKey(templateKey: WhatsAppTemplateKey): string | null {
    return this.twilioWhatsApp.getContentSidForKey(templateKey);
  }

  private mapTwilioStatusToCommStatus(twilioStatus?: string): CommStatus {
    if (!twilioStatus) return CommStatus.QUEUED;
    const map: Record<string, CommStatus> = {
      accepted: CommStatus.QUEUED,
      queued: CommStatus.QUEUED,
      sending: CommStatus.SENT,
      sent: CommStatus.SENT,
      delivered: CommStatus.DELIVERED,
      read: CommStatus.READ,
      failed: CommStatus.FAILED,
      undelivered: CommStatus.UNDELIVERED,
    };
    return map[twilioStatus.toLowerCase()] || CommStatus.QUEUED;
  }

  async sendWhatsAppTemplate(
    dto: SendWhatsAppTemplateDto,
    userId?: string,
  ) {
    const row = await this.prisma.communicationMessage.create({
      data: {
        donorId: dto.donorId || null,
        channel: CommChannel.WHATSAPP,
        provider: CommProvider.TWILIO,
        to: dto.toE164,
        status: CommStatus.QUEUED,
        templateName: dto.contentSid,
        templateKey: dto.templateKey || null,
        templateVariables: dto.variables || {},
        createdByUserId: userId || null,
      },
    });

    const result = await this.twilioWhatsApp.sendTemplate(
      dto.toE164,
      dto.contentSid,
      dto.variables,
    );

    if (result.success) {
      const mappedStatus = this.mapTwilioStatusToCommStatus(result.status);
      const updated = await this.prisma.communicationMessage.update({
        where: { id: row.id },
        data: {
          status: mappedStatus,
          providerMessageId: result.messageSid,
          sentAt: new Date(),
        },
      });
      return updated;
    } else {
      const updated = await this.prisma.communicationMessage.update({
        where: { id: row.id },
        data: {
          status: CommStatus.FAILED,
          errorCode: result.errorCode,
          errorMessage: result.errorMessage,
        },
      });
      return updated;
    }
  }

  async sendByTemplateKey(
    templateKey: WhatsAppTemplateKey,
    donorId: string,
    toE164: string,
    variables?: Record<string, string>,
    userId?: string,
  ) {
    const contentSid = this.twilioWhatsApp.getContentSidForKey(templateKey);
    if (!contentSid) {
      this.logger.warn(
        `Template key ${templateKey} has no configured Content SID. Skipping WhatsApp send.`,
      );
      return {
        success: false,
        status: "not_configured",
        templateKey,
      };
    }

    if (!this.twilioWhatsApp.isConfigured()) {
      return {
        success: false,
        status: "not_configured",
        templateKey,
      };
    }

    const result = await this.sendWhatsAppTemplate(
      {
        donorId,
        toE164,
        contentSid,
        variables,
        templateKey,
      },
      userId,
    );

    return {
      success: result.status !== CommStatus.FAILED,
      status: result.status?.toLowerCase() || "queued",
      messageId: result.id,
      templateKey,
    };
  }

  async getWhatsAppStatusForDonor(donorId: string, limit = 1) {
    return this.prisma.communicationMessage.findMany({
      where: {
        donorId,
        channel: CommChannel.WHATSAPP,
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        status: true,
        to: true,
        providerMessageId: true,
        templateKey: true,
        errorCode: true,
        errorMessage: true,
        sentAt: true,
        deliveredAt: true,
        createdAt: true,
      },
    });
  }

  async updateStatusFromWebhook(
    providerMessageId: string,
    twilioStatus: string,
    errorCode?: string,
    errorMessage?: string,
  ) {
    const statusMap: Record<string, CommStatus> = {
      accepted: CommStatus.QUEUED,
      queued: CommStatus.QUEUED,
      sending: CommStatus.SENT,
      sent: CommStatus.SENT,
      delivered: CommStatus.DELIVERED,
      read: CommStatus.READ,
      failed: CommStatus.FAILED,
      undelivered: CommStatus.UNDELIVERED,
    };

    const newStatus = statusMap[twilioStatus.toLowerCase()];
    if (!newStatus) {
      this.logger.warn(`Unknown Twilio status: ${twilioStatus}`);
      return null;
    }

    const existing = await this.prisma.communicationMessage.findFirst({
      where: { providerMessageId },
    });

    if (!existing) {
      this.logger.warn(
        `No CommunicationMessage found for providerMessageId: ${providerMessageId}`,
      );
      return null;
    }

    const updateData: Record<string, any> = { status: newStatus };

    if (newStatus === CommStatus.DELIVERED) {
      updateData.deliveredAt = new Date();
    }
    if (newStatus === CommStatus.READ) {
      updateData.readAt = new Date();
    }
    if (
      newStatus === CommStatus.FAILED ||
      newStatus === CommStatus.UNDELIVERED
    ) {
      if (errorCode) updateData.errorCode = errorCode;
      if (errorMessage) updateData.errorMessage = errorMessage;
    }

    const updated = await this.prisma.communicationMessage.update({
      where: { id: existing.id },
      data: updateData,
    });

    this.logger.log(
      `Message ${providerMessageId} status updated to ${newStatus}`,
    );
    return updated;
  }
}
