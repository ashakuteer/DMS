import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type LeaveType = 'CASUAL' | 'SICK' | 'EARNED' | 'UNPAID';

@Injectable()
export class StaffLeavesService {
  constructor(private prisma: PrismaService) {}

  // ─── List leaves ─────────────────────────────────────────────────────────

  async findAll(params: {
    staffId?: string;
    status?: string;
    type?: string;
    year?: number;
    homeId?: string;
  }) {
    const where: any = {};

    if (params.staffId) where.staffId = params.staffId;
    if (params.status) where.status = params.status;
    if (params.type) where.type = params.type;
    if (params.year) {
      where.startDate = {
        gte: new Date(`${params.year}-01-01`),
        lte: new Date(`${params.year}-12-31`),
      };
    }
    if (params.homeId) {
      where.staff = { homeId: params.homeId };
    }

    return this.prisma.staffLeave.findMany({
      where,
      include: {
        staff: { select: { id: true, name: true, designation: true, home: { select: { id: true, name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ─── Get by staff ─────────────────────────────────────────────────────────

  async findByStaff(staffId: string, year?: number) {
    const staff = await this.prisma.staff.findUnique({ where: { id: staffId } });
    if (!staff) throw new NotFoundException('Staff member not found');

    const where: any = { staffId };
    if (year) {
      where.startDate = {
        gte: new Date(`${year}-01-01`),
        lte: new Date(`${year}-12-31`),
      };
    }

    return this.prisma.staffLeave.findMany({
      where,
      orderBy: { startDate: 'desc' },
    });
  }

  // ─── Create leave ─────────────────────────────────────────────────────────

  async create(data: {
    staffId: string;
    type: string;
    startDate: string;
    endDate: string;
    days: number;
    reason?: string;
  }) {
    const staff = await this.prisma.staff.findUnique({ where: { id: data.staffId } });
    if (!staff) throw new NotFoundException('Staff member not found');

    return this.prisma.staffLeave.create({
      data: {
        staffId: data.staffId,
        type: data.type || 'CASUAL',
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        days: data.days || 1,
        reason: data.reason ?? null,
        status: 'PENDING',
      },
      include: {
        staff: { select: { id: true, name: true, designation: true } },
      },
    });
  }

  // ─── Update status ────────────────────────────────────────────────────────

  async updateStatus(id: string, status: LeaveStatus, notes?: string) {
    const leave = await this.prisma.staffLeave.findUnique({ where: { id } });
    if (!leave) throw new NotFoundException('Leave record not found');

    return this.prisma.staffLeave.update({
      where: { id },
      data: { status, notes: notes ?? null },
      include: {
        staff: { select: { id: true, name: true } },
      },
    });
  }

  // ─── Delete leave ─────────────────────────────────────────────────────────

  async delete(id: string) {
    const leave = await this.prisma.staffLeave.findUnique({ where: { id } });
    if (!leave) throw new NotFoundException('Leave record not found');
    return this.prisma.staffLeave.delete({ where: { id } });
  }

  // ─── Summary per staff ────────────────────────────────────────────────────

  async getSummary(staffId: string, year: number) {
    const staff = await this.prisma.staff.findUnique({ where: { id: staffId } });
    if (!staff) throw new NotFoundException('Staff member not found');

    const leaves = await this.prisma.staffLeave.findMany({
      where: {
        staffId,
        status: 'APPROVED',
        startDate: {
          gte: new Date(`${year}-01-01`),
          lte: new Date(`${year}-12-31`),
        },
      },
    });

    const summary: Record<string, number> = { CASUAL: 0, SICK: 0, EARNED: 0, UNPAID: 0 };
    for (const l of leaves) {
      if (summary[l.type] !== undefined) summary[l.type] += l.days;
      else summary[l.type] = l.days;
    }

    return { staffId, year, approved: leaves.length, totalDays: leaves.reduce((s, l) => s + l.days, 0), byType: summary };
  }
}
