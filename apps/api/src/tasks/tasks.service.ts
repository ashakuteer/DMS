import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TaskStatus, TaskPriority, TaskType, Role } from '@prisma/client';
import { CreateTaskDto, UpdateTaskDto } from './tasks.dto';

const DONOR_TYPES: TaskType[] = [
  TaskType.BIRTHDAY,
  TaskType.FOLLOW_UP,
  TaskType.PLEDGE,
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
      id:            task.id            ?? null,
      title:         task.title         ?? '',
      description:   task.description   ?? null,
      type:          task.type          ?? null,
      status:        task.status        ?? null,
      priority:      task.priority      ?? null,
      dueDate:       task.dueDate       ?? null,
      completedAt:   task.completedAt   ?? null,
      donorId:       task.donorId       ?? null,
      beneficiaryId: task.beneficiaryId ?? null,
      assignedTo:    task.assignedTo    ?? null,
      createdAt:     task.createdAt     ?? null,
      updatedAt:     task.updatedAt     ?? null,
      donor:         task.donor         ?? null,
      beneficiary:   task.beneficiary   ?? null,
      assignedUser:  task.assignedUser  ?? null,
    };
  }

  async create(dto: CreateTaskDto) {
    return this.prisma.task.create({
      data: {
        title: dto.title,
        description: dto.description,
        type: dto.type,
        priority: dto.priority ?? TaskPriority.MEDIUM,
        dueDate: new Date(dto.dueDate),
        donorId: dto.donorId,
        beneficiaryId: dto.beneficiaryId,
        assignedTo: dto.assignedTo,
      },
      include: this.includeRelations,
    });
  }

  async findAll(query: {
    status?: string;
    type?: string;
    category?: string;
    dueDate?: string;
    assignedTo?: string;
    priority?: string;
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
    if (query.category === 'donor') {
      where.type = { in: DONOR_TYPES };
    } else if (query.category === 'staff') {
      where.type = { in: STAFF_TYPES };
    } else if (query.type) {
      // Single type filter
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

    // Due date filter
    if (query.dueDate === 'today') {
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
