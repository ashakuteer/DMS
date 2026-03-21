import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class StaffAttendanceService {
  constructor(private prisma: PrismaService) {}

  // ─── Get daily attendance ────────────────────────────────────────────────

  async findAll(params: {
    date?: string;
    staffId?: string;
    homeId?: string;
    month?: string;
    year?: string;
  }) {
    const where: any = {};

    if (params.staffId) where.staffId = params.staffId;

    if (params.homeId) {
      where.staff = { homeId: params.homeId };
    }

    if (params.date) {
      where.date = new Date(params.date);
    } else if (params.month && params.year) {
      const y = parseInt(params.year);
      const m = parseInt(params.month) - 1;
      where.date = {
        gte: new Date(y, m, 1),
        lte: new Date(y, m + 1, 0),
      };
    }

    return this.prisma.staffAttendance.findMany({
      where,
      include: {
        staff: {
          select: {
            id: true,
            name: true,
            designation: true,
            home: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    });
  }

  // ─── Today's summary ──────────────────────────────────────────────────────

  async getTodaySummary(homeId?: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const where: any = { date: today };
    if (homeId) where.staff = { homeId };

    const records = await this.prisma.staffAttendance.findMany({
      where,
      select: { status: true },
    });

    const summary = { PRESENT: 0, ABSENT: 0, HALF_DAY: 0, LEAVE: 0, total: records.length };
    for (const r of records) {
      if (r.status in summary) (summary as any)[r.status]++;
    }
    return { date: today.toISOString().split('T')[0], ...summary };
  }

  // ─── Create attendance ────────────────────────────────────────────────────

  async create(data: {
    staffId: string;
    date: string;
    status: string;
    checkIn?: string;
    checkOut?: string;
    notes?: string;
  }) {
    const staff = await this.prisma.staff.findUnique({ where: { id: data.staffId } });
    if (!staff) throw new NotFoundException('Staff member not found');

    // Auto-check for approved leave on this date
    const dateObj = new Date(data.date);
    const autoStatus = await this.resolveStatus(data.staffId, dateObj, data.status);

    try {
      return await this.prisma.staffAttendance.create({
        data: {
          staffId: data.staffId,
          date: dateObj,
          status: autoStatus,
          checkIn: data.checkIn ? this.parseTime(data.checkIn) : null,
          checkOut: data.checkOut ? this.parseTime(data.checkOut) : null,
          notes: data.notes ?? null,
        },
        include: {
          staff: { select: { id: true, name: true, designation: true } },
        },
      });
    } catch (e: any) {
      if (e?.code === 'P2002') {
        throw new ConflictException(`Attendance already recorded for this staff on ${data.date}`);
      }
      throw e;
    }
  }

  // ─── Bulk create for a date ───────────────────────────────────────────────

  async bulkCreate(date: string, entries: { staffId: string; status: string; checkIn?: string; checkOut?: string; notes?: string }[]) {
    const dateObj = new Date(date);
    const results = { created: 0, skipped: 0, errors: [] as string[] };

    for (const entry of entries) {
      try {
        const autoStatus = await this.resolveStatus(entry.staffId, dateObj, entry.status);
        await this.prisma.staffAttendance.upsert({
          where: { staffId_date: { staffId: entry.staffId, date: dateObj } },
          update: {
            status: autoStatus,
            checkIn: entry.checkIn ? this.parseTime(entry.checkIn) : null,
            checkOut: entry.checkOut ? this.parseTime(entry.checkOut) : null,
            notes: entry.notes ?? null,
          },
          create: {
            staffId: entry.staffId,
            date: dateObj,
            status: autoStatus,
            checkIn: entry.checkIn ? this.parseTime(entry.checkIn) : null,
            checkOut: entry.checkOut ? this.parseTime(entry.checkOut) : null,
            notes: entry.notes ?? null,
          },
        });
        results.created++;
      } catch (e: any) {
        results.skipped++;
        results.errors.push(`${entry.staffId}: ${e.message}`);
      }
    }

    return results;
  }

  // ─── Update attendance ────────────────────────────────────────────────────

  async update(id: string, data: {
    status?: string;
    checkIn?: string | null;
    checkOut?: string | null;
    notes?: string | null;
  }) {
    const record = await this.prisma.staffAttendance.findUnique({ where: { id } });
    if (!record) throw new NotFoundException('Attendance record not found');

    return this.prisma.staffAttendance.update({
      where: { id },
      data: {
        status: data.status ?? undefined,
        checkIn: data.checkIn !== undefined ? (data.checkIn ? this.parseTime(data.checkIn) : null) : undefined,
        checkOut: data.checkOut !== undefined ? (data.checkOut ? this.parseTime(data.checkOut) : null) : undefined,
        notes: data.notes !== undefined ? data.notes : undefined,
      },
      include: {
        staff: { select: { id: true, name: true } },
      },
    });
  }

  // ─── Delete attendance ────────────────────────────────────────────────────

  async delete(id: string) {
    const record = await this.prisma.staffAttendance.findUnique({ where: { id } });
    if (!record) throw new NotFoundException('Attendance record not found');
    return this.prisma.staffAttendance.delete({ where: { id } });
  }

  // ─── Monthly summary per staff ────────────────────────────────────────────

  async getMonthlySummary(staffId: string, year: number, month: number) {
    const staff = await this.prisma.staff.findUnique({ where: { id: staffId } });
    if (!staff) throw new NotFoundException('Staff not found');

    const records = await this.prisma.staffAttendance.findMany({
      where: {
        staffId,
        date: {
          gte: new Date(year, month - 1, 1),
          lte: new Date(year, month, 0),
        },
      },
    });

    const byStatus: Record<string, number> = { PRESENT: 0, ABSENT: 0, HALF_DAY: 0, LEAVE: 0 };
    for (const r of records) {
      if (r.status in byStatus) byStatus[r.status]++;
    }

    return {
      staffId,
      year,
      month,
      totalRecords: records.length,
      byStatus,
    };
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private async resolveStatus(staffId: string, date: Date, requested: string): Promise<string> {
    if (requested === 'LEAVE') return 'LEAVE';

    const leave = await this.prisma.staffLeave.findFirst({
      where: {
        staffId,
        status: 'APPROVED',
        startDate: { lte: date },
        endDate: { gte: date },
      },
    });

    return leave ? 'LEAVE' : requested;
  }

  private parseTime(timeStr: string): Date {
    const [h, m] = timeStr.split(':').map(Number);
    const d = new Date(1970, 0, 1, h, m, 0);
    return d;
  }
}
