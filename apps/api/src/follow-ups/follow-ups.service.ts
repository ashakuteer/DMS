import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FollowUpStatus, FollowUpPriority } from '@prisma/client';

@Injectable()
export class FollowUpsService {
  constructor(private prisma: PrismaService) {}

  private readonly includeRelations = {
    donor: {
      select: {
        id: true,
        donorCode: true,
        firstName: true,
        lastName: true,
        primaryPhone: true,
        personalEmail: true,
        officialEmail: true,
      },
    },
    assignedTo: {
      select: { id: true, name: true, email: true },
    },
    createdBy: {
      select: { id: true, name: true },
    },
  };

  async findAll(query: {
    status?: string;
    assignedToId?: string;
    donorId?: string;
    priority?: string;
    dueBefore?: string;
    dueAfter?: string;
    page?: number;
    limit?: number;
    userId: string;
    userRole: string;
  }) {
    const { status, assignedToId, donorId, priority, dueBefore, dueAfter, userId, userRole } = query;
    const page = query.page || 1;
    const limit = query.limit || 50;

    const where: any = { isDeleted: false };

    if (status) {
      where.status = status;
    }
    if (priority) {
      where.priority = priority;
    }
    if (donorId) {
      where.donorId = donorId;
    }
    if (userRole !== 'ADMIN') {
      where.assignedToId = userId;
    } else if (assignedToId) {
      where.assignedToId = assignedToId;
    }
    if (dueBefore || dueAfter) {
      where.dueDate = {};
      if (dueBefore) where.dueDate.lte = new Date(dueBefore);
      if (dueAfter) where.dueDate.gte = new Date(dueAfter);
    }

    const [items, total] = await Promise.all([
      this.prisma.followUpReminder.findMany({
        where,
        include: this.includeRelations,
        orderBy: [{ dueDate: 'asc' }, { priority: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.followUpReminder.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string, userId?: string, userRole?: string) {
    const item = await this.prisma.followUpReminder.findUnique({
      where: { id },
      include: this.includeRelations,
    });
    if (!item || item.isDeleted) {
      throw new NotFoundException('Follow-up reminder not found');
    }
    if (userId && userRole && userRole !== 'ADMIN' && item.assignedToId !== userId) {
      throw new ForbiddenException('You can only view follow-ups assigned to you');
    }
    return item;
  }

  async create(data: {
    donorId: string;
    assignedToId: string;
    note: string;
    dueDate: string;
    priority?: FollowUpPriority;
    createdById: string;
  }) {
    const donor = await this.prisma.donor.findUnique({ where: { id: data.donorId } });
    if (!donor || donor.isDeleted) {
      throw new NotFoundException('Donor not found');
    }

    return this.prisma.followUpReminder.create({
      data: {
        donorId: data.donorId,
        assignedToId: data.assignedToId,
        createdById: data.createdById,
        note: data.note,
        dueDate: new Date(data.dueDate),
        priority: data.priority || FollowUpPriority.NORMAL,
      },
      include: this.includeRelations,
    });
  }

  async update(id: string, data: {
    note?: string;
    dueDate?: string;
    priority?: FollowUpPriority;
    assignedToId?: string;
  }, userId: string, userRole: string) {
    const existing = await this.findOne(id);

    if (userRole !== 'ADMIN' && existing.assignedToId !== userId && existing.createdById !== userId) {
      throw new ForbiddenException('You can only edit your own follow-ups');
    }

    const updateData: any = {};
    if (data.note !== undefined) updateData.note = data.note;
    if (data.dueDate) updateData.dueDate = new Date(data.dueDate);
    if (data.priority) updateData.priority = data.priority;
    if (data.assignedToId) updateData.assignedToId = data.assignedToId;

    return this.prisma.followUpReminder.update({
      where: { id },
      data: updateData,
      include: this.includeRelations,
    });
  }

  async markComplete(id: string, completedNote: string | null, userId: string, userRole: string) {
    const existing = await this.findOne(id);

    if (userRole !== 'ADMIN' && existing.assignedToId !== userId) {
      throw new ForbiddenException('You can only complete follow-ups assigned to you');
    }

    return this.prisma.followUpReminder.update({
      where: { id },
      data: {
        status: FollowUpStatus.COMPLETED,
        completedAt: new Date(),
        completedNote,
      },
      include: this.includeRelations,
    });
  }

  async reopen(id: string, userId: string, userRole: string) {
    const existing = await this.findOne(id);

    if (userRole !== 'ADMIN' && existing.assignedToId !== userId) {
      throw new ForbiddenException('You can only reopen follow-ups assigned to you');
    }

    return this.prisma.followUpReminder.update({
      where: { id },
      data: {
        status: FollowUpStatus.PENDING,
        completedAt: null,
        completedNote: null,
      },
      include: this.includeRelations,
    });
  }

  async remove(id: string, userId: string, userRole: string) {
    const existing = await this.findOne(id);

    if (userRole !== 'ADMIN') {
      throw new ForbiddenException('Only admins can delete follow-ups');
    }

    return this.prisma.followUpReminder.update({
      where: { id },
      data: { isDeleted: true },
    });
  }

  async getDashboardStats(userId: string, userRole: string) {
    const where: any = { isDeleted: false };
    if (userRole !== 'ADMIN') {
      where.assignedToId = userId;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const [total, pending, completed, overdue, dueToday, dueThisWeek] = await Promise.all([
      this.prisma.followUpReminder.count({ where }),
      this.prisma.followUpReminder.count({ where: { ...where, status: 'PENDING' } }),
      this.prisma.followUpReminder.count({ where: { ...where, status: 'COMPLETED' } }),
      this.prisma.followUpReminder.count({ where: { ...where, status: 'PENDING', dueDate: { lt: today } } }),
      this.prisma.followUpReminder.count({ where: { ...where, status: 'PENDING', dueDate: { gte: today, lt: tomorrow } } }),
      this.prisma.followUpReminder.count({ where: { ...where, status: 'PENDING', dueDate: { gte: today, lt: nextWeek } } }),
    ]);

    return { total, pending, completed, overdue, dueToday, dueThisWeek };
  }
}
