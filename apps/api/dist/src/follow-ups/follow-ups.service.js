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
exports.FollowUpsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let FollowUpsService = class FollowUpsService {
    constructor(prisma) {
        this.prisma = prisma;
        this.includeRelations = {
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
    }
    async findAll(query) {
        const { status, assignedToId, donorId, priority, dueBefore, dueAfter, userId, userRole } = query;
        const page = query.page || 1;
        const limit = query.limit || 50;
        const where = { isDeleted: false };
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
        }
        else if (assignedToId) {
            where.assignedToId = assignedToId;
        }
        if (dueBefore || dueAfter) {
            where.dueDate = {};
            if (dueBefore)
                where.dueDate.lte = new Date(dueBefore);
            if (dueAfter)
                where.dueDate.gte = new Date(dueAfter);
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
    async findOne(id, userId, userRole) {
        const item = await this.prisma.followUpReminder.findUnique({
            where: { id },
            include: this.includeRelations,
        });
        if (!item || item.isDeleted) {
            throw new common_1.NotFoundException('Follow-up reminder not found');
        }
        if (userId && userRole && userRole !== 'ADMIN' && item.assignedToId !== userId) {
            throw new common_1.ForbiddenException('You can only view follow-ups assigned to you');
        }
        return item;
    }
    async create(data) {
        const donor = await this.prisma.donor.findUnique({ where: { id: data.donorId } });
        if (!donor || donor.isDeleted) {
            throw new common_1.NotFoundException('Donor not found');
        }
        return this.prisma.followUpReminder.create({
            data: {
                donorId: data.donorId,
                assignedToId: data.assignedToId,
                createdById: data.createdById,
                note: data.note,
                dueDate: new Date(data.dueDate),
                priority: data.priority || client_1.FollowUpPriority.NORMAL,
            },
            include: this.includeRelations,
        });
    }
    async update(id, data, userId, userRole) {
        const existing = await this.findOne(id);
        if (userRole !== 'ADMIN' && existing.assignedToId !== userId && existing.createdById !== userId) {
            throw new common_1.ForbiddenException('You can only edit your own follow-ups');
        }
        const updateData = {};
        if (data.note !== undefined)
            updateData.note = data.note;
        if (data.dueDate)
            updateData.dueDate = new Date(data.dueDate);
        if (data.priority)
            updateData.priority = data.priority;
        if (data.assignedToId)
            updateData.assignedToId = data.assignedToId;
        return this.prisma.followUpReminder.update({
            where: { id },
            data: updateData,
            include: this.includeRelations,
        });
    }
    async markComplete(id, completedNote, userId, userRole) {
        const existing = await this.findOne(id);
        if (userRole !== 'ADMIN' && existing.assignedToId !== userId) {
            throw new common_1.ForbiddenException('You can only complete follow-ups assigned to you');
        }
        return this.prisma.followUpReminder.update({
            where: { id },
            data: {
                status: client_1.FollowUpStatus.COMPLETED,
                completedAt: new Date(),
                completedNote,
            },
            include: this.includeRelations,
        });
    }
    async reopen(id, userId, userRole) {
        const existing = await this.findOne(id);
        if (userRole !== 'ADMIN' && existing.assignedToId !== userId) {
            throw new common_1.ForbiddenException('You can only reopen follow-ups assigned to you');
        }
        return this.prisma.followUpReminder.update({
            where: { id },
            data: {
                status: client_1.FollowUpStatus.PENDING,
                completedAt: null,
                completedNote: null,
            },
            include: this.includeRelations,
        });
    }
    async remove(id, userId, userRole) {
        const existing = await this.findOne(id);
        if (userRole !== 'ADMIN') {
            throw new common_1.ForbiddenException('Only admins can delete follow-ups');
        }
        return this.prisma.followUpReminder.update({
            where: { id },
            data: { isDeleted: true },
        });
    }
    async getDashboardStats(userId, userRole) {
        const where = { isDeleted: false };
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
};
exports.FollowUpsService = FollowUpsService;
exports.FollowUpsService = FollowUpsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], FollowUpsService);
//# sourceMappingURL=follow-ups.service.js.map