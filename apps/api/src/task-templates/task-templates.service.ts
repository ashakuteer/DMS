import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TaskStatus, TaskPriority } from '@prisma/client';

// How many days ahead to schedule per recurrence type
const RECURRENCE_DAYS: Record<string, number> = {
  DAILY: 1,
  WEEKLY: 7,
  MONTHLY: 30,
  QUARTERLY: 90,
  HALF_YEARLY: 180,
  ANNUAL: 365,
};

@Injectable()
export class TaskTemplatesService {
  constructor(private prisma: PrismaService) {}

  // ─── CRUD ─────────────────────────────────────────────────────────────────

  async findAll(includeInactive = false) {
    return this.prisma.taskTemplate.findMany({
      where: includeInactive ? {} : { isActive: true },
      include: {
        tasks: { where: { deletedAt: null }, select: { id: true, status: true, createdAt: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const t = await this.prisma.taskTemplate.findUnique({
      where: { id },
      include: {
        tasks: {
          where: { deletedAt: null },
          select: { id: true, status: true, createdAt: true, assignedTo: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });
    if (!t) throw new NotFoundException('Task template not found');
    return t;
  }

  async create(data: {
    title: string;
    description?: string;
    recurrenceType: string;
    category: string;
    priority: string;
    assignedToRole?: string;
    assignedToId?: string;
  }, createdById: string) {
    return this.prisma.taskTemplate.create({
      data: {
        title: data.title,
        description: data.description ?? null,
        recurrenceType: data.recurrenceType || 'DAILY',
        category: data.category || 'GENERAL',
        priority: data.priority || 'MEDIUM',
        assignedToRole: data.assignedToRole ?? null,
        assignedToId: data.assignedToId ?? null,
        createdById,
      },
    });
  }

  async update(id: string, data: {
    title?: string;
    description?: string;
    recurrenceType?: string;
    category?: string;
    priority?: string;
    assignedToRole?: string;
    assignedToId?: string;
    isActive?: boolean;
  }) {
    await this.findOne(id);
    return this.prisma.taskTemplate.update({ where: { id }, data });
  }

  async delete(id: string) {
    await this.findOne(id);
    return this.prisma.taskTemplate.delete({ where: { id } });
  }

  // ─── Generate tasks from template ─────────────────────────────────────────

  async generateTasks(templateId: string, options: {
    forDate?: string;
    targetUserIds?: string[];
    createdById: string;
  }) {
    const template = await this.findOne(templateId);

    const dueDate = options.forDate ? new Date(options.forDate) : new Date();
    // Push due date forward by recurrence period
    dueDate.setDate(dueDate.getDate() + (RECURRENCE_DAYS[template.recurrenceType] || 1));

    // Determine who to assign to
    let userIds: string[] = [];

    if (options.targetUserIds && options.targetUserIds.length > 0) {
      userIds = options.targetUserIds;
    } else if (template.assignedToId) {
      userIds = [template.assignedToId];
    } else if (template.assignedToRole) {
      const users = await this.prisma.user.findMany({
        where: { isActive: true, role: template.assignedToRole as any },
        select: { id: true },
      });
      userIds = users.map((u) => u.id);
    } else {
      // Assign to all active users
      const users = await this.prisma.user.findMany({
        where: { isActive: true },
        select: { id: true },
      });
      userIds = users.map((u) => u.id);
    }

    if (userIds.length === 0) {
      return { generated: 0, message: 'No matching users found' };
    }

    // Avoid duplicate tasks (same template+user+dueDate)
    const created: string[] = [];

    for (const userId of userIds) {
      const existing = await this.prisma.staffTask.findFirst({
        where: {
          templateId,
          assignedToId: userId,
          dueDate: { gte: new Date(new Date(dueDate).setHours(0, 0, 0, 0)), lte: new Date(new Date(dueDate).setHours(23, 59, 59, 999)) },
          deletedAt: null,
        },
      });
      if (existing) continue;

      const task = await this.prisma.staffTask.create({
        data: {
          title: template.title,
          description: template.description ?? null,
          status: TaskStatus.PENDING,
          priority: template.priority as TaskPriority,
          category: template.category as any,
          assignedToId: userId,
          createdById: options.createdById,
          dueDate,
          isRecurring: true,
          recurrenceType: template.recurrenceType as any,
          templateId,
        },
        select: { id: true },
      });
      created.push(task.id);
    }

    return { generated: created.length, total: userIds.length, taskIds: created };
  }

  // ─── Mark overdue tasks as MISSED ─────────────────────────────────────────

  async markOverdueMissed() {
    const now = new Date();
    const result = await this.prisma.staffTask.updateMany({
      where: {
        deletedAt: null,
        status: { in: [TaskStatus.PENDING, TaskStatus.IN_PROGRESS, TaskStatus.OVERDUE] },
        dueDate: { lt: now },
      },
      data: { status: TaskStatus.MISSED },
    });
    return { marked: result.count };
  }

  // ─── Performance (all staff) ──────────────────────────────────────────────

  async getPerformanceAll(days = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const users = await this.prisma.user.findMany({
      where: { isActive: true },
      select: { id: true, name: true, email: true, role: true },
      orderBy: { name: 'asc' },
    });

    const results = await Promise.all(
      users.map(async (user) => {
        const baseWhere = { assignedToId: user.id, deletedAt: null, createdAt: { gte: since } };

        const [total, completed, onTimeRows, timeRows] = await Promise.all([
          this.prisma.staffTask.count({ where: baseWhere }),
          this.prisma.staffTask.count({ where: { ...baseWhere, status: TaskStatus.COMPLETED } }),
          this.prisma.staffTask.findMany({
            where: { ...baseWhere, status: TaskStatus.COMPLETED, completedAt: { not: null }, dueDate: { not: null } },
            select: { completedAt: true, dueDate: true },
          }),
          this.prisma.staffTask.findMany({
            where: { ...baseWhere, status: TaskStatus.COMPLETED, minutesTaken: { not: null } },
            select: { minutesTaken: true },
          }),
        ]);

        const completionRate = total > 0 ? (completed / total) * 100 : 0;
        const onTimeCount = onTimeRows.filter((t) => t.completedAt! <= t.dueDate!).length;
        const timelinessScore = completed > 0 ? (onTimeCount / completed) * 100 : 0;
        const avgMinutes = timeRows.length > 0
          ? timeRows.reduce((s, t) => s + (t.minutesTaken || 0), 0) / timeRows.length
          : null;
        const efficiencyScore = avgMinutes === null ? 80 : avgMinutes < 30 ? 100 : avgMinutes <= 60 ? 80 : 60;
        const score = Math.round((completionRate + timelinessScore + efficiencyScore) / 3);

        return {
          userId: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          total,
          completed,
          onTime: onTimeCount,
          completionRate: Math.round(completionRate),
          timelinessScore: Math.round(timelinessScore),
          efficiencyScore,
          avgMinutesTaken: avgMinutes !== null ? Math.round(avgMinutes) : null,
          score,
          grade: score >= 90 ? 'A' : score >= 70 ? 'B' : score >= 50 ? 'C' : score >= 30 ? 'D' : 'F',
        };
      }),
    );

    const sorted = results.sort((a, b) => b.score - a.score);
    return sorted.map((r, i) => ({ ...r, rank: i + 1, isTopPerformer: i === 0 && r.total > 0 }));
  }

  // ─── Accountability score ─────────────────────────────────────────────────

  async getAccountabilityScore(userId: string, days = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const [assigned, completed, missed, onTime, withTime] = await Promise.all([
      this.prisma.staffTask.count({
        where: { assignedToId: userId, deletedAt: null, createdAt: { gte: since } },
      }),
      this.prisma.staffTask.count({
        where: { assignedToId: userId, deletedAt: null, status: TaskStatus.COMPLETED, createdAt: { gte: since } },
      }),
      this.prisma.staffTask.count({
        where: { assignedToId: userId, deletedAt: null, status: TaskStatus.MISSED, createdAt: { gte: since } },
      }),
      // On-time: completed before dueDate
      this.prisma.staffTask.findMany({
        where: { assignedToId: userId, deletedAt: null, status: TaskStatus.COMPLETED, completedAt: { not: null }, dueDate: { not: null }, createdAt: { gte: since } },
        select: { completedAt: true, dueDate: true, minutesTaken: true },
      }),
      // With time data
      this.prisma.staffTask.findMany({
        where: { assignedToId: userId, deletedAt: null, status: TaskStatus.COMPLETED, minutesTaken: { not: null }, createdAt: { gte: since } },
        select: { minutesTaken: true },
      }),
    ]);

    const onTimeCount = onTime.filter((t) => t.completedAt! <= t.dueDate!).length;
    const avgMinutes = withTime.length > 0 ? withTime.reduce((s, t) => s + (t.minutesTaken || 0), 0) / withTime.length : null;

    // Score formula:
    // Completion rate × 60
    // On-time rate × 25
    // Not-missed rate × 15
    let score = 0;
    if (assigned > 0) {
      score += (completed / assigned) * 60;
      score += (1 - missed / assigned) * 15;
    }
    if (completed > 0) {
      score += (onTimeCount / completed) * 25;
    }
    score = Math.max(0, Math.min(100, Math.round(score)));

    return {
      userId,
      days,
      assigned,
      completed,
      missed,
      onTime: onTimeCount,
      score,
      grade: score >= 90 ? 'A' : score >= 75 ? 'B' : score >= 60 ? 'C' : score >= 40 ? 'D' : 'F',
      avgMinutesTaken: avgMinutes !== null ? Math.round(avgMinutes) : null,
    };
  }
}
