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
const DONOR_TYPES = [
    client_1.TaskType.BIRTHDAY,
    client_1.TaskType.ANNIVERSARY,
    client_1.TaskType.REMEMBRANCE,
    client_1.TaskType.FOLLOW_UP,
    client_1.TaskType.PLEDGE,
    client_1.TaskType.SMART_REMINDER,
    client_1.TaskType.SPONSOR_UPDATE,
    client_1.TaskType.REMINDER,
];
const STAFF_TYPES = [
    client_1.TaskType.GENERAL,
    client_1.TaskType.INTERNAL,
    client_1.TaskType.MANUAL,
];
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
                    whatsappPhone: true,
                    prefWhatsapp: true,
                    assignedToUser: {
                        select: { id: true, name: true, email: true },
                    },
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
            sourceOccasion: {
                select: { id: true, type: true, relatedPersonName: true, month: true, day: true },
            },
            sourceSponsorship: {
                select: {
                    id: true,
                    sponsorshipType: true,
                    beneficiary: { select: { id: true, fullName: true } },
                },
            },
            sourcePledge: {
                select: { id: true, pledgeType: true, amount: true, expectedFulfillmentDate: true },
            },
        };
    }
    resolveStatus(task) {
        if (!task)
            return task;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (task.status === client_1.TaskStatus.PENDING && task.dueDate && new Date(task.dueDate) < today) {
            return { ...task, status: client_1.TaskStatus.OVERDUE };
        }
        return task;
    }
    safeMapTask(task) {
        if (!task)
            return null;
        return {
            id: task.id ?? null,
            title: task.title ?? '',
            description: task.description ?? null,
            type: task.type ?? null,
            status: task.status ?? null,
            priority: task.priority ?? null,
            dueDate: task.dueDate ?? null,
            completedAt: task.completedAt ?? null,
            donorId: task.donorId ?? null,
            beneficiaryId: task.beneficiaryId ?? null,
            assignedTo: task.assignedTo ?? null,
            autoWhatsAppPossible: task.autoWhatsAppPossible ?? false,
            manualRequired: task.manualRequired ?? true,
            contactCount: task.contactCount ?? 0,
            lastContactedAt: task.lastContactedAt ?? null,
            createdAt: task.createdAt ?? null,
            updatedAt: task.updatedAt ?? null,
            donor: task.donor ?? null,
            beneficiary: task.beneficiary ?? null,
            assignedUser: task.assignedUser ?? null,
            sourceOccasion: task.sourceOccasion ?? null,
            sourceSponsorship: task.sourceSponsorship ?? null,
            sourcePledge: task.sourcePledge ?? null,
        };
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
                autoWhatsAppPossible: dto.autoWhatsAppPossible ?? false,
                manualRequired: dto.manualRequired ?? true,
                sourceOccasionId: dto.sourceOccasionId,
                sourceSponsorshipId: dto.sourceSponsorshipId,
                sourcePledgeId: dto.sourcePledgeId,
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
        if (query.category === 'donor') {
            where.type = { in: DONOR_TYPES };
        }
        else if (query.category === 'staff') {
            where.type = { in: STAFF_TYPES };
        }
        else if (query.type) {
            where.type = query.type;
        }
        if (query.priority) {
            where.priority = query.priority;
        }
        if (query.assignedTo) {
            where.assignedTo = query.assignedTo;
        }
        if (query.donorId) {
            where.donorId = query.donorId;
        }
        if (query.timeWindow) {
            switch (query.timeWindow) {
                case 'today':
                    where.status = client_1.TaskStatus.PENDING;
                    where.dueDate = { gte: today, lt: tomorrow };
                    break;
                case '7days': {
                    const end7 = new Date(today);
                    end7.setDate(end7.getDate() + 8);
                    where.status = client_1.TaskStatus.PENDING;
                    where.dueDate = { gte: today, lt: end7 };
                    break;
                }
                case '15days': {
                    const end15 = new Date(today);
                    end15.setDate(end15.getDate() + 16);
                    where.status = client_1.TaskStatus.PENDING;
                    where.dueDate = { gte: today, lt: end15 };
                    break;
                }
                case '30days': {
                    const end30 = new Date(today);
                    end30.setDate(end30.getDate() + 31);
                    where.status = client_1.TaskStatus.PENDING;
                    where.dueDate = { gte: today, lt: end30 };
                    break;
                }
                case 'overdue':
                    where.status = client_1.TaskStatus.PENDING;
                    where.dueDate = { lt: today };
                    break;
            }
        }
        else if (query.dueDate === 'today') {
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
    async updateTask(id, dto) {
        await this.findOne(id);
        const data = {};
        if (dto.title !== undefined)
            data.title = dto.title;
        if (dto.description !== undefined)
            data.description = dto.description;
        if (dto.type !== undefined)
            data.type = dto.type;
        if (dto.priority !== undefined)
            data.priority = dto.priority;
        if (dto.dueDate !== undefined)
            data.dueDate = new Date(dto.dueDate);
        if (dto.assignedTo !== undefined)
            data.assignedTo = dto.assignedTo;
        if (dto.status !== undefined) {
            data.status = dto.status;
            if (dto.status === client_1.TaskStatus.COMPLETED)
                data.completedAt = new Date();
        }
        const updated = await this.prisma.task.update({
            where: { id },
            data,
            include: this.includeRelations,
        });
        return this.resolveStatus(updated);
    }
    async deleteTask(id) {
        await this.findOne(id);
        return this.prisma.task.delete({ where: { id } });
    }
    async logContact(taskId, dto, userId) {
        const task = await this.prisma.task.findUnique({
            where: { id: taskId },
            select: { id: true, donorId: true, contactCount: true },
        });
        if (!task)
            throw new common_1.NotFoundException('Task not found');
        const now = new Date();
        const channel = dto.contactMethod === 'EMAIL'
            ? client_1.CommunicationChannel.EMAIL
            : client_1.CommunicationChannel.WHATSAPP;
        const logEntry = await this.prisma.communicationLog.create({
            data: {
                donorId: task.donorId ?? '',
                taskId: taskId,
                channel,
                type: client_1.CommunicationType.FOLLOW_UP,
                status: client_1.CommunicationStatus.SENT,
                contactMethod: dto.contactMethod,
                outcome: dto.outcome,
                messagePreview: dto.notes,
                sentById: userId,
            },
        });
        await this.prisma.task.update({
            where: { id: taskId },
            data: {
                contactCount: { increment: 1 },
                lastContactedAt: now,
            },
        });
        return logEntry;
    }
    async getContactLogs(taskId) {
        const task = await this.prisma.task.findUnique({
            where: { id: taskId },
            select: { id: true },
        });
        if (!task)
            throw new common_1.NotFoundException('Task not found');
        return this.prisma.communicationLog.findMany({
            where: { taskId },
            include: {
                sentBy: { select: { id: true, name: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
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
                        status: client_1.TaskStatus.PENDING,
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
                .map((t) => this.safeMapTask({ ...t, status: client_1.TaskStatus.OVERDUE }));
            return {
                dueToday,
                overdue,
                total: dueToday.length + overdue.length,
            };
        }
        catch (error) {
            console.error('[TasksService] getToday() error:', error?.message ?? error);
            return { dueToday: [], overdue: [], total: 0 };
        }
    }
};
exports.TasksService = TasksService;
exports.TasksService = TasksService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TasksService);
//# sourceMappingURL=tasks.service.js.map