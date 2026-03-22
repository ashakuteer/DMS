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
var TaskSchedulerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskSchedulerService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let TaskSchedulerService = TaskSchedulerService_1 = class TaskSchedulerService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(TaskSchedulerService_1.name);
    }
    async runDailyTaskGeneration() {
        this.logger.log('Daily task generation started');
        const results = await Promise.allSettled([
            this.generateBirthdayTasks(),
            this.generatePledgeFollowUpTasks(),
            this.generateDonationFollowUpTasks(),
        ]);
        results.forEach((r, i) => {
            const names = ['birthday', 'pledge', 'donation'];
            if (r.status === 'rejected') {
                this.logger.error(`${names[i]} task generation failed: ${r.reason}`);
            }
        });
        this.logger.log('Daily task generation complete');
    }
    async generateBirthdayTasks() {
        const today = new Date();
        const month = today.getMonth() + 1;
        const day = today.getDate();
        const todayStart = new Date(today);
        todayStart.setHours(0, 0, 0, 0);
        const tomorrow = new Date(todayStart);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const donors = await this.prisma.donor.findMany({
            where: { dobMonth: month, dobDay: day, isDeleted: false },
            select: { id: true, firstName: true, lastName: true },
        });
        let created = 0;
        for (const donor of donors) {
            const existing = await this.prisma.task.findFirst({
                where: {
                    type: client_1.TaskType.BIRTHDAY,
                    donorId: donor.id,
                    dueDate: { gte: todayStart, lt: tomorrow },
                },
            });
            if (!existing) {
                await this.prisma.task.create({
                    data: {
                        title: `Wish ${donor.firstName} ${donor.lastName} happy birthday`,
                        type: client_1.TaskType.BIRTHDAY,
                        priority: client_1.TaskPriority.HIGH,
                        status: client_1.TaskStatus.PENDING,
                        dueDate: todayStart,
                        donorId: donor.id,
                    },
                });
                created++;
            }
        }
        this.logger.log(`Birthday tasks: ${created} created (${donors.length} donors have birthday today)`);
        return created;
    }
    async generatePledgeFollowUpTasks() {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const sevenDaysAgo = new Date(todayStart);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const pendingPledges = await this.prisma.pledge.findMany({
            where: { status: client_1.PledgeStatus.PENDING, isDeleted: false },
            select: { id: true, donorId: true },
        });
        let created = 0;
        for (const pledge of pendingPledges) {
            const existing = await this.prisma.task.findFirst({
                where: {
                    type: client_1.TaskType.PLEDGE,
                    donorId: pledge.donorId,
                    createdAt: { gte: sevenDaysAgo },
                },
            });
            if (!existing) {
                await this.prisma.task.create({
                    data: {
                        title: `Follow up for pledge`,
                        type: client_1.TaskType.PLEDGE,
                        priority: client_1.TaskPriority.MEDIUM,
                        status: client_1.TaskStatus.PENDING,
                        dueDate: todayStart,
                        donorId: pledge.donorId,
                    },
                });
                created++;
            }
        }
        this.logger.log(`Pledge follow-up tasks: ${created} created (${pendingPledges.length} pending pledges checked)`);
        return created;
    }
    async generateDonationFollowUpTasks() {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const thirtyDaysAgo = new Date(todayStart);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const thirtyOneDaysAgo = new Date(todayStart);
        thirtyOneDaysAgo.setDate(thirtyOneDaysAgo.getDate() - 31);
        const donations = await this.prisma.donation.findMany({
            where: {
                donationDate: { gte: thirtyOneDaysAgo, lt: thirtyDaysAgo },
                isDeleted: false,
            },
            select: { id: true, donorId: true },
        });
        let created = 0;
        for (const donation of donations) {
            const existing = await this.prisma.task.findFirst({
                where: {
                    type: client_1.TaskType.FOLLOW_UP,
                    donorId: donation.donorId,
                    dueDate: { gte: thirtyDaysAgo },
                },
            });
            if (!existing) {
                await this.prisma.task.create({
                    data: {
                        title: `Call donor for feedback`,
                        type: client_1.TaskType.FOLLOW_UP,
                        priority: client_1.TaskPriority.MEDIUM,
                        status: client_1.TaskStatus.PENDING,
                        dueDate: todayStart,
                        donorId: donation.donorId,
                    },
                });
                created++;
            }
        }
        this.logger.log(`Donation follow-up tasks: ${created} created (${donations.length} donations hit 30-day mark)`);
        return created;
    }
};
exports.TaskSchedulerService = TaskSchedulerService;
__decorate([
    (0, schedule_1.Cron)('0 8 * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TaskSchedulerService.prototype, "runDailyTaskGeneration", null);
exports.TaskSchedulerService = TaskSchedulerService = TaskSchedulerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TaskSchedulerService);
//# sourceMappingURL=task-scheduler.service.js.map