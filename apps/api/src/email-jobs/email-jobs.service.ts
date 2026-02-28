import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailJobType, EmailJobStatus } from '@prisma/client';

export interface CreateEmailJobDto {
  donorId?: string;
  toEmail: string;
  subject: string;
  body: string;
  type: EmailJobType;
  relatedId?: string;
  scheduledAt: Date;
}

export interface EmailJobFilters {
  status?: EmailJobStatus;
  type?: EmailJobType;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

@Injectable()
export class EmailJobsService {
  private readonly logger = new Logger(EmailJobsService.name);

  constructor(private prisma: PrismaService) {}

  async create(dto: CreateEmailJobDto): Promise<any> {
    try {
      const job = await this.prisma.emailJob.upsert({
        where: {
          unique_email_job: {
            donorId: dto.donorId || '',
            type: dto.type,
            relatedId: dto.relatedId || '',
            scheduledAt: dto.scheduledAt,
          },
        },
        update: {
          subject: dto.subject,
          body: dto.body,
          toEmail: dto.toEmail,
        },
        create: {
          donorId: dto.donorId,
          toEmail: dto.toEmail,
          subject: dto.subject,
          body: dto.body,
          type: dto.type,
          relatedId: dto.relatedId,
          scheduledAt: dto.scheduledAt,
          status: 'QUEUED',
        },
      });
      this.logger.log(`Email job created/updated: ${job.id} for ${dto.toEmail}`);
      return job;
    } catch (error) {
      this.logger.error(`Failed to create email job: ${error}`);
      throw error;
    }
  }

  async findAll(filters: EmailJobFilters = {}) {
    const { status, type, startDate, endDate, page = 1, limit = 50 } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (type) where.type = type;
    if (startDate || endDate) {
      where.scheduledAt = {};
      if (startDate) where.scheduledAt.gte = startDate;
      if (endDate) where.scheduledAt.lte = endDate;
    }

    const [jobs, total] = await Promise.all([
      this.prisma.emailJob.findMany({
        where,
        include: {
          donor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              donorCode: true,
            },
          },
        },
        orderBy: { scheduledAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.emailJob.count({ where }),
    ]);

    return {
      jobs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findPendingJobs(limit: number = 50) {
    const now = new Date();
    return this.prisma.emailJob.findMany({
      where: {
        status: 'QUEUED',
        scheduledAt: { lte: now },
        attempts: { lt: 3 },
      },
      include: {
        donor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { scheduledAt: 'asc' },
      take: limit,
    });
  }

  async markSent(id: string, messageId?: string) {
    return this.prisma.emailJob.update({
      where: { id },
      data: {
        status: 'SENT',
        sentAt: new Date(),
        lastError: null,
      },
    });
  }

  async markFailed(id: string, error: string) {
    const job = await this.prisma.emailJob.findUnique({ where: { id } });
    if (!job) return null;

    const newAttempts = job.attempts + 1;
    const newStatus = newAttempts >= 3 ? 'FAILED' : 'QUEUED';

    return this.prisma.emailJob.update({
      where: { id },
      data: {
        attempts: newAttempts,
        status: newStatus,
        lastError: error,
      },
    });
  }

  async getStats() {
    const [queued, sent, failed] = await Promise.all([
      this.prisma.emailJob.count({ where: { status: 'QUEUED' } }),
      this.prisma.emailJob.count({ where: { status: 'SENT' } }),
      this.prisma.emailJob.count({ where: { status: 'FAILED' } }),
    ]);
    return { queued, sent, failed, total: queued + sent + failed };
  }

  async findByRelatedId(relatedId: string) {
    return this.prisma.emailJob.findFirst({
      where: { relatedId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async retryFailed(id: string) {
    return this.prisma.emailJob.update({
      where: { id },
      data: {
        status: 'QUEUED',
        attempts: 0,
        lastError: null,
      },
    });
  }

  async delete(id: string) {
    await this.prisma.emailJob.delete({ where: { id } });
    return { success: true };
  }
}
