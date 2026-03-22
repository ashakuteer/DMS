import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TaskStatus, TaskPriority, TaskType, Role } from '@prisma/client';
import { CreateTaskDto, UpdateTaskDto } from './tasks.dto';

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
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (task.status === TaskStatus.PENDING && new Date(task.dueDate) < today) {
      return { ...task, status: TaskStatus.OVERDUE };
    }
    return task;
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
    dueDate?: string;
  }) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const where: any = {};

    if (query.status) {
      if (query.status === 'OVERDUE') {
        where.status = TaskStatus.PENDING;
        where.dueDate = { lt: today };
      } else {
        where.status = query.status as TaskStatus;
      }
    }

    if (query.type) {
      where.type = query.type as TaskType;
    }

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

  async updateTask(id: string, dto: UpdateTaskDto) {
    await this.findOne(id);
    const updated = await this.prisma.task.update({
      where: { id },
      data: {
        assignedTo: dto.assignedTo ?? null,
      },
      include: this.includeRelations,
    });
    return this.resolveStatus(updated);
  }

  async getToday() {
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

    const dueToday = dueTodayRaw.map((t) => this.resolveStatus(t));
    const overdue = overdueRaw.map((t) => ({ ...t, status: TaskStatus.OVERDUE }));

    return {
      dueToday,
      overdue,
      total: dueToday.length + overdue.length,
    };
  }
}
