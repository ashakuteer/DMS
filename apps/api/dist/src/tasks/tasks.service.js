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
exports.TasksService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let TasksService = class TasksService {
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
    }
    resolveStatus(task) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (task.status === client_1.TaskStatus.PENDING && new Date(task.dueDate) < today) {
            return { ...task, status: client_1.TaskStatus.OVERDUE };
        }
        return task;
    }
    async create(dto) {
        return this.prisma.task.create({
            data: {
                title: dto.title,
                description: dto.description,
                type: dto.type,
                priority: dto.priority ?? client_1.TaskPriority.MEDIUM,
                dueDate: new Date(dto.dueDate),
                donorId: dto.donorId,
                beneficiaryId: dto.beneficiaryId,
                assignedTo: dto.assignedTo,
            },
            include: this.includeRelations,
        });
    }
    async findAll(query) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const where = {};
        if (query.status) {
            if (query.status === 'OVERDUE') {
                where.status = client_1.TaskStatus.PENDING;
                where.dueDate = { lt: today };
            }
            else {
                where.status = query.status;
            }
        }
        if (query.type) {
            where.type = query.type;
        }
        if (query.dueDate === 'today') {
            where.dueDate = { gte: today, lt: tomorrow };
        }
        else if (query.dueDate === 'overdue') {
            where.status = client_1.TaskStatus.PENDING;
            where.dueDate = { lt: today };
        }
        const tasks = await this.prisma.task.findMany({
            where,
            include: this.includeRelations,
            orderBy: [{ dueDate: 'asc' }, { priority: 'desc' }],
        });
        return tasks.map((t) => this.resolveStatus(t));
    }
    async findOne(id) {
        const task = await this.prisma.task.findUnique({
            where: { id },
            include: this.includeRelations,
        });
        if (!task)
            throw new common_1.NotFoundException('Task not found');
        return this.resolveStatus(task);
    }
    async updateStatus(id, status) {
        await this.findOne(id);
        const data = { status };
        if (status === client_1.TaskStatus.COMPLETED) {
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
                role: { in: [client_1.Role.STAFF, client_1.Role.ADMIN, client_1.Role.FOUNDER] },
            },
            select: { id: true, name: true, role: true },
            orderBy: { name: 'asc' },
        });
    }
    async updateTask(id, dto) {
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
                    status: client_1.TaskStatus.PENDING,
                    dueDate: { lt: today },
                },
                include: this.includeRelations,
                orderBy: [{ dueDate: 'asc' }],
            }),
        ]);
        const dueToday = dueTodayRaw.map((t) => this.resolveStatus(t));
        const overdue = overdueRaw.map((t) => ({ ...t, status: client_1.TaskStatus.OVERDUE }));
        return {
            dueToday,
            overdue,
            total: dueToday.length + overdue.length,
        };
    }
};
exports.TasksService = TasksService;
exports.TasksService = TasksService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TasksService);
//# sourceMappingURL=tasks.service.js.map