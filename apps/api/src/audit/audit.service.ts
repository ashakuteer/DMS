import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditAction } from '@prisma/client';

export interface AuditLogInput {
  userId: string;
  action: AuditAction;
  entityType?: string;
  entityId?: string;
  oldValue?: Record<string, any>;
  newValue?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(input: AuditLogInput): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: input.userId,
          action: input.action,
          entityType: input.entityType,
          entityId: input.entityId,
          oldValue: input.oldValue,
          newValue: input.newValue,
          ipAddress: input.ipAddress,
          userAgent: input.userAgent,
          metadata: input.metadata,
        },
      });
    } catch (error) {
      console.error('Failed to create audit log:', error);
    }
  }

  async logDonorCreate(
    userId: string,
    donorId: string,
    donorData: Record<string, any>,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    await this.log({
      userId,
      action: AuditAction.DONOR_CREATE,
      entityType: 'Donor',
      entityId: donorId,
      newValue: donorData,
      ipAddress,
      userAgent,
    });
  }

  async logDonorUpdate(
    userId: string,
    donorId: string,
    oldData: Record<string, any>,
    newData: Record<string, any>,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    await this.log({
      userId,
      action: AuditAction.DONOR_UPDATE,
      entityType: 'Donor',
      entityId: donorId,
      oldValue: oldData,
      newValue: newData,
      ipAddress,
      userAgent,
    });
  }

  async logDonorDelete(
    userId: string,
    donorId: string,
    donorData: Record<string, any>,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    await this.log({
      userId,
      action: AuditAction.DONOR_DELETE,
      entityType: 'Donor',
      entityId: donorId,
      oldValue: donorData,
      ipAddress,
      userAgent,
    });
  }

  async logDonorAssignmentChange(
    userId: string,
    donorId: string,
    oldAssigneeId: string | null,
    newAssigneeId: string | null,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    await this.log({
      userId,
      action: AuditAction.DONOR_ASSIGNMENT_CHANGE,
      entityType: 'Donor',
      entityId: donorId,
      oldValue: { assignedToUserId: oldAssigneeId },
      newValue: { assignedToUserId: newAssigneeId },
      ipAddress,
      userAgent,
    });
  }

  async logDonationCreate(
    userId: string,
    donationId: string,
    donationData: Record<string, any>,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    await this.log({
      userId,
      action: AuditAction.DONATION_CREATE,
      entityType: 'Donation',
      entityId: donationId,
      newValue: donationData,
      ipAddress,
      userAgent,
    });
  }

  async logDonationUpdate(
    userId: string,
    donationId: string,
    oldData: Record<string, any>,
    newData: Record<string, any>,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    await this.log({
      userId,
      action: AuditAction.DONATION_UPDATE,
      entityType: 'Donation',
      entityId: donationId,
      oldValue: oldData,
      newValue: newData,
      ipAddress,
      userAgent,
    });
  }

  async logDonationDelete(
    userId: string,
    donationId: string,
    donationData: Record<string, any>,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    await this.log({
      userId,
      action: AuditAction.DONATION_DELETE,
      entityType: 'Donation',
      entityId: donationId,
      oldValue: donationData,
      ipAddress,
      userAgent,
    });
  }

  async logReceiptRegenerate(
    userId: string,
    donationId: string,
    metadata?: Record<string, any>,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    await this.log({
      userId,
      action: AuditAction.RECEIPT_REGENERATE,
      entityType: 'Donation',
      entityId: donationId,
      metadata,
      ipAddress,
      userAgent,
    });
  }

  async logDataExport(
    userId: string,
    exportType: string,
    filters?: Record<string, any>,
    recordCount?: number,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    await this.log({
      userId,
      action: AuditAction.DATA_EXPORT,
      entityType: exportType,
      metadata: {
        filters,
        recordCount,
        exportedAt: new Date().toISOString(),
      },
      ipAddress,
      userAgent,
    });
  }

  async logRoleChange(
    userId: string,
    targetUserId: string,
    oldRole: string,
    newRole: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    await this.log({
      userId,
      action: AuditAction.ROLE_CHANGE,
      entityType: 'User',
      entityId: targetUserId,
      oldValue: { role: oldRole },
      newValue: { role: newRole },
      ipAddress,
      userAgent,
    });
  }

  async logFullAccessRequest(
    userId: string,
    donorId: string,
    reason?: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    await this.log({
      userId,
      action: AuditAction.FULL_ACCESS_REQUEST,
      entityType: 'Donor',
      entityId: donorId,
      metadata: {
        reason,
        requestedAt: new Date().toISOString(),
      },
      ipAddress,
      userAgent,
    });
  }

  async logPledgeCreate(
    userId: string,
    pledgeId: string,
    pledgeData: Record<string, any>,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    await this.log({
      userId,
      action: AuditAction.PLEDGE_CREATE,
      entityType: 'Pledge',
      entityId: pledgeId,
      newValue: pledgeData,
      ipAddress,
      userAgent,
    });
  }

  async logPledgeUpdate(
    userId: string,
    pledgeId: string,
    oldData: Record<string, any>,
    newData: Record<string, any>,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    await this.log({
      userId,
      action: AuditAction.PLEDGE_UPDATE,
      entityType: 'Pledge',
      entityId: pledgeId,
      oldValue: oldData,
      newValue: newData,
      ipAddress,
      userAgent,
    });
  }

  async logPledgeDelete(
    userId: string,
    pledgeId: string,
    pledgeData: Record<string, any>,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    await this.log({
      userId,
      action: AuditAction.PLEDGE_DELETE,
      entityType: 'Pledge',
      entityId: pledgeId,
      oldValue: pledgeData,
      ipAddress,
      userAgent,
    });
  }

  async logPledgeFulfilled(
    userId: string,
    pledgeId: string,
    oldData: Record<string, any>,
    newData: Record<string, any>,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    await this.log({
      userId,
      action: AuditAction.PLEDGE_FULFILLED,
      entityType: 'Pledge',
      entityId: pledgeId,
      oldValue: oldData,
      newValue: newData,
      ipAddress,
      userAgent,
    });
  }

  async logPledgePostponed(
    userId: string,
    pledgeId: string,
    oldData: Record<string, any>,
    newData: Record<string, any>,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    await this.log({
      userId,
      action: AuditAction.PLEDGE_POSTPONED,
      entityType: 'Pledge',
      entityId: pledgeId,
      oldValue: oldData,
      newValue: newData,
      ipAddress,
      userAgent,
    });
  }

  async logPledgeCancelled(
    userId: string,
    pledgeId: string,
    oldData: Record<string, any>,
    newData: Record<string, any>,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    await this.log({
      userId,
      action: AuditAction.PLEDGE_CANCELLED,
      entityType: 'Pledge',
      entityId: pledgeId,
      oldValue: oldData,
      newValue: newData,
      ipAddress,
      userAgent,
    });
  }

  async logBeneficiaryCreate(
    userId: string,
    beneficiaryId: string,
    data: Record<string, any>,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    await this.log({
      userId,
      action: AuditAction.BENEFICIARY_CREATE,
      entityType: 'Beneficiary',
      entityId: beneficiaryId,
      newValue: data,
      ipAddress,
      userAgent,
    });
  }

  async logBeneficiaryUpdate(
    userId: string,
    beneficiaryId: string,
    oldData: Record<string, any>,
    newData: Record<string, any>,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    await this.log({
      userId,
      action: AuditAction.BENEFICIARY_UPDATE,
      entityType: 'Beneficiary',
      entityId: beneficiaryId,
      oldValue: oldData,
      newValue: newData,
      ipAddress,
      userAgent,
    });
  }

  async logBeneficiaryDelete(
    userId: string,
    beneficiaryId: string,
    data: Record<string, any>,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    await this.log({
      userId,
      action: AuditAction.BENEFICIARY_DELETE,
      entityType: 'Beneficiary',
      entityId: beneficiaryId,
      oldValue: data,
      ipAddress,
      userAgent,
    });
  }

  async logEmailSend(
    userId: string,
    entityType: string,
    entityId: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    await this.log({
      userId,
      action: AuditAction.EMAIL_SEND,
      entityType,
      entityId,
      metadata,
    });
  }

  async logWhatsAppSend(
    userId: string,
    entityType: string,
    entityId: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    await this.log({
      userId,
      action: AuditAction.WHATSAPP_SEND,
      entityType,
      entityId,
      metadata,
    });
  }

  async getAuditLogs(
    filters?: {
      userId?: string;
      action?: AuditAction;
      entityType?: string;
      entityId?: string;
      startDate?: Date;
      endDate?: Date;
    },
    page = 1,
    limit = 50,
  ) {
    const where: any = {};

    if (filters?.userId) where.userId = filters.userId;
    if (filters?.action) where.action = filters.action;
    if (filters?.entityType) where.entityType = filters.entityType;
    if (filters?.entityId) where.entityId = filters.entityId;

    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }

    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
