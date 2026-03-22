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
var DashboardInsightsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardInsightsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const dashboard_helpers_1 = require("./dashboard.helpers");
let DashboardInsightsService = DashboardInsightsService_1 = class DashboardInsightsService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(DashboardInsightsService_1.name);
        this.cache = new Map();
        this.CACHE_TTL_MS = 5 * 60 * 1000;
    }
    getCached(key) {
        const entry = this.cache.get(key);
        if (entry && Date.now() < entry.expiresAt)
            return entry.data;
        this.cache.delete(key);
        return null;
    }
    setCached(key, data) {
        this.cache.set(key, { data, expiresAt: Date.now() + this.CACHE_TTL_MS });
    }
    async getAIInsights() {
        const cached = this.getCached("ai_insights");
        if (cached) {
            this.logger.debug("getAIInsights() served from cache");
            return cached;
        }
        const start = Date.now();
        const { fyStart, fyEnd } = (0, dashboard_helpers_1.getCurrentFY)();
        const now = new Date();
        const insights = [];
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
        const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
        const [thisMonth, lastMonth, regularDonors, donations, modeTrend] = await Promise.all([
            this.prisma.donation.aggregate({
                _sum: { donationAmount: true },
                _count: { id: true },
                where: {
                    deletedAt: null,
                    donationDate: { gte: thisMonthStart, lte: thisMonthEnd },
                },
            }),
            this.prisma.donation.aggregate({
                _sum: { donationAmount: true },
                _count: { id: true },
                where: {
                    deletedAt: null,
                    donationDate: { gte: lastMonthStart, lte: lastMonthEnd },
                },
            }),
            this.prisma.donor.findMany({
                where: {
                    deletedAt: null,
                    donationFrequency: { in: ["MONTHLY", "QUARTERLY"] },
                },
                select: { id: true },
            }),
            this.prisma.donation.findMany({
                where: {
                    deletedAt: null,
                    donationDate: { gte: fyStart, lte: fyEnd },
                },
                select: { donationDate: true },
                orderBy: { donationDate: "desc" },
                take: 500,
            }),
            this.prisma.donation.groupBy({
                by: ["donationMode"],
                _count: { id: true },
                where: {
                    deletedAt: null,
                    donationDate: { gte: fyStart, lte: fyEnd },
                },
                orderBy: { _count: { id: "desc" } },
            }),
        ]);
        const thisMonthAmt = thisMonth._sum.donationAmount?.toNumber() || 0;
        const lastMonthAmt = lastMonth._sum.donationAmount?.toNumber() || 0;
        if (lastMonthAmt > 0 && thisMonthAmt > 0) {
            const change = ((thisMonthAmt - lastMonthAmt) / lastMonthAmt) * 100;
            const direction = change >= 0 ? "up" : "down";
            insights.push({
                type: direction === "up" ? "positive" : "warning",
                title: "Month-over-Month Change",
                description: `Donations are ${direction} ${Math.abs(change).toFixed(1)}% compared to last month (₹${thisMonthAmt.toLocaleString("en-IN")} vs ₹${lastMonthAmt.toLocaleString("en-IN")}).`,
            });
        }
        const regularDonorIds = regularDonors.map((d) => d.id);
        if (regularDonorIds.length > 0) {
            const activeDonorIds = await this.prisma.donation.findMany({
                where: {
                    deletedAt: null,
                    donorId: { in: regularDonorIds },
                    donationDate: { gte: sixtyDaysAgo },
                },
                select: { donorId: true },
                distinct: ["donorId"],
            });
            const inactiveCount = regularDonorIds.length - activeDonorIds.length;
            if (inactiveCount > 0) {
                insights.push({
                    type: "warning",
                    title: "Inactive Regular Donors",
                    description: `${inactiveCount} regular donor(s) haven't donated in the last 60 days. Consider reaching out to re-engage them.`,
                });
            }
        }
        if (donations.length >= 5) {
            const hourCounts = {};
            donations.forEach((d) => {
                const hour = new Date(d.donationDate).getHours();
                const timeSlot = hour < 12
                    ? "Morning (6AM-12PM)"
                    : hour < 17
                        ? "Afternoon (12PM-5PM)"
                        : "Evening (5PM-9PM)";
                hourCounts[timeSlot] = (hourCounts[timeSlot] || 0) + 1;
            });
            const topSlot = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0];
            if (topSlot) {
                insights.push({
                    type: "info",
                    title: "Peak Donation Time",
                    description: `Most donations are received during ${topSlot[0]} (${topSlot[1]} donations). Consider scheduling outreach during these hours.`,
                });
            }
        }
        if (modeTrend.length > 1) {
            const topMode = modeTrend[0];
            const total = modeTrend.reduce((sum, m) => sum + m._count.id, 0);
            if (total >= 3) {
                const percentage = ((topMode._count.id / total) * 100).toFixed(0);
                const modeName = (0, dashboard_helpers_1.formatMode)(topMode.donationMode || "OTHER");
                insights.push({
                    type: "info",
                    title: "Preferred Payment Mode",
                    description: `${modeName} is the most popular payment method (${percentage}% of donations). Ensure this channel is optimized.`,
                });
            }
        }
        this.setCached("ai_insights", insights);
        this.logger.log(`getAIInsights() completed in ${Date.now() - start}ms`);
        return insights;
    }
    async getDonorInsights(donorId) {
        const [donations, sponsorships] = await Promise.all([
            this.prisma.donation.findMany({
                where: { donorId, deletedAt: null },
                orderBy: { donationDate: "desc" },
            }),
            this.prisma.sponsorship.findMany({
                where: { donorId },
                include: {
                    beneficiary: {
                        select: { homeType: true },
                    },
                },
            }),
        ]);
        const sponsoredBeneficiariesCount = new Set(sponsorships.map((s) => s.beneficiaryId)).size;
        const homeTypeCounts = {};
        sponsorships.forEach((s) => {
            const home = s.beneficiary?.homeType || "UNKNOWN";
            homeTypeCounts[home] = (homeTypeCounts[home] || 0) + 1;
        });
        const mostSponsoredHomeRaw = Object.entries(homeTypeCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
        const mostSponsoredHome = (0, dashboard_helpers_1.formatHomeType)(mostSponsoredHomeRaw);
        if (donations.length === 0) {
            return {
                avgDonation: 0,
                frequency: "No donations yet",
                lastDonationDaysAgo: null,
                preferredMode: "N/A",
                preferredDonationType: "N/A",
                mostSponsoredHome: mostSponsoredHome || "N/A",
                sponsoredBeneficiariesCount,
                totalDonations: 0,
                donationCount: 0,
            };
        }
        const total = donations.reduce((sum, d) => sum + d.donationAmount.toNumber(), 0);
        const avgDonation = total / donations.length;
        const lastDonation = donations[0];
        const daysSinceLast = Math.floor((Date.now() - new Date(lastDonation.donationDate).getTime()) /
            (1000 * 60 * 60 * 24));
        const modeCounts = {};
        const typeCounts = {};
        donations.forEach((d) => {
            const mode = d.donationMode || "OTHER";
            modeCounts[mode] = (modeCounts[mode] || 0) + 1;
            const isCash = d.donationType === "CASH";
            const typeCategory = isCash ? "CASH" : "IN_KIND";
            typeCounts[typeCategory] = (typeCounts[typeCategory] || 0) + 1;
        });
        const preferredMode = Object.entries(modeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";
        const preferredTypeRaw = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
        const preferredDonationType = preferredTypeRaw === "CASH"
            ? "Cash"
            : preferredTypeRaw === "IN_KIND"
                ? "In-Kind"
                : "N/A";
        let frequency = "Occasional";
        if (donations.length >= 2) {
            const dates = donations.map((d) => new Date(d.donationDate).getTime());
            const gaps = [];
            for (let i = 0; i < dates.length - 1; i++) {
                gaps.push((dates[i] - dates[i + 1]) / (1000 * 60 * 60 * 24));
            }
            const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;
            if (avgGap <= 45)
                frequency = "Monthly";
            else if (avgGap <= 120)
                frequency = "Quarterly";
            else if (avgGap <= 400)
                frequency = "Annual";
            else
                frequency = "Occasional";
        }
        return {
            avgDonation: Math.round(avgDonation),
            frequency,
            lastDonationDaysAgo: daysSinceLast,
            preferredMode: (0, dashboard_helpers_1.formatMode)(preferredMode),
            preferredDonationType,
            mostSponsoredHome: mostSponsoredHome || "N/A",
            sponsoredBeneficiariesCount,
            totalDonations: total,
            donationCount: donations.length,
        };
    }
    async getAdminInsights() {
        const cached = this.getCached("admin_insights");
        if (cached) {
            this.logger.debug("getAdminInsights() served from cache");
            return cached;
        }
        const start = Date.now();
        const { fyStart, fyEnd } = (0, dashboard_helpers_1.getCurrentFY)();
        const now = new Date();
        const insights = [];
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
        const [thisMonth, lastMonth, regularDonors, allDonationsFY, topDonorsSum] = await Promise.all([
            this.prisma.donation.aggregate({
                _sum: { donationAmount: true },
                _count: { id: true },
                where: {
                    deletedAt: null,
                    donationDate: { gte: thisMonthStart, lte: thisMonthEnd },
                },
            }),
            this.prisma.donation.aggregate({
                _sum: { donationAmount: true },
                _count: { id: true },
                where: {
                    deletedAt: null,
                    donationDate: { gte: lastMonthStart, lte: lastMonthEnd },
                },
            }),
            this.prisma.donor.findMany({
                where: {
                    deletedAt: null,
                    donationFrequency: { in: ["MONTHLY", "QUARTERLY"] },
                },
                select: { id: true, firstName: true, lastName: true, donationFrequency: true },
            }),
            this.prisma.donation.aggregate({
                _sum: { donationAmount: true },
                where: {
                    deletedAt: null,
                    donationDate: { gte: fyStart, lte: fyEnd },
                },
            }),
            this.prisma.donation.groupBy({
                by: ["donorId"],
                _sum: { donationAmount: true },
                where: {
                    deletedAt: null,
                    donationDate: { gte: fyStart, lte: fyEnd },
                },
                orderBy: { _sum: { donationAmount: "desc" } },
                take: 5,
            }),
        ]);
        const thisMonthAmt = thisMonth._sum.donationAmount?.toNumber() || 0;
        const lastMonthAmt = lastMonth._sum.donationAmount?.toNumber() || 0;
        if (lastMonthAmt > 0 && thisMonthAmt > 0) {
            const change = ((thisMonthAmt - lastMonthAmt) / lastMonthAmt) * 100;
            const direction = change >= 0 ? "increased" : "decreased";
            insights.push({
                type: change >= 0 ? "positive" : "warning",
                title: "Month-over-Month Performance",
                description: `Total donations ${direction} by ${Math.abs(change).toFixed(1)}% this month. Current: ₹${thisMonthAmt.toLocaleString("en-IN")}, Previous: ₹${lastMonthAmt.toLocaleString("en-IN")}.`,
            });
        }
        const regularDonorIds = regularDonors.map((d) => d.id);
        const latestDonations = regularDonorIds.length
            ? await this.prisma.donation.findMany({
                where: {
                    donorId: { in: regularDonorIds },
                    deletedAt: null,
                },
                orderBy: { donationDate: "desc" },
                select: { donorId: true, donationDate: true },
            })
            : [];
        const latestDonationMap = new Map();
        for (const donation of latestDonations) {
            if (!latestDonationMap.has(donation.donorId)) {
                latestDonationMap.set(donation.donorId, donation.donationDate);
            }
        }
        const inactiveDonors = [];
        for (const donor of regularDonors) {
            const lastDonation = latestDonationMap.get(donor.id);
            if (lastDonation) {
                const daysSince = Math.floor((now.getTime() - new Date(lastDonation).getTime()) /
                    (1000 * 60 * 60 * 24));
                const expectedCycle = donor.donationFrequency === "MONTHLY" ? 45 : 120;
                if (daysSince > expectedCycle) {
                    inactiveDonors.push({
                        name: `${donor.firstName} ${donor.lastName || ""}`.trim(),
                        daysInactive: daysSince,
                        frequency: donor.donationFrequency || "Regular",
                    });
                }
            }
        }
        if (inactiveDonors.length > 0) {
            insights.push({
                type: "warning",
                title: "Missed Donation Cycles",
                description: `${inactiveDonors.length} regular donor(s) have missed their expected donation cycle. Top: ${inactiveDonors
                    .slice(0, 3)
                    .map((d) => `${d.name} (${d.daysInactive} days)`)
                    .join(", ")}.`,
            });
        }
        const totalFY = allDonationsFY._sum.donationAmount?.toNumber() || 0;
        const top5Total = topDonorsSum.reduce((sum, d) => sum + (d._sum.donationAmount?.toNumber() || 0), 0);
        if (totalFY > 0) {
            const concentration = ((top5Total / totalFY) * 100).toFixed(1);
            const riskLevel = parseFloat(concentration) > 50
                ? "high"
                : parseFloat(concentration) > 30
                    ? "moderate"
                    : "low";
            insights.push({
                type: riskLevel === "high" ? "warning" : "info",
                title: "Donation Concentration",
                description: `Top 5 donors contribute ${concentration}% of this FY's donations (₹${top5Total.toLocaleString("en-IN")} of ₹${totalFY.toLocaleString("en-IN")}). Risk level: ${riskLevel}.`,
            });
        }
        const quarters = [
            {
                name: "Q1 (Apr-Jun)",
                start: new Date(fyStart.getFullYear(), 3, 1),
                end: new Date(fyStart.getFullYear(), 5, 30, 23, 59, 59),
            },
            {
                name: "Q2 (Jul-Sep)",
                start: new Date(fyStart.getFullYear(), 6, 1),
                end: new Date(fyStart.getFullYear(), 8, 30, 23, 59, 59),
            },
            {
                name: "Q3 (Oct-Dec)",
                start: new Date(fyStart.getFullYear(), 9, 1),
                end: new Date(fyStart.getFullYear(), 11, 31, 23, 59, 59),
            },
            {
                name: "Q4 (Jan-Mar)",
                start: new Date(fyStart.getFullYear() + 1, 0, 1),
                end: new Date(fyStart.getFullYear() + 1, 2, 31, 23, 59, 59),
            },
        ];
        const eligibleQuarters = quarters.filter((q) => q.end <= now);
        const quarterResults = await Promise.all(eligibleQuarters.map((q) => this.prisma.donation.aggregate({
            _sum: { donationAmount: true },
            where: {
                deletedAt: null,
                donationDate: { gte: q.start, lte: q.end },
            },
        })));
        const quarterlyData = quarterResults.map((result, i) => ({
            q: eligibleQuarters[i].name,
            amount: result._sum.donationAmount?.toNumber() || 0,
        }));
        const nonZeroQuarters = quarterlyData.filter((q) => q.amount > 0);
        if (nonZeroQuarters.length >= 2) {
            const best = nonZeroQuarters.reduce((a, b) => (a.amount > b.amount ? a : b));
            insights.push({
                type: "info",
                title: "Seasonal Performance",
                description: `Best quarter: ${best.q} (₹${best.amount.toLocaleString("en-IN")}). Plan campaigns around historically strong periods.`,
            });
        }
        this.setCached("admin_insights", insights);
        this.logger.log(`getAdminInsights() completed in ${Date.now() - start}ms`);
        return insights;
    }
    async getInsightCards() {
        const cached = this.getCached("insight_cards");
        if (cached) {
            this.logger.debug("getInsightCards() served from cache");
            return cached;
        }
        const start = Date.now();
        const now = new Date();
        const { fyStart, fyEnd } = (0, dashboard_helpers_1.getCurrentFY)();
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(now.getDate() - 30);
        const oneEightyDaysAgo = new Date(now);
        oneEightyDaysAgo.setDate(now.getDate() - 180);
        const sevenDaysFromNow = new Date(now);
        sevenDaysFromNow.setDate(now.getDate() + 7);
        const cards = [];
        const [totalDonorCount, recentLogDonorIds, recentMsgDonorIds, donationsByDonor, donorsWithRecentDonation, donorsWithOlderDonation, pledgesDueThisWeek,] = await Promise.all([
            this.prisma.donor.count({ where: { deletedAt: null } }),
            this.prisma.communicationLog.findMany({
                where: { createdAt: { gte: thirtyDaysAgo } },
                select: { donorId: true },
                distinct: ["donorId"],
            }),
            this.prisma.communicationMessage.findMany({
                where: {
                    createdAt: { gte: thirtyDaysAgo },
                    donorId: { not: null },
                },
                select: { donorId: true },
                distinct: ["donorId"],
            }),
            this.prisma.donation.groupBy({
                by: ["donorId"],
                _sum: { donationAmount: true },
                where: {
                    deletedAt: null,
                    donationDate: { gte: fyStart, lte: fyEnd },
                },
                orderBy: { _sum: { donationAmount: "desc" } },
            }),
            this.prisma.donation.findMany({
                where: {
                    deletedAt: null,
                    donationDate: { gte: oneEightyDaysAgo },
                },
                select: { donorId: true },
                distinct: ["donorId"],
            }),
            this.prisma.donation.findMany({
                where: {
                    deletedAt: null,
                    donationDate: { lt: oneEightyDaysAgo },
                },
                select: { donorId: true },
                distinct: ["donorId"],
            }),
            this.prisma.pledge.findMany({
                where: {
                    status: "PENDING",
                    isDeleted: false,
                    expectedFulfillmentDate: {
                        gte: now,
                        lte: sevenDaysFromNow,
                    },
                },
                include: {
                    donor: {
                        select: { id: true, firstName: true, lastName: true },
                    },
                },
            }),
        ]);
        const recentlyContactedIds = new Set([
            ...recentLogDonorIds.map((l) => l.donorId),
            ...recentMsgDonorIds.filter((m) => m.donorId).map((m) => m.donorId),
        ]);
        const followUpCount = Math.max(0, totalDonorCount - recentlyContactedIds.size);
        const top10PctCount = Math.max(1, Math.ceil(donationsByDonor.length * 0.1));
        const highValueDonorEntries = donationsByDonor.slice(0, top10PctCount);
        const highValueTotal = highValueDonorEntries.reduce((sum, d) => sum + (d._sum.donationAmount?.toNumber() || 0), 0);
        const highValueDonorIds = highValueDonorEntries.map((d) => d.donorId);
        const recentDonorIds = new Set(donorsWithRecentDonation.map((d) => d.donorId));
        const dormantDonorIds = donorsWithOlderDonation
            .map((d) => d.donorId)
            .filter((id) => !recentDonorIds.has(id));
        const [followUpDonorSample, dormantDonorDetails, highValueDonorNames] = await Promise.all([
            followUpCount > 0
                ? this.prisma.donor.findMany({
                    where: {
                        deletedAt: null,
                        id: { notIn: Array.from(recentlyContactedIds) },
                    },
                    select: { id: true, firstName: true, lastName: true },
                    take: 5,
                })
                : Promise.resolve([]),
            dormantDonorIds.length > 0
                ? this.prisma.donor.findMany({
                    where: { id: { in: dormantDonorIds.slice(0, 5) }, deletedAt: null },
                    select: { id: true, firstName: true, lastName: true },
                })
                : Promise.resolve([]),
            highValueDonorIds.length > 0
                ? this.prisma.donor.findMany({
                    where: { id: { in: highValueDonorIds } },
                    select: { id: true, firstName: true, lastName: true },
                })
                : Promise.resolve([]),
        ]);
        cards.push({
            key: "follow_up_needed",
            title: "Donors Needing Follow-up",
            count: followUpCount,
            description: followUpCount > 0
                ? `${followUpCount} donor(s) haven't been contacted in over 30 days or never contacted.`
                : "All donors have been contacted recently.",
            type: "warning",
            details: followUpDonorSample.map((d) => ({
                name: `${d.firstName} ${d.lastName || ""}`.trim(),
                id: d.id,
                extra: "No contact in 30+ days",
            })),
        });
        cards.push({
            key: "high_value",
            title: "High Value Donors",
            count: highValueDonorEntries.length,
            description: `Top 10% of donors contributed ₹${highValueTotal.toLocaleString("en-IN")} this financial year.`,
            type: "positive",
            details: highValueDonorNames.slice(0, 5).map((d) => ({
                name: `${d.firstName} ${d.lastName || ""}`.trim(),
                id: d.id,
            })),
        });
        cards.push({
            key: "dormant",
            title: "Dormant Donors",
            count: dormantDonorIds.length,
            description: dormantDonorIds.length > 0
                ? `${dormantDonorIds.length} donor(s) have not donated in the last 6 months but had previous donations.`
                : "No dormant donors detected.",
            type: "info",
            details: dormantDonorDetails.map((d) => ({
                name: `${d.firstName} ${d.lastName || ""}`.trim(),
                id: d.id,
                extra: "No donation in 180+ days",
            })),
        });
        const pledgeTotalAmount = pledgesDueThisWeek.reduce((sum, p) => sum + (p.amount?.toNumber() || 0), 0);
        cards.push({
            key: "pledges_due",
            title: "Pledges Due This Week",
            count: pledgesDueThisWeek.length,
            description: pledgesDueThisWeek.length > 0
                ? `${pledgesDueThisWeek.length} pledge(s) worth ₹${pledgeTotalAmount.toLocaleString("en-IN")} due within 7 days.`
                : "No pledges due this week.",
            type: "urgent",
            details: pledgesDueThisWeek.slice(0, 5).map((p) => ({
                name: `${p.donor.firstName} ${p.donor.lastName || ""}`.trim(),
                id: p.donor.id,
                extra: `₹${p.amount?.toNumber().toLocaleString("en-IN") || "0"} due ${new Date(p.expectedFulfillmentDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`,
            })),
        });
        this.setCached("insight_cards", cards);
        this.logger.log(`getInsightCards() completed in ${Date.now() - start}ms`);
        return cards;
    }
};
exports.DashboardInsightsService = DashboardInsightsService;
exports.DashboardInsightsService = DashboardInsightsService = DashboardInsightsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DashboardInsightsService);
//# sourceMappingURL=dashboard.insights.service.js.map