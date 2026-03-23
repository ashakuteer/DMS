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
var StaffTasksService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.StaffTasksService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let StaffTasksService = StaffTasksService_1 = class StaffTasksService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(StaffTasksService_1.name);
        this.includeRelations = {
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
    }
    async findAll(query) {
        const { status, priority, assignedToId, category, search } = query;
        const page = query.page || 1;
        const limit = query.limit || 50;
        const where = { deletedAt: null };
        if (status)
            where.status = status;
        if (priority)
            where.priority = priority;
        if (assignedToId)
            where.assignedToId = assignedToId;
        if (category)
            where.category = category;
        if (query.isRecurring !== undefined)
            where.isRecurring = query.isRecurring;
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
    async findOne(id) {
        const item = await this.prisma.staffTask.findUnique({
            where: { id },
            include: this.includeRelations,
        });
        if (!item || item.deletedAt) {
            throw new common_1.NotFoundException('Task not found');
        }
        return item;
    }
    async create(data, userId) {
        const createData = {
            title: data.title,
            description: data.description,
            status: data.status || client_1.TaskStatus.PENDING,
            priority: data.priority || client_1.TaskPriority.MEDIUM,
            category: data.category || client_1.TaskCategory.GENERAL,
            assignedToId: data.assignedToId,
            createdById: userId,
            linkedDonorId: data.linkedDonorId || null,
            notes: data.notes,
        };
        if (data.dueDate)
            createData.dueDate = new Date(data.dueDate);
        if (createData.status === client_1.TaskStatus.IN_PROGRESS)
            createData.startedAt = new Date();
        if (createData.status === client_1.TaskStatus.COMPLETED) {
            createData.startedAt = new Date();
            createData.completedAt = new Date();
        }
        return this.prisma.staffTask.create({
            data: createData,
            include: this.includeRelations,
        });
    }
    async update(id, data, userId) {
        const existing = await this.findOne(id);
        const updateData = {};
        if (data.title !== undefined)
            updateData.title = data.title;
        if (data.description !== undefined)
            updateData.description = data.description;
        if (data.priority !== undefined)
            updateData.priority = data.priority;
        if (data.category !== undefined)
            updateData.category = data.category;
        if (data.assignedToId !== undefined)
            updateData.assignedToId = data.assignedToId;
        if (data.linkedDonorId !== undefined)
            updateData.linkedDonorId = data.linkedDonorId || null;
        if (data.dueDate !== undefined)
            updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;
        if (data.notes !== undefined)
            updateData.notes = data.notes;
        if (data.status !== undefined && data.status !== existing.status) {
            updateData.status = data.status;
            if (data.status === client_1.TaskStatus.IN_PROGRESS && !existing.startedAt) {
                updateData.startedAt = new Date();
            }
            if (data.status === client_1.TaskStatus.COMPLETED) {
                if (!existing.startedAt)
                    updateData.startedAt = new Date();
                updateData.completedAt = new Date();
            }
        }
        if (data.checklist !== undefined)
            updateData.checklist = data.checklist;
        if (data.minutesTaken !== undefined)
            updateData.minutesTaken = data.minutesTaken || null;
        if (data.isRecurring !== undefined)
            updateData.isRecurring = data.isRecurring;
        if (data.recurrenceType !== undefined)
            updateData.recurrenceType = data.recurrenceType;
        return this.prisma.staffTask.update({
            where: { id },
            data: updateData,
            include: this.includeRelations,
        });
    }
    async delete(id) {
        await this.findOne(id);
        return this.prisma.staffTask.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
    }
    async getStats(userId) {
        const where = { deletedAt: null };
        if (userId)
            where.assignedToId = userId;
        const now = new Date();
        const [pending, inProgress, completed, overdue] = await Promise.all([
            this.prisma.staffTask.count({ where: { ...where, status: client_1.TaskStatus.PENDING } }),
            this.prisma.staffTask.count({ where: { ...where, status: client_1.TaskStatus.IN_PROGRESS } }),
            this.prisma.staffTask.count({ where: { ...where, status: client_1.TaskStatus.COMPLETED } }),
            this.prisma.staffTask.count({
                where: {
                    ...where,
                    status: { in: [client_1.TaskStatus.PENDING, client_1.TaskStatus.IN_PROGRESS, client_1.TaskStatus.OVERDUE] },
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
        const staffList = await Promise.all(users.map(async (user) => {
            const baseWhere = { assignedToId: user.id, deletedAt: null };
            const [assigned, completed, overdue, latestPerformance] = await Promise.all([
                this.prisma.staffTask.count({ where: baseWhere }),
                this.prisma.staffTask.count({ where: { ...baseWhere, status: client_1.TaskStatus.COMPLETED } }),
                this.prisma.staffTask.count({
                    where: {
                        ...baseWhere,
                        status: { in: [client_1.TaskStatus.PENDING, client_1.TaskStatus.IN_PROGRESS, client_1.TaskStatus.OVERDUE] },
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
        }));
        return staffList;
    }
    async getStaffPerformance(userId, year) {
        const where = { userId };
        if (year)
            where.year = year;
        return this.prisma.staffPerformance.findMany({
            where,
            orderBy: [{ year: 'desc' }, { month: 'desc' }],
        });
    }
    async calculatePerformance(userId, month, year) {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 1);
        const baseWhere = {
            assignedToId: userId,
            deletedAt: null,
            createdAt: { gte: startDate, lt: endDate },
        };
        const [tasksAssigned, tasksCompleted, tasksOnTime, tasksOverdue, followUpsDone, donorResponses] = await Promise.all([
            this.prisma.staffTask.count({ where: baseWhere }),
            this.prisma.staffTask.count({
                where: { ...baseWhere, status: client_1.TaskStatus.COMPLETED },
            }),
            this.prisma.staffTask.count({
                where: {
                    ...baseWhere,
                    status: client_1.TaskStatus.COMPLETED,
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
                        status: client_1.TaskStatus.COMPLETED,
                        completedAt: { not: null },
                        dueDate: { not: null },
                    },
                    select: { completedAt: true, dueDate: true },
                });
                return onTimeTasks.filter((t) => t.completedAt <= t.dueDate).length;
            }),
            this.prisma.staffTask.count({
                where: {
                    assignedToId: userId,
                    deletedAt: null,
                    createdAt: { gte: startDate, lt: endDate },
                    status: { in: [client_1.TaskStatus.PENDING, client_1.TaskStatus.IN_PROGRESS, client_1.TaskStatus.OVERDUE] },
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
    async getKanbanBoard(assignedToId) {
        const where = { deletedAt: null };
        if (assignedToId)
            where.assignedToId = assignedToId;
        const tasks = await this.prisma.staffTask.findMany({
            where,
            include: this.includeRelations,
            orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
        });
        return {
            PENDING: tasks.filter((t) => t.status === client_1.TaskStatus.PENDING),
            IN_PROGRESS: tasks.filter((t) => t.status === client_1.TaskStatus.IN_PROGRESS),
            COMPLETED: tasks.filter((t) => t.status === client_1.TaskStatus.COMPLETED),
            OVERDUE: tasks.filter((t) => t.status === client_1.TaskStatus.OVERDUE),
        };
    }
    async updateTaskStatus(id, newStatus, userId, extra) {
        const existing = await this.findOne(id);
        const updateData = { status: newStatus };
        if (extra?.notes !== undefined)
            updateData.notes = extra.notes;
        if (newStatus === client_1.TaskStatus.IN_PROGRESS && !existing.startedAt) {
            updateData.startedAt = extra?.startedAt ? new Date(extra.startedAt) : new Date();
        }
        if (newStatus === client_1.TaskStatus.COMPLETED) {
            if (!existing.startedAt)
                updateData.startedAt = extra?.startedAt ? new Date(extra.startedAt) : new Date();
            updateData.completedAt = extra?.completedAt ? new Date(extra.completedAt) : new Date();
            if (extra?.minutesTaken) {
                updateData.minutesTaken = extra.minutesTaken;
            }
            else if (updateData.startedAt && updateData.completedAt) {
                const mins = Math.round((updateData.completedAt.getTime() - updateData.startedAt.getTime()) / 60000);
                if (mins > 0)
                    updateData.minutesTaken = mins;
            }
            else if (existing.startedAt && updateData.completedAt) {
                const mins = Math.round((updateData.completedAt.getTime() - existing.startedAt.getTime()) / 60000);
                if (mins > 0)
                    updateData.minutesTaken = mins;
            }
        }
        return this.prisma.staffTask.update({
            where: { id },
            data: updateData,
            include: this.includeRelations,
        });
    }
};
exports.StaffTasksService = StaffTasksService;
exports.StaffTasksService = StaffTasksService = StaffTasksService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], StaffTasksService);
//# sourceMappingURL=staff-tasks.service.js.map