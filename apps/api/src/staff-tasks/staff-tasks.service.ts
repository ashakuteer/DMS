import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TaskStatus, TaskPriority, TaskCategory } from '@prisma/client';

@Injectable()
export class StaffTasksService {
  private readonly logger = new Logger(StaffTasksService.name);

  constructor(private prisma: PrismaService) {}

  private readonly includeRelations = {
    assignedTo: {
      select: { id: true, name: true, email: true },
    },
    createdBy: {
      select: { id: true, name: true },
    },
    linkedDonor: {
      select: { id: true, donorCode: true, firstName: true, lastName: true },
    },
  };

  async findAll(query: {
    status?: string;
    priority?: string;
    assignedToId?: string;
    createdById?: string;
    category?: string;
    search?: string;
    page?: number;
    limit?: number;
    isRecurring?: boolean;
  }) {
    const { status, priority, assignedToId, createdById, category, search } = query;
    const page = query.page || 1;
    const limit = query.limit || 50;

    const where: any = { deletedAt: null };

    if (status) where.status = status as TaskStatus;
    if (priority) where.priority = priority as TaskPriority;
    if (assignedToId) where.assignedToId = assignedToId;
    if (createdById) where.createdById = createdById;
    if (category) where.category = category as TaskCategory;
    if (query.isRecurring !== undefined) where.isRecurring = query.isRecurring;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.staffTask.findMany({
        where,
        include: this.includeRelations,
        orderBy: [{ dueDate: 'asc' }, { priority: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.staffTask.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const item = await this.prisma.staffTask.findUnique({
      where: { id },
      include: this.includeRelations,
    });
    if (!item || item.deletedAt) {
      throw new NotFoundException('Task not found');
    }
    return item;
  }

  async create(data: {
    title: string;
    description?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    category?: TaskCategory;
    assignedToId: string;
    linkedDonorId?: string;
    dueDate?: string;
    notes?: string;
  }, userId: string) {
    const createData: any = {
      title: data.title,
      description: data.description ?? null,
      status: data.status || TaskStatus.PENDING,
      priority: data.priority || TaskPriority.MEDIUM,
      category: data.category || TaskCategory.GENERAL,
      assignedToId: data.assignedToId,
      createdById: userId,
      linkedDonorId: data.linkedDonorId || null,
      notes: data.notes ?? null,
    };

    if (data.dueDate) createData.dueDate = new Date(data.dueDate);
    if (createData.status === TaskStatus.IN_PROGRESS) createData.startedAt = new Date();
    if (createData.status === TaskStatus.COMPLETED) {
      createData.startedAt = new Date();
      createData.completedAt = new Date();
    }

    return this.prisma.staffTask.create({
      data: createData,
      include: this.includeRelations,
    });
  }

  async update(id: string, data: {
    title?: string;
    description?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    category?: TaskCategory;
    assignedToId?: string;
    linkedDonorId?: string;
    dueDate?: string;
    notes?: string;
  }, userId: string) {
    const existing = await this.findOne(id);

    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.assignedToId !== undefined) updateData.assignedToId = data.assignedToId;
    if (data.linkedDonorId !== undefined) updateData.linkedDonorId = data.linkedDonorId || null;
    if (data.dueDate !== undefined) updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;
    if (data.notes !== undefined) updateData.notes = data.notes;

    if (data.status !== undefined && data.status !== existing.status) {
      updateData.status = data.status;
      if (data.status === TaskStatus.IN_PROGRESS && !existing.startedAt) {
        updateData.startedAt = new Date();
      }
      if (data.status === TaskStatus.COMPLETED) {
        if (!existing.startedAt) updateData.startedAt = new Date();
        updateData.completedAt = new Date();
      }
    }
    if ((data as any).checklist !== undefined) updateData.checklist = (data as any).checklist;
    if ((data as any).minutesTaken !== undefined) updateData.minutesTaken = (data as any).minutesTaken || null;
    if ((data as any).isRecurring !== undefined) updateData.isRecurring = (data as any).isRecurring;
    if ((data as any).recurrenceType !== undefined) updateData.recurrenceType = (data as any).recurrenceType;

    return this.prisma.staffTask.update({
      where: { id },
      data: updateData,
      include: this.includeRelations,
    });
  }

  async delete(id: string) {
    await this.findOne(id);
    return this.prisma.staffTask.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async getStats(userId?: string) {
    const where: any = { deletedAt: null };
    if (userId) where.assignedToId = userId;

    const now = new Date();

    const [pending, inProgress, completed, overdue] = await Promise.all([
      this.prisma.staffTask.count({ where: { ...where, status: TaskStatus.PENDING } }),
      this.prisma.staffTask.count({ where: { ...where, status: TaskStatus.IN_PROGRESS } }),
      this.prisma.staffTask.count({ where: { ...where, status: TaskStatus.COMPLETED } }),
      this.prisma.staffTask.count({
        where: {
          ...where,
          status: { in: [TaskStatus.PENDING, TaskStatus.IN_PROGRESS, TaskStatus.OVERDUE] },
          dueDate: { lt: now },
        },
      }),
    ]);

    return { pending, inProgress, completed, overdue, total: pending + inProgress + completed + overdue };
  }

  async getStaffList() {
    const users = await this.prisma.user.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
      orderBy: { name: 'asc' },
    });

    const now = new Date();

    const staffList = await Promise.all(
      users.map(async (user) => {
        const baseWhere = { assignedToId: user.id, deletedAt: null };

        const [assigned, completed, overdue, latestPerformance] = await Promise.all([
          this.prisma.staffTask.count({ where: baseWhere }),
          this.prisma.staffTask.count({ where: { ...baseWhere, status: TaskStatus.COMPLETED } }),
          this.prisma.staffTask.count({
            where: {
              ...baseWhere,
              status: { in: [TaskStatus.PENDING, TaskStatus.IN_PROGRESS, TaskStatus.OVERDUE] },
              dueDate: { lt: now },
            },
          }),
          this.prisma.staffPerformance.findFirst({
            where: { userId: user.id },
            orderBy: [{ year: 'desc' }, { month: 'desc' }],
          }),
        ]);

        return {
          ...user,
          taskStats: { assigned, completed, overdue },
          latestPerformanceScore: latestPerformance?.score ?? null,
        };
      }),
    );

    return staffList;
  }

  async getStaffPerformance(userId: string, year?: number) {
    const where: any = { userId };
    if (year) where.year = year;

    return this.prisma.staffPerformance.findMany({
      where,
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });
  }

  async calculatePerformance(userId: string, month: number, year: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    const baseWhere = {
      assignedToId: userId,
      deletedAt: null,
      createdAt: { gte: startDate, lt: endDate },
    };

    const [tasksAssigned, tasksCompleted, tasksOnTime, tasksOverdue, followUpsDone, donorResponses] =
      await Promise.all([
        this.prisma.staffTask.count({ where: baseWhere }),
        this.prisma.staffTask.count({
          where: { ...baseWhere, status: TaskStatus.COMPLETED },
        }),
        this.prisma.staffTask.count({
          where: {
            ...baseWhere,
            status: TaskStatus.COMPLETED,
            completedAt: { not: null },
            dueDate: { not: null },
            AND: [
              {
                completedAt: { not: null },
                dueDate: { not: null },
              },
            ],
          },
        }).then(async () => {
          const onTimeTasks = await this.prisma.staffTask.findMany({
            where: {
              assignedToId: userId,
              deletedAt: null,
              createdAt: { gte: startDate, lt: endDate },
              status: TaskStatus.COMPLETED,
              completedAt: { not: null },
              dueDate: { not: null },
            },
            select: { completedAt: true, dueDate: true },
          });
          return onTimeTasks.filter((t) => t.completedAt! <= t.dueDate!).length;
        }),
        this.prisma.staffTask.count({
          where: {
            assignedToId: userId,
            deletedAt: null,
            createdAt: { gte: startDate, lt: endDate },
            status: { in: [TaskStatus.PENDING, TaskStatus.IN_PROGRESS, TaskStatus.OVERDUE] },
            dueDate: { lt: new Date() },
          },
        }),
        this.prisma.followUpReminder.count({
          where: {
            assignedToId: userId,
            status: 'COMPLETED',
            completedAt: { gte: startDate, lt: endDate },
          },
        }),
        this.prisma.communicationLog.count({
          where: {
            sentById: userId,
            createdAt: { gte: startDate, lt: endDate },
          },
        }),
      ]);

    let score = 0;
    if (tasksAssigned > 0) {
      score += (tasksCompleted / tasksAssigned) * 50;
      score -= (tasksOverdue / tasksAssigned) * 20;
    }
    if (tasksCompleted > 0) {
      score += (tasksOnTime / tasksCompleted) * 30;
    }
    score += Math.min(followUpsDone / 10, 1) * 10;
    score += Math.min(donorResponses / 5, 1) * 10;
    score = Math.max(0, Math.min(100, Math.round(score * 100) / 100));

    const result = await this.prisma.staffPerformance.upsert({
      where: {
        userId_month_year: { userId, month, year },
      },
      create: {
        userId,
        month,
        year,
        tasksAssigned,
        tasksCompleted,
        tasksOnTime,
        tasksOverdue,
        followUpsDone,
        donorResponses,
        score,
      },
      update: {
        tasksAssigned,
        tasksCompleted,
        tasksOnTime,
        tasksOverdue,
        followUpsDone,
        donorResponses,
        score,
      },
    });

    this.logger.log(`Performance calculated for user ${userId}: ${score} (${month}/${year})`);
    return result;
  }

  async getKanbanBoard(assignedToId?: string) {
    const where: any = { deletedAt: null };
    if (assignedToId) where.assignedToId = assignedToId;

    const tasks = await this.prisma.staffTask.findMany({
      where,
      include: this.includeRelations,
      orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
    });

    return {
      PENDING: tasks.filter((t) => t.status === TaskStatus.PENDING),
      IN_PROGRESS: tasks.filter((t) => t.status === TaskStatus.IN_PROGRESS),
      COMPLETED: tasks.filter((t) => t.status === TaskStatus.COMPLETED),
      OVERDUE: tasks.filter((t) => t.status === TaskStatus.OVERDUE),
    };
  }

  async updateTaskStatus(id: string, newStatus: TaskStatus, userId: string, extra?: { minutesTaken?: number; startedAt?: string; completedAt?: string; notes?: string }) {
    const existing = await this.findOne(id);

    const updateData: any = { status: newStatus };
    if (extra?.notes !== undefined) updateData.notes = extra.notes;

    if (newStatus === TaskStatus.IN_PROGRESS && !existing.startedAt) {
      updateData.startedAt = extra?.startedAt ? new Date(extra.startedAt) : new Date();
    }
    if (newStatus === TaskStatus.COMPLETED) {
      if (!existing.startedAt) updateData.startedAt = extra?.startedAt ? new Date(extra.startedAt) : new Date();
      updateData.completedAt = extra?.completedAt ? new Date(extra.completedAt) : new Date();

      // Auto-compute minutesTaken if we have start+end
      if (extra?.minutesTaken) {
        updateData.minutesTaken = extra.minutesTaken;
      } else if (updateData.startedAt && updateData.completedAt) {
        const mins = Math.round((updateData.completedAt.getTime() - updateData.startedAt.getTime()) / 60000);
        if (mins > 0) updateData.minutesTaken = mins;
      } else if (existing.startedAt && updateData.completedAt) {
        const mins = Math.round((updateData.completedAt.getTime() - existing.startedAt.getTime()) / 60000);
        if (mins > 0) updateData.minutesTaken = mins;
      }
    }

    return this.prisma.staffTask.update({
      where: { id },
      data: updateData,
      include: this.includeRelations,
    });
  }
}
