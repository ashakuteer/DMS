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
exports.StaffLeavesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let StaffLeavesService = class StaffLeavesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(params) {
        const where = {};
        if (params.staffId)
            where.staffId = params.staffId;
        if (params.status)
            where.status = params.status;
        if (params.type)
            where.type = params.type;
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
    async findByStaff(staffId, year) {
        const staff = await this.prisma.staff.findUnique({ where: { id: staffId } });
        if (!staff)
            throw new common_1.NotFoundException('Staff member not found');
        const where = { staffId };
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
    async create(data) {
        const staff = await this.prisma.staff.findUnique({ where: { id: data.staffId } });
        if (!staff)
            throw new common_1.NotFoundException('Staff member not found');
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
    async updateStatus(id, status, notes) {
        const leave = await this.prisma.staffLeave.findUnique({ where: { id } });
        if (!leave)
            throw new common_1.NotFoundException('Leave record not found');
        return this.prisma.staffLeave.update({
            where: { id },
            data: { status, notes: notes ?? null },
            include: {
                staff: { select: { id: true, name: true } },
            },
        });
    }
    async delete(id) {
        const leave = await this.prisma.staffLeave.findUnique({ where: { id } });
        if (!leave)
            throw new common_1.NotFoundException('Leave record not found');
        return this.prisma.staffLeave.delete({ where: { id } });
    }
    async getSummary(staffId, year) {
        const staff = await this.prisma.staff.findUnique({ where: { id: staffId } });
        if (!staff)
            throw new common_1.NotFoundException('Staff member not found');
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
        const summary = { CASUAL: 0, SICK: 0, EARNED: 0, UNPAID: 0 };
        for (const l of leaves) {
            if (summary[l.type] !== undefined)
                summary[l.type] += l.days;
            else
                summary[l.type] = l.days;
        }
        return { staffId, year, approved: leaves.length, totalDays: leaves.reduce((s, l) => s + l.days, 0), byType: summary };
    }
};
exports.StaffLeavesService = StaffLeavesService;
exports.StaffLeavesService = StaffLeavesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], StaffLeavesService);
//# sourceMappingURL=staff-leaves.service.js.map