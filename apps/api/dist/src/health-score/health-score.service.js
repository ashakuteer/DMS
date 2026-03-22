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
var HealthScoreService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthScoreService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const client_1 = require("@prisma/client");
let HealthScoreService = HealthScoreService_1 = class HealthScoreService {
    constructor(prisma, auditService) {
        this.prisma = prisma;
        this.auditService = auditService;
        this.logger = new common_1.Logger(HealthScoreService_1.name);
    }
    async calculateHealthScore(donorId) {
        const now = new Date();
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(now.getDate() - 30);
        const ninetyDaysAgo = new Date(now);
        ninetyDaysAgo.setDate(now.getDate() - 90);
        const oneEightyDaysAgo = new Date(now);
        oneEightyDaysAgo.setDate(now.getDate() - 180);
        const oneYearAgo = new Date(now);
        oneYearAgo.setFullYear(now.getFullYear() - 1);
        const donor = await this.prisma.donor.findUnique({
            where: { id: donorId },
            include: {
                donations: {
                    where: { isDeleted: false },
                    orderBy: { donationDate: 'desc' },
                    take: 1,
                },
                specialOccasions: true,
            },
        });
        if (!donor) {
            return {
                score: 0,
                status: client_1.HealthStatus.RED,
                breakdown: {
                    base: 100,
                    donationDeduction: -100,
                    donationBonus: 0,
                    missedSpecialDays: 0,
                    acknowledgedSpecialDays: 0,
                    overdueReminders: 0,
                    contactDeduction: 0,
                    contactBonus: 0,
                    pledgeDeduction: 0,
                },
            };
        }
        let score = 100;
        const breakdown = {
            base: 100,
            donationDeduction: 0,
            donationBonus: 0,
            missedSpecialDays: 0,
            acknowledgedSpecialDays: 0,
            overdueReminders: 0,
            contactDeduction: 0,
            contactBonus: 0,
            pledgeDeduction: 0,
        };
        const lastDonation = donor.donations[0];
        if (!lastDonation) {
            breakdown.donationDeduction = -30;
            score -= 30;
        }
        else {
            const lastDonationDate = new Date(lastDonation.donationDate);
            if (lastDonationDate >= thirtyDaysAgo) {
                breakdown.donationBonus = 10;
                score += 10;
            }
            else if (lastDonationDate >= ninetyDaysAgo) {
                breakdown.donationDeduction = -10;
                score -= 10;
            }
            else if (lastDonationDate >= oneEightyDaysAgo) {
                breakdown.donationDeduction = -20;
                score -= 20;
            }
            else {
                breakdown.donationDeduction = -30;
                score -= 30;
            }
        }
        const currentMonth = now.getMonth() + 1;
        const currentDay = now.getDate();
        const currentYear = now.getFullYear();
        let acknowledgedCount = 0;
        let missedCount = 0;
        for (const occasion of donor.specialOccasions) {
            const occasionThisYear = new Date(currentYear, occasion.month - 1, occasion.day);
            const occasionLastYear = new Date(currentYear - 1, occasion.month - 1, occasion.day);
            const relevantOccasionDate = occasionThisYear <= now ? occasionThisYear : occasionLastYear;
            if (relevantOccasionDate >= oneYearAgo && relevantOccasionDate <= now) {
                const completedReminder = await this.prisma.reminderTask.findFirst({
                    where: {
                        donorId,
                        sourceOccasionId: occasion.id,
                        status: 'DONE',
                        dueDate: {
                            gte: new Date(relevantOccasionDate.getTime() - 30 * 24 * 60 * 60 * 1000),
                            lte: new Date(relevantOccasionDate.getTime() + 7 * 24 * 60 * 60 * 1000),
                        },
                    },
                });
                if (completedReminder) {
                    acknowledgedCount++;
                }
                else if (relevantOccasionDate < now) {
                    missedCount++;
                }
            }
        }
        breakdown.acknowledgedSpecialDays = acknowledgedCount * 5;
        score += breakdown.acknowledgedSpecialDays;
        breakdown.missedSpecialDays = -(missedCount * 10);
        score += breakdown.missedSpecialDays;
        const overdueFollowUpReminders = await this.prisma.reminderTask.count({
            where: {
                donorId,
                status: 'OPEN',
                type: 'FOLLOW_UP',
                dueDate: {
                    lt: now,
                },
            },
        });
        breakdown.overdueReminders = -(overdueFollowUpReminders * 5);
        score += breakdown.overdueReminders;
        const sevenDaysAgo = new Date(now);
        sevenDaysAgo.setDate(now.getDate() - 7);
        const [lastCommLog, lastCommMessage] = await Promise.all([
            this.prisma.communicationLog.findFirst({
                where: { donorId },
                orderBy: { createdAt: 'desc' },
                select: { createdAt: true },
            }),
            this.prisma.communicationMessage.findFirst({
                where: { donorId },
                orderBy: { createdAt: 'desc' },
                select: { createdAt: true },
            }),
        ]);
        const lastContactDate = [lastCommLog?.createdAt, lastCommMessage?.createdAt]
            .filter(Boolean)
            .sort((a, b) => b.getTime() - a.getTime())[0] || null;
        if (!lastContactDate) {
            breakdown.contactDeduction = -10;
            score -= 10;
        }
        else if (lastContactDate >= sevenDaysAgo) {
            breakdown.contactBonus = 10;
            score += 10;
        }
        else if (lastContactDate >= thirtyDaysAgo) {
            breakdown.contactBonus = 5;
            score += 5;
        }
        else if (lastContactDate >= ninetyDaysAgo) {
        }
        else {
            breakdown.contactDeduction = -15;
            score -= 15;
        }
        const pendingPledges = await this.prisma.pledge.findMany({
            where: {
                donorId,
                status: 'PENDING',
                isDeleted: false,
            },
            select: { expectedFulfillmentDate: true },
        });
        if (pendingPledges.length > 0) {
            const hasOverdue = pendingPledges.some((p) => p.expectedFulfillmentDate && new Date(p.expectedFulfillmentDate) < now);
            const sevenDaysFromNow = new Date(now);
            sevenDaysFromNow.setDate(now.getDate() + 7);
            const hasDueThisWeek = pendingPledges.some((p) => p.expectedFulfillmentDate &&
                new Date(p.expectedFulfillmentDate) >= now &&
                new Date(p.expectedFulfillmentDate) <= sevenDaysFromNow);
            if (hasOverdue) {
                breakdown.pledgeDeduction = -15;
                score -= 15;
            }
            else if (hasDueThisWeek) {
                breakdown.pledgeDeduction = -5;
                score -= 5;
            }
        }
        score = Math.max(0, Math.min(100, score));
        let status;
        if (score >= 80) {
            status = client_1.HealthStatus.GREEN;
        }
        else if (score >= 50) {
            status = client_1.HealthStatus.YELLOW;
        }
        else {
            status = client_1.HealthStatus.RED;
        }
        return { score, status, breakdown };
    }
    async updateDonorHealthScore(donorId, userId) {
        const donor = await this.prisma.donor.findUnique({
            where: { id: donorId },
            select: { healthStatus: true, healthScore: true },
        });
        if (!donor)
            return;
        const oldStatus = donor.healthStatus;
        const { score, status } = await this.calculateHealthScore(donorId);
        await this.prisma.donor.update({
            where: { id: donorId },
            data: {
                healthScore: score,
                healthStatus: status,
                lastHealthCheck: new Date(),
            },
        });
        if (oldStatus !== status) {
            const isNegativeTransition = (oldStatus === 'GREEN' && (status === 'YELLOW' || status === 'RED')) ||
                (oldStatus === 'YELLOW' && status === 'RED');
            if (isNegativeTransition) {
                this.logger.warn(`Donor ${donorId} health status changed: ${oldStatus} → ${status}`);
                await this.auditService.log({
                    userId: userId || 'SYSTEM',
                    action: 'HEALTH_STATUS_CHANGE',
                    entityType: 'Donor',
                    entityId: donorId,
                    metadata: {
                        oldStatus,
                        newStatus: status,
                        oldScore: donor.healthScore,
                        newScore: score,
                    },
                });
            }
        }
    }
    async recalculateAllHealthScores() {
        this.logger.log('Starting health score recalculation for all donors...');
        const donors = await this.prisma.donor.findMany({
            where: { isDeleted: false },
            select: { id: true },
        });
        let updated = 0;
        let errors = 0;
        for (const donor of donors) {
            try {
                await this.updateDonorHealthScore(donor.id);
                updated++;
            }
            catch (error) {
                this.logger.error(`Failed to update health score for donor ${donor.id}:`, error);
                errors++;
            }
        }
        this.logger.log(`Health score recalculation complete. Updated: ${updated}, Errors: ${errors}`);
        return { updated, errors };
    }
    getStatusColor(status) {
        switch (status) {
            case client_1.HealthStatus.GREEN:
                return '#22c55e';
            case client_1.HealthStatus.YELLOW:
                return '#eab308';
            case client_1.HealthStatus.RED:
                return '#ef4444';
            default:
                return '#6b7280';
        }
    }
    getStatusLabel(status) {
        switch (status) {
            case client_1.HealthStatus.GREEN:
                return 'Healthy';
            case client_1.HealthStatus.YELLOW:
                return 'Needs Attention';
            case client_1.HealthStatus.RED:
                return 'At Risk';
            default:
                return 'Unknown';
        }
    }
};
exports.HealthScoreService = HealthScoreService;
exports.HealthScoreService = HealthScoreService = HealthScoreService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService])
], HealthScoreService);
//# sourceMappingURL=health-score.service.js.map