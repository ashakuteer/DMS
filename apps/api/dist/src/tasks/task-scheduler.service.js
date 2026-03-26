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
    async onModuleInit() {
        this.logger.log('Startup: running donor task generation...');
        try {
            const donorCount = await this.prisma.donor.count({ where: { isDeleted: false } });
            const donorWithDob = await this.prisma.donor.count({
                where: { dobMonth: { not: null }, dobDay: { not: null }, isDeleted: false },
            });
            const existingTaskCount = await this.prisma.task.count();
            this.logger.log(`Pre-generation state: ${donorCount} total donors, ${donorWithDob} with DOB, ${existingTaskCount} existing tasks in DB`);
            await this.runDailyTaskGeneration();
            const afterCount = await this.prisma.task.count();
            this.logger.log(`Post-generation: ${afterCount} total tasks in DB`);
        }
        catch (err) {
            this.logger.error(`Startup task generation failed: ${err}`);
        }
    }
    async runDailyTaskGeneration() {
        this.logger.log('Daily donor task generation started');
        const results = await Promise.allSettled([
            this.generateDonorDobBirthdayTasks(),
            this.generateBirthdayTasks(),
            this.generateFamilyMemberBirthdayTasks(),
            this.generateAnniversaryTasks(),
            this.generateRemembranceTasks(),
            this.generatePledgeFollowUpTasks(),
            this.generateDonationFollowUpTasks(),
            this.generateSponsorUpdateTasks(),
            this.generateSmartDonationReminderTasks(),
        ]);
        const names = [
            'donor-dob-birthday', 'occasion-birthday', 'family-birthday',
            'anniversary', 'remembrance', 'pledge', 'donation-followup',
            'sponsor-update', 'smart-reminder',
        ];
        results.forEach((r, i) => {
            if (r.status === 'rejected') {
                this.logger.error(`${names[i]} task generation failed: ${r.reason}`);
            }
            else {
                this.logger.log(`${names[i]}: ${r.value} tasks created`);
            }
        });
        this.logger.log('Daily donor task generation complete');
    }
    todayBounds() {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const tomorrow = new Date(todayStart);
        tomorrow.setDate(tomorrow.getDate() + 1);
        return { todayStart, tomorrow };
    }
    autoWhatsApp(donor) {
        return !!(donor.prefWhatsapp && donor.whatsappPhone);
    }
    futureDueDate(offsetDays) {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() + offsetDays);
        return d;
    }
    nextAnnualDate(month, day) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const year = today.getFullYear();
        let dueDate = new Date(year, month - 1, day, 0, 0, 0, 0);
        if (dueDate < today) {
            dueDate = new Date(year + 1, month - 1, day, 0, 0, 0, 0);
        }
        const daysUntil = Math.round((dueDate.getTime() - today.getTime()) / 86400000);
        return { dueDate, daysUntil };
    }
    async generateDonorDobBirthdayTasks() {
        const LOOK_AHEAD_DAYS = 30;
        const donors = await this.prisma.donor.findMany({
            where: {
                dobMonth: { not: null },
                dobDay: { not: null },
                isDeleted: false,
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                dobMonth: true,
                dobDay: true,
                prefWhatsapp: true,
                whatsappPhone: true,
            },
        });
        this.logger.log(`generateDonorDobBirthdayTasks: scanning ${donors.length} donors with DOB data`);
        let created = 0;
        for (const donor of donors) {
            if (!donor.dobMonth || !donor.dobDay)
                continue;
            const { dueDate, daysUntil } = this.nextAnnualDate(donor.dobMonth, donor.dobDay);
            if (daysUntil > LOOK_AHEAD_DAYS)
                continue;
            const nextDay = new Date(dueDate.getTime() + 86400000);
            const existing = await this.prisma.task.findFirst({
                where: {
                    type: client_1.TaskType.BIRTHDAY,
                    donorId: donor.id,
                    dueDate: { gte: dueDate, lt: nextDay },
                },
            });
            if (!existing) {
                const donorName = [donor.firstName, donor.lastName].filter(Boolean).join(' ');
                await this.prisma.task.create({
                    data: {
                        title: `Birthday: ${donorName}`,
                        type: client_1.TaskType.BIRTHDAY,
                        priority: daysUntil <= 1 ? client_1.TaskPriority.HIGH : client_1.TaskPriority.MEDIUM,
                        status: client_1.TaskStatus.PENDING,
                        dueDate,
                        donorId: donor.id,
                        autoWhatsAppPossible: this.autoWhatsApp(donor),
                        manualRequired: true,
                    },
                });
                created++;
            }
        }
        this.logger.log(`generateDonorDobBirthdayTasks: created ${created} new birthday tasks`);
        return created;
    }
    async generateBirthdayTasks() {
        const LOOK_AHEAD_DAYS = 30;
        const birthdayOccasions = await this.prisma.donorSpecialOccasion.findMany({
            where: {
                type: { in: [client_1.OccasionType.DOB_SELF, client_1.OccasionType.DOB_SPOUSE, client_1.OccasionType.DOB_CHILD] },
                donor: { isDeleted: false },
            },
            include: {
                donor: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        prefWhatsapp: true,
                        whatsappPhone: true,
                    },
                },
            },
        });
        let created = 0;
        for (const occ of birthdayOccasions) {
            if (!occ.month || !occ.day)
                continue;
            const { dueDate, daysUntil } = this.nextAnnualDate(occ.month, occ.day);
            if (daysUntil > LOOK_AHEAD_DAYS)
                continue;
            const nextDay = new Date(dueDate.getTime() + 86400000);
            const existing = await this.prisma.task.findFirst({
                where: {
                    type: client_1.TaskType.BIRTHDAY,
                    donorId: occ.donorId,
                    sourceOccasionId: occ.id,
                    dueDate: { gte: dueDate, lt: nextDay },
                },
            });
            if (!existing) {
                const donorName = [occ.donor.firstName, occ.donor.lastName].filter(Boolean).join(' ');
                let title;
                if (occ.type === client_1.OccasionType.DOB_SELF) {
                    title = `Birthday: ${donorName}`;
                }
                else if (occ.type === client_1.OccasionType.DOB_SPOUSE) {
                    const spouseName = occ.relatedPersonName || 'Spouse';
                    title = `Birthday: ${spouseName} (Spouse of ${donorName})`;
                }
                else {
                    const childName = occ.relatedPersonName || 'Child';
                    title = `Birthday: ${childName} (Child of ${donorName})`;
                }
                await this.prisma.task.create({
                    data: {
                        title,
                        type: client_1.TaskType.BIRTHDAY,
                        priority: daysUntil <= 1 ? client_1.TaskPriority.HIGH : client_1.TaskPriority.MEDIUM,
                        status: client_1.TaskStatus.PENDING,
                        dueDate,
                        donorId: occ.donorId,
                        sourceOccasionId: occ.id,
                        autoWhatsAppPossible: this.autoWhatsApp(occ.donor),
                        manualRequired: true,
                    },
                });
                created++;
            }
        }
        return created;
    }
    async generateFamilyMemberBirthdayTasks() {
        const LOOK_AHEAD_DAYS = 30;
        const members = await this.prisma.donorFamilyMember.findMany({
            where: {
                birthMonth: { not: null },
                birthDay: { not: null },
                donor: { isDeleted: false },
            },
            include: {
                donor: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        prefWhatsapp: true,
                        whatsappPhone: true,
                    },
                },
            },
        });
        let created = 0;
        for (const member of members) {
            if (!member.birthMonth || !member.birthDay)
                continue;
            const { dueDate, daysUntil } = this.nextAnnualDate(member.birthMonth, member.birthDay);
            if (daysUntil > LOOK_AHEAD_DAYS)
                continue;
            const nextDay = new Date(dueDate.getTime() + 86400000);
            const existing = await this.prisma.task.findFirst({
                where: {
                    type: client_1.TaskType.BIRTHDAY,
                    donorId: member.donorId,
                    sourceFamilyMemberId: member.id,
                    dueDate: { gte: dueDate, lt: nextDay },
                },
            });
            if (!existing) {
                const donorName = [member.donor.firstName, member.donor.lastName].filter(Boolean).join(' ');
                const title = `Birthday: ${member.name} (${member.relationType.replace(/_/g, ' ')} of ${donorName})`;
                await this.prisma.task.create({
                    data: {
                        title,
                        type: client_1.TaskType.BIRTHDAY,
                        priority: daysUntil <= 1 ? client_1.TaskPriority.HIGH : client_1.TaskPriority.MEDIUM,
                        status: client_1.TaskStatus.PENDING,
                        dueDate,
                        donorId: member.donorId,
                        sourceFamilyMemberId: member.id,
                        autoWhatsAppPossible: this.autoWhatsApp(member.donor),
                        manualRequired: true,
                    },
                });
                created++;
            }
        }
        return created;
    }
    async generateAnniversaryTasks() {
        const LOOK_AHEAD_DAYS = 30;
        const occasions = await this.prisma.donorSpecialOccasion.findMany({
            where: {
                type: client_1.OccasionType.ANNIVERSARY,
                donor: { isDeleted: false },
            },
            include: {
                donor: {
                    select: { id: true, firstName: true, lastName: true, prefWhatsapp: true, whatsappPhone: true },
                },
            },
        });
        let created = 0;
        for (const occ of occasions) {
            if (!occ.month || !occ.day)
                continue;
            const { dueDate, daysUntil } = this.nextAnnualDate(occ.month, occ.day);
            if (daysUntil > LOOK_AHEAD_DAYS)
                continue;
            const nextDay = new Date(dueDate.getTime() + 86400000);
            const existing = await this.prisma.task.findFirst({
                where: {
                    type: client_1.TaskType.ANNIVERSARY,
                    donorId: occ.donorId,
                    sourceOccasionId: occ.id,
                    dueDate: { gte: dueDate, lt: nextDay },
                },
            });
            if (!existing) {
                const name = [occ.donor.firstName, occ.donor.lastName].filter(Boolean).join(' ');
                await this.prisma.task.create({
                    data: {
                        title: `Anniversary: ${name}${occ.relatedPersonName ? ` & ${occ.relatedPersonName}` : ''}`,
                        type: client_1.TaskType.ANNIVERSARY,
                        priority: daysUntil <= 1 ? client_1.TaskPriority.HIGH : client_1.TaskPriority.MEDIUM,
                        status: client_1.TaskStatus.PENDING,
                        dueDate,
                        donorId: occ.donorId,
                        sourceOccasionId: occ.id,
                        autoWhatsAppPossible: this.autoWhatsApp(occ.donor),
                        manualRequired: true,
                    },
                });
                created++;
            }
        }
        return created;
    }
    async generateRemembranceTasks() {
        const LOOK_AHEAD_DAYS = 30;
        const occasions = await this.prisma.donorSpecialOccasion.findMany({
            where: {
                type: client_1.OccasionType.DEATH_ANNIVERSARY,
                donor: { isDeleted: false },
            },
            include: {
                donor: {
                    select: { id: true, firstName: true, lastName: true, prefWhatsapp: true, whatsappPhone: true },
                },
            },
        });
        let created = 0;
        for (const occ of occasions) {
            if (!occ.month || !occ.day)
                continue;
            const { dueDate, daysUntil } = this.nextAnnualDate(occ.month, occ.day);
            if (daysUntil > LOOK_AHEAD_DAYS)
                continue;
            const nextDay = new Date(dueDate.getTime() + 86400000);
            const existing = await this.prisma.task.findFirst({
                where: {
                    type: client_1.TaskType.REMEMBRANCE,
                    donorId: occ.donorId,
                    sourceOccasionId: occ.id,
                    dueDate: { gte: dueDate, lt: nextDay },
                },
            });
            if (!existing) {
                const name = [occ.donor.firstName, occ.donor.lastName].filter(Boolean).join(' ');
                const titleSuffix = daysUntil === 0
                    ? ''
                    : ` (in ${daysUntil} day${daysUntil === 1 ? '' : 's'})`;
                await this.prisma.task.create({
                    data: {
                        title: `Remembrance${titleSuffix}: ${occ.relatedPersonName || 'Loved One'} (${name})`,
                        type: client_1.TaskType.REMEMBRANCE,
                        priority: daysUntil <= 3 ? client_1.TaskPriority.HIGH : client_1.TaskPriority.MEDIUM,
                        status: client_1.TaskStatus.PENDING,
                        dueDate,
                        donorId: occ.donorId,
                        sourceOccasionId: occ.id,
                        autoWhatsAppPossible: false,
                        manualRequired: true,
                    },
                });
                created++;
            }
        }
        return created;
    }
    async generatePledgeFollowUpTasks() {
        const { todayStart } = this.todayBounds();
        const thirtyDaysLater = new Date(todayStart);
        thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
        const pendingPledges = await this.prisma.pledge.findMany({
            where: {
                status: client_1.PledgeStatus.PENDING,
                isDeleted: false,
                expectedFulfillmentDate: { lte: thirtyDaysLater },
            },
            select: {
                id: true,
                donorId: true,
                pledgeType: true,
                amount: true,
                quantity: true,
                expectedFulfillmentDate: true,
                donor: { select: { prefWhatsapp: true, whatsappPhone: true } },
            },
        });
        let created = 0;
        for (const pledge of pendingPledges) {
            const existing = await this.prisma.task.findFirst({
                where: {
                    type: client_1.TaskType.PLEDGE,
                    sourcePledgeId: pledge.id,
                    status: { notIn: [client_1.TaskStatus.COMPLETED, client_1.TaskStatus.MISSED] },
                },
            });
            if (!existing) {
                const dueDate = new Date(pledge.expectedFulfillmentDate);
                dueDate.setHours(0, 0, 0, 0);
                const daysUntil = Math.round((dueDate.getTime() - todayStart.getTime()) / 86400000);
                const isOverdue = daysUntil < 0;
                const amountStr = pledge.pledgeType === 'MONEY' && pledge.amount
                    ? ` ₹${Number(pledge.amount)}`
                    : pledge.quantity
                        ? ` (${pledge.quantity})`
                        : '';
                const urgency = isOverdue
                    ? ` — ${Math.abs(daysUntil)}d overdue`
                    : daysUntil === 0
                        ? ' — due today'
                        : ` — due in ${daysUntil}d`;
                await this.prisma.task.create({
                    data: {
                        title: `${pledge.pledgeType} pledge follow-up${amountStr}${urgency}`,
                        type: client_1.TaskType.PLEDGE,
                        priority: isOverdue || daysUntil <= 3
                            ? client_1.TaskPriority.HIGH
                            : client_1.TaskPriority.MEDIUM,
                        status: client_1.TaskStatus.PENDING,
                        dueDate,
                        donorId: pledge.donorId,
                        sourcePledgeId: pledge.id,
                        autoWhatsAppPossible: this.autoWhatsApp(pledge.donor),
                        manualRequired: true,
                    },
                });
                created++;
            }
        }
        return created;
    }
    async generateDonationFollowUpTasks() {
        const { todayStart } = this.todayBounds();
        const thirtyDaysAgo = new Date(todayStart);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const thirtyOneDaysAgo = new Date(todayStart);
        thirtyOneDaysAgo.setDate(thirtyOneDaysAgo.getDate() - 31);
        const donations = await this.prisma.donation.findMany({
            where: {
                donationDate: { gte: thirtyOneDaysAgo, lt: thirtyDaysAgo },
                isDeleted: false,
            },
            select: {
                id: true,
                donorId: true,
                donor: { select: { prefWhatsapp: true, whatsappPhone: true } },
            },
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
                        title: `Follow-up call — 30-day check-in`,
                        type: client_1.TaskType.FOLLOW_UP,
                        priority: client_1.TaskPriority.MEDIUM,
                        status: client_1.TaskStatus.PENDING,
                        dueDate: todayStart,
                        donorId: donation.donorId,
                        autoWhatsAppPossible: this.autoWhatsApp(donation.donor),
                        manualRequired: true,
                    },
                });
                created++;
            }
        }
        return created;
    }
    async generateSponsorUpdateTasks() {
        const { todayStart } = this.todayBounds();
        const sponsorships = await this.prisma.sponsorship.findMany({
            where: { isActive: true, status: 'ACTIVE' },
            select: {
                id: true,
                donorId: true,
                sponsorshipType: true,
                beneficiary: { select: { id: true, fullName: true } },
                donor: { select: { prefWhatsapp: true, whatsappPhone: true } },
            },
        });
        const ninetyDaysAgo = new Date(todayStart);
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
        let created = 0;
        for (const sp of sponsorships) {
            const existing = await this.prisma.task.findFirst({
                where: {
                    type: client_1.TaskType.SPONSOR_UPDATE,
                    sourceSponsorshipId: sp.id,
                    createdAt: { gte: ninetyDaysAgo },
                },
            });
            if (!existing) {
                await this.prisma.task.create({
                    data: {
                        title: `Send sponsor update — ${sp.beneficiary.fullName}`,
                        description: `Quarterly update for ${sp.sponsorshipType} sponsorship`,
                        type: client_1.TaskType.SPONSOR_UPDATE,
                        priority: client_1.TaskPriority.MEDIUM,
                        status: client_1.TaskStatus.PENDING,
                        dueDate: todayStart,
                        donorId: sp.donorId,
                        beneficiaryId: sp.beneficiary.id,
                        sourceSponsorshipId: sp.id,
                        autoWhatsAppPossible: this.autoWhatsApp(sp.donor),
                        manualRequired: true,
                    },
                });
                created++;
            }
        }
        return created;
    }
    async generateSmartDonationReminderTasks() {
        const { todayStart } = this.todayBounds();
        const today = new Date();
        const dayOfMonth = today.getDate();
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const quarterMonth = Math.floor(today.getMonth() / 3) * 3;
        const quarterStart = new Date(today.getFullYear(), quarterMonth, 1);
        if (dayOfMonth < 10)
            return 0;
        const [monthlyDonors, quarterlyDonors] = await Promise.all([
            this.prisma.donor.findMany({
                where: {
                    isDeleted: false,
                    donationFrequency: client_1.DonationFrequency.MONTHLY,
                },
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    prefWhatsapp: true,
                    whatsappPhone: true,
                    donations: {
                        where: { donationDate: { gte: monthStart }, isDeleted: false },
                        select: { id: true },
                        take: 1,
                    },
                },
            }),
            this.prisma.donor.findMany({
                where: {
                    isDeleted: false,
                    donationFrequency: client_1.DonationFrequency.QUARTERLY,
                },
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    prefWhatsapp: true,
                    whatsappPhone: true,
                    donations: {
                        where: { donationDate: { gte: quarterStart }, isDeleted: false },
                        select: { id: true },
                        take: 1,
                    },
                },
            }),
        ]);
        const sevenDaysAgo = new Date(todayStart);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        let created = 0;
        for (const donor of monthlyDonors) {
            if (donor.donations.length > 0)
                continue;
            const existing = await this.prisma.task.findFirst({
                where: {
                    type: client_1.TaskType.SMART_REMINDER,
                    donorId: donor.id,
                    createdAt: { gte: sevenDaysAgo },
                },
            });
            if (!existing) {
                const name = [donor.firstName, donor.lastName].filter(Boolean).join(' ');
                await this.prisma.task.create({
                    data: {
                        title: `Smart reminder — Monthly donation due (${name})`,
                        description: `${name} is a monthly donor and hasn't donated this month yet.`,
                        type: client_1.TaskType.SMART_REMINDER,
                        priority: client_1.TaskPriority.MEDIUM,
                        status: client_1.TaskStatus.PENDING,
                        dueDate: todayStart,
                        donorId: donor.id,
                        autoWhatsAppPossible: this.autoWhatsApp(donor),
                        manualRequired: true,
                    },
                });
                created++;
            }
        }
        for (const donor of quarterlyDonors) {
            if (donor.donations.length > 0)
                continue;
            const existing = await this.prisma.task.findFirst({
                where: {
                    type: client_1.TaskType.SMART_REMINDER,
                    donorId: donor.id,
                    createdAt: { gte: sevenDaysAgo },
                },
            });
            if (!existing) {
                const name = [donor.firstName, donor.lastName].filter(Boolean).join(' ');
                await this.prisma.task.create({
                    data: {
                        title: `Smart reminder — Quarterly donation due (${name})`,
                        description: `${name} is a quarterly donor and hasn't donated this quarter yet.`,
                        type: client_1.TaskType.SMART_REMINDER,
                        priority: client_1.TaskPriority.MEDIUM,
                        status: client_1.TaskStatus.PENDING,
                        dueDate: todayStart,
                        donorId: donor.id,
                        autoWhatsAppPossible: this.autoWhatsApp(donor),
                        manualRequired: true,
                    },
                });
                created++;
            }
        }
        return created;
    }
};
exports.TaskSchedulerService = TaskSchedulerService;
__decorate([
    (0, schedule_1.Cron)('0 7 * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TaskSchedulerService.prototype, "runDailyTaskGeneration", null);
exports.TaskSchedulerService = TaskSchedulerService = TaskSchedulerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TaskSchedulerService);
//# sourceMappingURL=task-scheduler.service.js.map