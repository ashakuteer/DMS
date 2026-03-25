import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TaskStatus, TaskPriority, TaskType, Role, CommunicationChannel, CommunicationStatus, CommunicationType } from '@prisma/client';
import { CreateTaskDto, UpdateTaskDto, LogContactDto } from './tasks.dto';

const DONOR_TYPES: TaskType[] = [
  TaskType.BIRTHDAY,
  TaskType.ANNIVERSARY,
  TaskType.REMEMBRANCE,
  TaskType.FOLLOW_UP,
  TaskType.PLEDGE,
  TaskType.SMART_REMINDER,
  TaskType.SPONSOR_UPDATE,
  TaskType.REMINDER,
];

const STAFF_TYPES: TaskType[] = [
  TaskType.GENERAL,
  TaskType.INTERNAL,
  TaskType.MANUAL,
];

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  private readonly includeRelations = {
    donor: {
      select: {
        id: true,
        donorCode: true,
        firstName: true,
        lastName: true,
        primaryPhone: true,
        whatsappPhone: true,
        prefWhatsapp: true,
        assignedToUser: {
          select: { id: true, name: true, email: true },
        },
      },
    },
    beneficiary: {
      select: {
        id: true,
        fullName: true,
      },
    },
    assignedUser: {
      select: { id: true, name: true, email: true },
    },
    sourceOccasion: {
      select: { id: true, type: true, relatedPersonName: true, month: true, day: true },
    },
    sourceSponsorship: {
      select: {
        id: true,
        sponsorshipType: true,
        beneficiary: { select: { id: true, fullName: true } },
      },
    },
    sourcePledge: {
      select: { id: true, pledgeType: true, amount: true, expectedFulfillmentDate: true },
    },
  };

  private resolveStatus(task: any): any {
    if (!task) return task;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (task.status === TaskStatus.PENDING && task.dueDate && new Date(task.dueDate) < today) {
      return { ...task, status: TaskStatus.OVERDUE };
    }
    return task;
  }

  private safeMapTask(task: any): any {
    if (!task) return null;
    return {
      id:                   task.id            ?? null,
      title:                task.title         ?? '',
      description:          task.description   ?? null,
      type:                 task.type          ?? null,
      status:               task.status        ?? null,
      priority:             task.priority      ?? null,
      dueDate:              task.dueDate       ?? null,
      completedAt:          task.completedAt   ?? null,
      donorId:              task.donorId       ?? null,
      beneficiaryId:        task.beneficiaryId ?? null,
      assignedTo:           task.assignedTo    ?? null,
      autoWhatsAppPossible: task.autoWhatsAppPossible ?? false,
      manualRequired:       task.manualRequired       ?? true,
      contactCount:         task.contactCount         ?? 0,
      lastContactedAt:      task.lastContactedAt      ?? null,
      createdAt:            task.createdAt     ?? null,
      updatedAt:            task.updatedAt     ?? null,
      donor:                task.donor         ?? null,
      beneficiary:          task.beneficiary   ?? null,
      assignedUser:         task.assignedUser  ?? null,
      sourceOccasion:       task.sourceOccasion    ?? null,
      sourceSponsorship:    task.sourceSponsorship ?? null,
      sourcePledge:         task.sourcePledge      ?? null,
    };
  }

  async create(dto: CreateTaskDto) {
    return this.prisma.task.create({
      data: {
        title:                dto.title,
        description:          dto.description,
        type:                 dto.type,
        priority:             dto.priority ?? TaskPriority.MEDIUM,
        dueDate:              new Date(dto.dueDate),
        donorId:              dto.donorId,
        beneficiaryId:        dto.beneficiaryId,
        assignedTo:           dto.assignedTo,
        autoWhatsAppPossible: dto.autoWhatsAppPossible ?? false,
        manualRequired:       dto.manualRequired ?? true,
        sourceOccasionId:     dto.sourceOccasionId,
        sourceSponsorshipId:  dto.sourceSponsorshipId,
        sourcePledgeId:       dto.sourcePledgeId,
      },
      include: this.includeRelations,
    });
  }

  async findAll(query: {
    status?: string;
    type?: string;
    category?: string;
    dueDate?: string;
    timeWindow?: string;
    assignedTo?: string;
    priority?: string;
    donorId?: string;
  }) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const where: any = {};

    // Status filter
    if (query.status) {
      if (query.status === 'OVERDUE') {
        where.status = TaskStatus.PENDING;
        where.dueDate = { lt: today };
      } else {
        where.status = query.status as TaskStatus;
      }
    }

    // Category virtual filter: 'donor' or 'staff'
    // When a specific type is also requested, narrow within the category
    if (query.category === 'donor') {
      if (query.type) {
        where.type = query.type as TaskType;
      } else {
        where.type = { in: DONOR_TYPES };
      }
    } else if (query.category === 'staff') {
      if (query.type) {
        where.type = query.type as TaskType;
      } else {
        where.type = { in: STAFF_TYPES };
      }
    } else if (query.type) {
      where.type = query.type as TaskType;
    }

    // Priority filter
    if (query.priority) {
      where.priority = query.priority as TaskPriority;
    }

    // Assigned-to filter
    if (query.assignedTo) {
      where.assignedTo = query.assignedTo;
    }

    // Donor filter
    if (query.donorId) {
      where.donorId = query.donorId;
    }

    // Time-window filter (overrides dueDate if both present)
    if (query.timeWindow) {
      switch (query.timeWindow) {
        case 'today':
          where.status = TaskStatus.PENDING;
          where.dueDate = { gte: today, lt: tomorrow };
          break;
        case '7days': {
          const end7 = new Date(today);
          end7.setDate(end7.getDate() + 8);
          where.status = TaskStatus.PENDING;
          where.dueDate = { gte: today, lt: end7 };
          break;
        }
        case '15days': {
          const end15 = new Date(today);
          end15.setDate(end15.getDate() + 16);
          where.status = TaskStatus.PENDING;
          where.dueDate = { gte: today, lt: end15 };
          break;
        }
        case '30days': {
          const end30 = new Date(today);
          end30.setDate(end30.getDate() + 31);
          where.status = TaskStatus.PENDING;
          where.dueDate = { gte: today, lt: end30 };
          break;
        }
        case 'overdue':
          where.status = TaskStatus.PENDING;
          where.dueDate = { lt: today };
          break;
      }
    } else if (query.dueDate === 'today') {
      where.dueDate = { gte: today, lt: tomorrow };
    } else if (query.dueDate === 'overdue') {
      where.status = TaskStatus.PENDING;
      where.dueDate = { lt: today };
    }

    const tasks = await this.prisma.task.findMany({
      where,
      include: this.includeRelations,
      orderBy: [{ dueDate: 'asc' }, { priority: 'desc' }],
    });

    return tasks.map((t) => this.resolveStatus(t));
  }

  async findOne(id: string) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: this.includeRelations,
    });
    if (!task) throw new NotFoundException('Task not found');
    return this.resolveStatus(task);
  }

  async updateStatus(id: string, status: TaskStatus) {
    await this.findOne(id);

    const data: any = { status };
    if (status === TaskStatus.COMPLETED) {
      data.completedAt = new Date();
    }

    const updated = await this.prisma.task.update({
      where: { id },
      data,
      include: this.includeRelations,
    });
    return this.resolveStatus(updated);
  }

  async updateTask(id: string, dto: UpdateTaskDto) {
    await this.findOne(id);

    const data: any = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.type !== undefined) data.type = dto.type;
    if (dto.priority !== undefined) data.priority = dto.priority;
    if (dto.dueDate !== undefined) data.dueDate = new Date(dto.dueDate);
    if (dto.assignedTo !== undefined) data.assignedTo = dto.assignedTo;
    if (dto.status !== undefined) {
      data.status = dto.status;
      if (dto.status === TaskStatus.COMPLETED) data.completedAt = new Date();
    }

    const updated = await this.prisma.task.update({
      where: { id },
      data,
      include: this.includeRelations,
    });
    return this.resolveStatus(updated);
  }

  async deleteTask(id: string) {
    await this.findOne(id);
    return this.prisma.task.delete({ where: { id } });
  }

  async logContact(taskId: string, dto: LogContactDto, userId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      select: { id: true, donorId: true, contactCount: true },
    });
    if (!task) throw new NotFoundException('Task not found');

    const now = new Date();

    // Determine channel from contactMethod
    const channel: CommunicationChannel =
      dto.contactMethod === 'EMAIL'
        ? CommunicationChannel.EMAIL
        : CommunicationChannel.WHATSAPP;

    // Create communication log entry
    const logEntry = await this.prisma.communicationLog.create({
      data: {
        donorId:      task.donorId ?? '',
        taskId:       taskId,
        channel,
        type:         CommunicationType.FOLLOW_UP,
        status:       CommunicationStatus.SENT,
        contactMethod: dto.contactMethod,
        outcome:      dto.outcome,
        messagePreview: dto.notes,
        sentById:     userId,
      },
    });

    // Increment contactCount and update lastContactedAt on the task
    await this.prisma.task.update({
      where: { id: taskId },
      data: {
        contactCount:    { increment: 1 },
        lastContactedAt: now,
      },
    });

    return logEntry;
  }

  async getContactLogs(taskId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      select: { id: true },
    });
    if (!task) throw new NotFoundException('Task not found');

    return this.prisma.communicationLog.findMany({
      where: { taskId },
      include: {
        sentBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getStaffList() {
    return this.prisma.user.findMany({
      where: {
        isActive: true,
        role: { in: [Role.STAFF, Role.ADMIN, Role.FOUNDER] },
      },
      select: { id: true, name: true, role: true },
      orderBy: { name: 'asc' },
    });
  }

  async getToday() {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const [dueTodayRaw, overdueRaw] = await Promise.all([
        this.prisma.task.findMany({
          where: {
            dueDate: { gte: today, lt: tomorrow },
          },
          include: this.includeRelations,
          orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
        }),
        this.prisma.task.findMany({
          where: {
            status: TaskStatus.PENDING,
            dueDate: { lt: today },
          },
          include: this.includeRelations,
          orderBy: [{ dueDate: 'asc' }],
        }),
      ]);

      const dueToday = dueTodayRaw
        .filter(Boolean)
        .map((t) => this.safeMapTask(this.resolveStatus(t)));

      const overdue = overdueRaw
        .filter(Boolean)
        .map((t) => this.safeMapTask({ ...t, status: TaskStatus.OVERDUE }));

      return {
        dueToday,
        overdue,
        total: dueToday.length + overdue.length,
      };
    } catch (error) {
      console.error('[TasksService] getToday() error:', error?.message ?? error);
      return { dueToday: [], overdue: [], total: 0 };
    }
  }
}
