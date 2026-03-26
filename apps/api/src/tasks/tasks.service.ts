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
      select: { id: true, pledgeType: true, amount: true, quantity: true, expectedFulfillmentDate: true },
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
          // Today: show today's tasks AND all overdue pending tasks
          where.status = TaskStatus.PENDING;
          where.dueDate = { lt: tomorrow };
          break;
        case '7days': {
          const end7 = new Date(today);
          end7.setDate(end7.getDate() + 8);
          // Include overdue + next 7 days — no lower bound on dueDate
          where.status = TaskStatus.PENDING;
          where.dueDate = { lt: end7 };
          break;
        }
        case '15days': {
          const end15 = new Date(today);
          end15.setDate(end15.getDate() + 16);
          where.status = TaskStatus.PENDING;
          where.dueDate = { lt: end15 };
          break;
        }
        case '30days': {
          const end30 = new Date(today);
          end30.setDate(end30.getDate() + 31);
          // Include overdue + next 30 days — no lower bound on dueDate
          where.status = TaskStatus.PENDING;
          where.dueDate = { lt: end30 };
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

  async getDebugInfo() {
    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end7 = new Date(today);
    end7.setDate(end7.getDate() + 8);
    const end30 = new Date(today);
    end30.setDate(end30.getDate() + 31);

    const [
      taskCountsByType,
      birthdayTaskSample,
      anniversaryTaskSample,
      pledgeTaskSample,
      donorsWithDob,
      donorsTotal,
      occasions,
      pendingPledgesTotal,
      pendingPledgesNext30,
    ] = await Promise.all([
      // Count tasks grouped by type and status
      this.prisma.task.groupBy({
        by: ['type', 'status'],
        _count: { id: true },
        orderBy: [{ type: 'asc' }],
      }),
      // Sample of BIRTHDAY tasks (all, not filtered by date)
      this.prisma.task.findMany({
        where: { type: TaskType.BIRTHDAY },
        select: { id: true, title: true, dueDate: true, status: true, donorId: true },
        orderBy: { dueDate: 'asc' },
        take: 20,
      }),
      // Sample of ANNIVERSARY tasks
      this.prisma.task.findMany({
        where: { type: TaskType.ANNIVERSARY },
        select: { id: true, title: true, dueDate: true, status: true, donorId: true },
        orderBy: { dueDate: 'asc' },
        take: 20,
      }),
      // Sample of PLEDGE tasks
      this.prisma.task.findMany({
        where: { type: TaskType.PLEDGE },
        select: { id: true, title: true, dueDate: true, status: true, donorId: true, sourcePledgeId: true },
        orderBy: { dueDate: 'asc' },
        take: 30,
      }),
      // Donors with dob data
      this.prisma.donor.count({
        where: { dobMonth: { not: null }, dobDay: { not: null }, isDeleted: false },
      }),
      // Total active donors
      this.prisma.donor.count({ where: { isDeleted: false } }),
      // Special occasions grouped by type
      this.prisma.donorSpecialOccasion.groupBy({
        by: ['type'],
        _count: { id: true },
        orderBy: { type: 'asc' },
      }),
      // Total pending pledges (not deleted)
      this.prisma.pledge.count({ where: { status: 'PENDING', isDeleted: false } }),
      // Pending pledges due in next 30 days or overdue
      this.prisma.pledge.count({
        where: {
          status: 'PENDING',
          isDeleted: false,
          expectedFulfillmentDate: { lte: end30 },
        },
      }),
    ]);

    // Pending birthday tasks in next 7 days
    const birthdayNext7 = birthdayTaskSample.filter(
      t => t.status === TaskStatus.PENDING && new Date(t.dueDate) >= today && new Date(t.dueDate) < end7
    );
    // Pending birthday tasks in next 30 days
    const birthdayNext30 = birthdayTaskSample.filter(
      t => t.status === TaskStatus.PENDING && new Date(t.dueDate) >= today && new Date(t.dueDate) < end30
    );

    return {
      serverTime: {
        nowUTC: now.toISOString(),
        todayMidnightUTC: today.toISOString(),
        end7UTC: end7.toISOString(),
        nodeTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        utcOffset: -now.getTimezoneOffset(),
      },
      donors: {
        total: donorsTotal,
        withDobData: donorsWithDob,
        withoutDobData: donorsTotal - donorsWithDob,
      },
      occasions: occasions.map(o => ({ type: o.type, count: o._count.id })),
      taskSummary: taskCountsByType.map(r => ({
        type: r.type,
        status: r.status,
        count: r._count.id,
      })),
      birthdayTasks: {
        totalInDB: birthdayTaskSample.length,
        pendingNext7Days: birthdayNext7.length,
        pendingNext30Days: birthdayNext30.length,
        all: birthdayTaskSample.map(t => ({
          id: t.id,
          title: t.title,
          dueDate: t.dueDate,
          dueDateISO: new Date(t.dueDate).toISOString(),
          status: t.status,
          daysUntil: Math.round((new Date(t.dueDate).getTime() - today.getTime()) / 86400000),
        })),
      },
      anniversaryTasks: {
        totalInDB: anniversaryTaskSample.length,
        all: anniversaryTaskSample.map(t => ({
          id: t.id,
          title: t.title,
          dueDate: t.dueDate,
          dueDateISO: new Date(t.dueDate).toISOString(),
          status: t.status,
          daysUntil: Math.round((new Date(t.dueDate).getTime() - today.getTime()) / 86400000),
        })),
      },
      pledges: {
        pendingTotal: pendingPledgesTotal,
        pendingDueIn30DaysOrOverdue: pendingPledgesNext30,
        tasksGeneratedInDB: pledgeTaskSample.length,
        tasks: pledgeTaskSample.map(t => ({
          id: t.id,
          title: t.title,
          dueDate: t.dueDate,
          dueDateISO: new Date(t.dueDate).toISOString(),
          status: t.status,
          sourcePledgeId: t.sourcePledgeId,
          daysUntil: Math.round((new Date(t.dueDate).getTime() - today.getTime()) / 86400000),
        })),
      },
      filterWindowDates: {
        today: today.toISOString(),
        end7days: end7.toISOString(),
        end30days: end30.toISOString(),
      },
    };
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
