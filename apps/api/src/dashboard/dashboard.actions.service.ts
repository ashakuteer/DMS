import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CommunicationLogService } from "../communication-log/communication-log.service";
import {
  CommunicationChannel,
  CommunicationType,
  CommunicationStatus,
} from "@prisma/client";

@Injectable()
export class DashboardActionsService {
  private readonly logger = new Logger(DashboardActionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly communicationLogService: CommunicationLogService,
  ) {}

  async getStaffActions() {
    return {};
  }

  async getDailyActions() {
    return {};
  }

  async markActionDone(
    user: any,
    params: { donorId: string; actionType: string; description: string },
  ) {
    await this.communicationLogService.create({
      donorId: params.donorId,
      channel: CommunicationChannel.EMAIL,
      type: CommunicationType.GENERAL,
      status: CommunicationStatus.SENT,
      subject: `Action Completed: ${params.actionType}`,
      messagePreview: params.description,
      sentById: user.id || user.sub,
    });

    this.logger.log(
      `Daily action marked done: ${params.actionType} for donor ${params.donorId}`,
    );

    return {
      success: true,
      message: "Action marked as done",
    };
  }

  async snoozeAction(
    user: any,
    params: { donorId: string; actionType: string; description: string; days: number },
  ) {
    const snoozeUntil = new Date();
    snoozeUntil.setDate(snoozeUntil.getDate() + params.days);

    await this.communicationLogService.create({
      donorId: params.donorId,
      channel: CommunicationChannel.EMAIL,
      type: CommunicationType.GENERAL,
      status: CommunicationStatus.SENT,
      subject: `Action Snoozed: ${params.actionType}`,
      messagePreview: `${params.description} - Snoozed for ${params.days} days`,
      sentById: user.id || user.sub,
    });

    return {
      success: true,
      snoozeUntil,
    };
  }
}
