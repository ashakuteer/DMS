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
exports.TaskTemplatesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
const EXCLUDED_FROM_STAFF = [client_1.Role.FOUNDER];
const ITEM_SELECT = { id: true, itemText: true, orderIndex: true };
const RECURRENCE_DAYS = {
    DAILY: 1,
    WEEKLY: 7,
    MONTHLY: 30,
    QUARTERLY: 90,
    HALF_YEARLY: 180,
    ANNUAL: 365,
};
let TaskTemplatesService = class TaskTemplatesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(includeInactive = false) {
        return this.prisma.taskTemplate.findMany({
            where: includeInactive ? {} : { isActive: true },
            include: {
                tasks: { where: { deletedAt: null }, select: { id: true, status: true, createdAt: true } },
                items: { orderBy: { orderIndex: 'asc' }, select: { id: true, itemText: true, orderIndex: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findOne(id) {
        const t = await this.prisma.taskTemplate.findUnique({
            where: { id },
            include: {
                tasks: {
                    where: { deletedAt: null },
                    select: { id: true, status: true, createdAt: true, assignedTo: { select: { id: true, name: true } } },
                    orderBy: { createdAt: 'desc' },
                    take: 20,
                },
                items: { orderBy: { orderIndex: 'asc' }, select: ITEM_SELECT },
            },
        });
        if (!t)
            throw new common_1.NotFoundException('Task template not found');
        return t;
    }
    async create(data, createdById) {
        return this.prisma.taskTemplate.create({
            data: {
                title: data.title,
                description: data.description ?? null,
                recurrenceType: data.recurrenceType || 'DAILY',
                recurrenceRule: data.recurrenceRule ?? null,
                category: data.category || 'GENERAL',
                priority: data.priority || 'MEDIUM',
                assignedToRole: data.assignedToRole ?? null,
                assignedToId: data.assignedToId ?? null,
                estimatedMinutes: data.estimatedMinutes ?? null,
                instructions: data.instructions ?? null,
                startDate: data.startDate ? new Date(data.startDate) : null,
                reminderBefore: data.reminderBefore ?? null,
                createdById,
            },
        });
    }
    async update(id, data) {
        await this.findOne(id);
        const updateData = { ...data };
        if (data.startDate !== undefined)
            updateData.startDate = data.startDate ? new Date(data.startDate) : null;
        if (data.nextDueDate !== undefined)
            updateData.nextDueDate = data.nextDueDate ? new Date(data.nextDueDate) : null;
        return this.prisma.taskTemplate.update({ where: { id }, data: updateData });
    }
    async delete(id) {
        await this.findOne(id);
        return this.prisma.taskTemplate.delete({ where: { id } });
    }
    async addItem(templateId, itemText, orderIndex) {
        await this.findOne(templateId);
        const maxOrder = await this.prisma.taskTemplateItem.findMany({
            where: { templateId },
            orderBy: { orderIndex: 'desc' },
            take: 1,
            select: { orderIndex: true },
        });
        const nextOrder = orderIndex ?? ((maxOrder[0]?.orderIndex ?? -1) + 1);
        return this.prisma.taskTemplateItem.create({
            data: { templateId, itemText, orderIndex: nextOrder },
        });
    }
    async updateItem(itemId, data) {
        const item = await this.prisma.taskTemplateItem.findUnique({ where: { id: itemId } });
        if (!item)
            throw new common_1.NotFoundException('Item not found');
        return this.prisma.taskTemplateItem.update({ where: { id: itemId }, data });
    }
    async deleteItem(itemId) {
        const item = await this.prisma.taskTemplateItem.findUnique({ where: { id: itemId } });
        if (!item)
            throw new common_1.NotFoundException('Item not found');
        return this.prisma.taskTemplateItem.delete({ where: { id: itemId } });
    }
    async generateTasks(templateId, options) {
        const template = await this.findOne(templateId);
        const dueDate = options.forDate ? new Date(options.forDate) : new Date();
        dueDate.setDate(dueDate.getDate() + (RECURRENCE_DAYS[template.recurrenceType] || 1));
        let userIds = [];
        if (options.targetUserIds && options.targetUserIds.length > 0) {
            userIds = options.targetUserIds;
        }
        else if (template.assignedToId) {
            userIds = [template.assignedToId];
        }
        else if (template.assignedToRole) {
            const users = await this.prisma.user.findMany({
                where: { isActive: true, role: template.assignedToRole, NOT: { role: { in: EXCLUDED_FROM_STAFF } } },
                select: { id: true },
            });
            userIds = users.map((u) => u.id);
        }
        else {
            const users = await this.prisma.user.findMany({
                where: { isActive: true, NOT: { role: { in: EXCLUDED_FROM_STAFF } } },
                select: { id: true },
            });
            userIds = users.map((u) => u.id);
        }
        if (userIds.length === 0) {
            return { generated: 0, message: 'No matching users found' };
        }
        const created = [];
        for (const userId of userIds) {
            const existing = await this.prisma.staffTask.findFirst({
                where: {
                    templateId,
                    assignedToId: userId,
                    dueDate: { gte: new Date(new Date(dueDate).setHours(0, 0, 0, 0)), lte: new Date(new Date(dueDate).setHours(23, 59, 59, 999)) },
                    deletedAt: null,
                },
            });
            if (existing)
                continue;
            const checklist = template.items?.length > 0
                ? template.items.map((item) => ({ id: item.id, text: item.itemText, done: false }))
                : null;
            const task = await this.prisma.staffTask.create({
                data: {
                    title: template.title,
                    description: template.description ?? null,
                    instructions: template.instructions ?? null,
                    estimatedMinutes: template.estimatedMinutes ?? null,
                    status: client_1.TaskStatus.PENDING,
                    priority: template.priority,
                    category: template.category,
                    taskType: 'RECURRING_INSTANCE',
                    assignedToId: userId,
                    createdById: options.createdById,
                    dueDate,
                    isRecurring: false,
                    isRecurringInstance: true,
                    recurrenceType: template.recurrenceType,
                    templateId,
                    checklist,
                },
                select: { id: true },
            });
            created.push(task.id);
        }
        return { generated: created.length, total: userIds.length, taskIds: created };
    }
    shouldGenerateToday(template, date) {
        const rule = (template.recurrenceRule || {});
        const day = date.getDay();
        const d = date.getDate();
        const m = date.getMonth();
        if (template.recurrenceType === 'CUSTOM_INTERVAL') {
            if (!template.nextDueDate)
                return false;
            const due = new Date(template.nextDueDate);
            return date >= new Date(due.getFullYear(), due.getMonth(), due.getDate());
        }
        switch (template.recurrenceType) {
            case 'DAILY': return true;
            case 'WEEKLY': {
                const days = rule.daysOfWeek;
                if (days && days.length > 0) {
                    const names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                    return days.includes(names[day]);
                }
                return day === 1;
            }
            case 'MONTHLY': {
                if (rule.dayOfMonth)
                    return d === rule.dayOfMonth;
                return d === 1;
            }
            case 'QUARTERLY': return d === 1 && [0, 3, 6, 9].includes(m);
            case 'HALF_YEARLY': return d === 1 && [0, 6].includes(m);
            case 'ANNUAL': {
                if (rule.month && rule.dayOfMonth)
                    return m === (rule.month - 1) && d === rule.dayOfMonth;
                return d === 1 && m === 0;
            }
            default: return false;
        }
    }
    computeNextDueDate(template, fromDate) {
        const rule = (template.recurrenceRule || {});
        const next = new Date(fromDate);
        switch (template.recurrenceType) {
            case 'DAILY':
                next.setDate(next.getDate() + 1);
                break;
            case 'CUSTOM_INTERVAL': {
                const interval = rule.intervalDays ?? 7;
                next.setDate(next.getDate() + interval);
                break;
            }
            case 'WEEKLY': {
                const days = (rule.daysOfWeek || ['Mon']);
                const dayMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
                const nums = days.map((d) => dayMap[d]).filter((n) => n !== undefined).sort((a, b) => a - b);
                if (nums.length === 0) {
                    next.setDate(next.getDate() + 7);
                    break;
                }
                const cur = next.getDay();
                const nxt = nums.find((n) => n > cur);
                next.setDate(next.getDate() + (nxt !== undefined ? nxt - cur : 7 - cur + nums[0]));
                break;
            }
            case 'MONTHLY':
                next.setMonth(next.getMonth() + 1, rule.dayOfMonth ?? 1);
                break;
            case 'QUARTERLY':
                next.setMonth(next.getMonth() + 3, 1);
                break;
            case 'HALF_YEARLY':
                next.setMonth(next.getMonth() + 6, 1);
                break;
            case 'ANNUAL': {
                const mon = (rule.month ?? 1) - 1;
                next.setFullYear(next.getFullYear() + 1, mon, rule.dayOfMonth ?? 1);
                break;
            }
            default:
                next.setDate(next.getDate() + 1);
        }
        return next;
    }
    async generateTodayForAll(createdById) {
        const today = new Date();
        const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
        const templates = await this.prisma.taskTemplate.findMany({
            where: { isActive: true },
            include: { items: { orderBy: { orderIndex: 'asc' }, select: ITEM_SELECT } },
        });
        let generated = 0;
        let skipped = 0;
        for (const template of templates) {
            if (!this.shouldGenerateToday(template, today)) {
                skipped++;
                continue;
            }
            let userIds = [];
            if (template.assignedToId) {
                userIds = [template.assignedToId];
            }
            else if (template.assignedToRole) {
                const users = await this.prisma.user.findMany({
                    where: { isActive: true, role: template.assignedToRole, NOT: { role: { in: EXCLUDED_FROM_STAFF } } },
                    select: { id: true },
                });
                userIds = users.map((u) => u.id);
            }
            else {
                const users = await this.prisma.user.findMany({
                    where: { isActive: true, NOT: { role: { in: EXCLUDED_FROM_STAFF } } },
                    select: { id: true },
                });
                userIds = users.map((u) => u.id);
            }
            let thisTemplateGenerated = 0;
            for (const userId of userIds) {
                const existing = await this.prisma.staffTask.findFirst({
                    where: {
                        templateId: template.id,
                        assignedToId: userId,
                        dueDate: { gte: startOfToday, lte: endOfToday },
                        deletedAt: null,
                    },
                });
                if (existing)
                    continue;
                const checklist = template.items?.length > 0
                    ? template.items.map((item) => ({ id: item.id, text: item.itemText, done: false }))
                    : null;
                await this.prisma.staffTask.create({
                    data: {
                        title: template.title,
                        description: template.description ?? null,
                        instructions: template.instructions ?? null,
                        estimatedMinutes: template.estimatedMinutes ?? null,
                        status: client_1.TaskStatus.PENDING,
                        priority: template.priority,
                        category: template.category,
                        taskType: 'RECURRING_INSTANCE',
                        assignedToId: userId,
                        createdById,
                        dueDate: startOfToday,
                        isRecurring: false,
                        isRecurringInstance: true,
                        recurrenceType: template.recurrenceType,
                        templateId: template.id,
                        checklist,
                    },
                });
                generated++;
                thisTemplateGenerated++;
            }
            if (thisTemplateGenerated > 0) {
                const nextDue = this.computeNextDueDate(template, today);
                await this.prisma.taskTemplate.update({
                    where: { id: template.id },
                    data: { nextDueDate: nextDue },
                });
            }
        }
        return { generated, skipped, templates: templates.length };
    }
    async markOverdueMissed() {
        const now = new Date();
        const result = await this.prisma.staffTask.updateMany({
            where: {
                deletedAt: null,
                status: { in: [client_1.TaskStatus.PENDING, client_1.TaskStatus.IN_PROGRESS, client_1.TaskStatus.OVERDUE] },
                dueDate: { lt: now },
            },
            data: { status: client_1.TaskStatus.MISSED },
        });
        return { marked: result.count };
    }
    async getPerformanceAll(days = 30) {
        const since = new Date();
        since.setDate(since.getDate() - days);
        const users = await this.prisma.user.findMany({
            where: { isActive: true, NOT: { role: { in: EXCLUDED_FROM_STAFF } } },
            select: { id: true, name: true, email: true, role: true },
            orderBy: { name: 'asc' },
        });
        const results = await Promise.all(users.map(async (user) => {
            const baseWhere = { assignedToId: user.id, deletedAt: null, createdAt: { gte: since } };
            const [total, completed, missed, onTimeRows, timeRows] = await Promise.all([
                this.prisma.staffTask.count({ where: baseWhere }),
                this.prisma.staffTask.count({ where: { ...baseWhere, status: client_1.TaskStatus.COMPLETED } }),
                this.prisma.staffTask.count({ where: { ...baseWhere, status: client_1.TaskStatus.MISSED } }),
                this.prisma.staffTask.findMany({
                    where: { ...baseWhere, status: client_1.TaskStatus.COMPLETED, completedAt: { not: null }, dueDate: { not: null } },
                    select: { completedAt: true, dueDate: true },
                }),
                this.prisma.staffTask.findMany({
                    where: { ...baseWhere, status: client_1.TaskStatus.COMPLETED, minutesTaken: { not: null } },
                    select: { minutesTaken: true },
                }),
            ]);
            const completionRate = total > 0 ? completed / total : 0;
            const onTimeCount = onTimeRows.filter((t) => t.completedAt <= t.dueDate).length;
            const avgMinutes = timeRows.length > 0
                ? timeRows.reduce((s, t) => s + (t.minutesTaken || 0), 0) / timeRows.length
                : null;
            const efficiencyScore = avgMinutes !== null && avgMinutes <= 60 ? 5 : 0;
            const rawScore = (completed * 10) - (missed * 15) + (completionRate * 10) + efficiencyScore;
            const score = Math.max(0, Math.min(100, Math.round(rawScore)));
            const statusLevel = score >= 90 ? 'Excellent' :
                score >= 70 ? 'Good' :
                    score >= 50 ? 'Warning' :
                        'Critical';
            let insight = '';
            if (missed > 5) {
                insight = 'Needs improvement – missing tasks frequently';
            }
            else if (completionRate > 0.9 && total > 0) {
                insight = 'Excellent and consistent performer';
            }
            else if (completionRate < 0.6 && total > 0) {
                insight = 'High risk – low task completion';
            }
            return {
                userId: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                total,
                completed,
                missed,
                onTime: onTimeCount,
                completionRate: Math.round(completionRate * 100),
                efficiencyScore,
                avgMinutesTaken: avgMinutes !== null ? Math.round(avgMinutes) : null,
                score,
                statusLevel,
                insight,
            };
        }));
        const sorted = results.sort((a, b) => b.score - a.score);
        return sorted.map((r, i) => ({ ...r, rank: i + 1, isTopPerformer: i === 0 && r.total > 0 }));
    }
    async getAccountabilityScore(userId, days = 30) {
        const since = new Date();
        since.setDate(since.getDate() - days);
        const [assigned, completed, missed, onTime, withTime] = await Promise.all([
            this.prisma.staffTask.count({
                where: { assignedToId: userId, deletedAt: null, createdAt: { gte: since } },
            }),
            this.prisma.staffTask.count({
                where: { assignedToId: userId, deletedAt: null, status: client_1.TaskStatus.COMPLETED, createdAt: { gte: since } },
            }),
            this.prisma.staffTask.count({
                where: { assignedToId: userId, deletedAt: null, status: client_1.TaskStatus.MISSED, createdAt: { gte: since } },
            }),
            this.prisma.staffTask.findMany({
                where: { assignedToId: userId, deletedAt: null, status: client_1.TaskStatus.COMPLETED, completedAt: { not: null }, dueDate: { not: null }, createdAt: { gte: since } },
                select: { completedAt: true, dueDate: true, minutesTaken: true },
            }),
            this.prisma.staffTask.findMany({
                where: { assignedToId: userId, deletedAt: null, status: client_1.TaskStatus.COMPLETED, minutesTaken: { not: null }, createdAt: { gte: since } },
                select: { minutesTaken: true },
            }),
        ]);
        const onTimeCount = onTime.filter((t) => t.completedAt <= t.dueDate).length;
        const avgMinutes = withTime.length > 0 ? withTime.reduce((s, t) => s + (t.minutesTaken || 0), 0) / withTime.length : null;
        let score = 0;
        if (assigned > 0) {
            score += (completed / assigned) * 60;
            score += (1 - missed / assigned) * 15;
        }
        if (completed > 0) {
            score += (onTimeCount / completed) * 25;
        }
        score = Math.max(0, Math.min(100, Math.round(score)));
        return {
            userId,
            days,
            assigned,
            completed,
            missed,
            onTime: onTimeCount,
            score,
            grade: score >= 90 ? 'A' : score >= 75 ? 'B' : score >= 60 ? 'C' : score >= 40 ? 'D' : 'F',
            avgMinutesTaken: avgMinutes !== null ? Math.round(avgMinutes) : null,
        };
    }
};
exports.TaskTemplatesService = TaskTemplatesService;
exports.TaskTemplatesService = TaskTemplatesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TaskTemplatesService);
//# sourceMappingURL=task-templates.service.js.map