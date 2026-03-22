"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StaffAttendanceService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let StaffAttendanceService = class StaffAttendanceService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(params) {
        const where = {};
        if (params.staffId)
            where.staffId = params.staffId;
        if (params.homeId) {
            where.staff = { homeId: params.homeId };
        }
        if (params.date) {
            where.date = new Date(params.date);
        }
        else if (params.month && params.year) {
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
    async getTodaySummary(homeId) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const where = { date: today };
        if (homeId)
            where.staff = { homeId };
        const records = await this.prisma.staffAttendance.findMany({
            where,
            select: { status: true },
        });
        const summary = { PRESENT: 0, ABSENT: 0, HALF_DAY: 0, LEAVE: 0, total: records.length };
        for (const r of records) {
            if (r.status in summary)
                summary[r.status]++;
        }
        return { date: today.toISOString().split('T')[0], ...summary };
    }
    async create(data) {
        const staff = await this.prisma.staff.findUnique({ where: { id: data.staffId } });
        if (!staff)
            throw new common_1.NotFoundException('Staff member not found');
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
        }
        catch (e) {
            if (e?.code === 'P2002') {
                throw new common_1.ConflictException(`Attendance already recorded for this staff on ${data.date}`);
            }
            throw e;
        }
    }
    async bulkCreate(date, entries) {
        const dateObj = new Date(date);
        const results = { created: 0, skipped: 0, errors: [] };
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
            }
            catch (e) {
                results.skipped++;
                results.errors.push(`${entry.staffId}: ${e.message}`);
            }
        }
        return results;
    }
    async update(id, data) {
        const record = await this.prisma.staffAttendance.findUnique({ where: { id } });
        if (!record)
            throw new common_1.NotFoundException('Attendance record not found');
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
    async delete(id) {
        const record = await this.prisma.staffAttendance.findUnique({ where: { id } });
        if (!record)
            throw new common_1.NotFoundException('Attendance record not found');
        return this.prisma.staffAttendance.delete({ where: { id } });
    }
    async getMonthlySummary(staffId, year, month) {
        const staff = await this.prisma.staff.findUnique({ where: { id: staffId } });
        if (!staff)
            throw new common_1.NotFoundException('Staff not found');
        const records = await this.prisma.staffAttendance.findMany({
            where: {
                staffId,
                date: {
                    gte: new Date(year, month - 1, 1),
                    lte: new Date(year, month, 0),
                },
            },
        });
        const byStatus = { PRESENT: 0, ABSENT: 0, HALF_DAY: 0, LEAVE: 0 };
        for (const r of records) {
            if (r.status in byStatus)
                byStatus[r.status]++;
        }
        return {
            staffId,
            year,
            month,
            totalRecords: records.length,
            byStatus,
        };
    }
    async resolveStatus(staffId, date, requested) {
        if (requested === 'LEAVE')
            return 'LEAVE';
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
    parseTime(timeStr) {
        const [h, m] = timeStr.split(':').map(Number);
        const d = new Date(1970, 0, 1, h, m, 0);
        return d;
    }
};
exports.StaffAttendanceService = StaffAttendanceService;
exports.StaffAttendanceService = StaffAttendanceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], StaffAttendanceService);
//# sourceMappingURL=staff-attendance.service.js.map