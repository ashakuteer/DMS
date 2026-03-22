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
exports.DonorsEngagementService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const donors_types_1 = require("./donors.types");
let DonorsEngagementService = class DonorsEngagementService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async computeEngagementScores(donorIds) {
        if (!donorIds.length)
            return {};
        const CHUNK_SIZE = 100;
        const results = {};
        for (let i = 0; i < donorIds.length; i += CHUNK_SIZE) {
            const chunk = donorIds.slice(i, i + CHUNK_SIZE);
            const chunkResults = await this.computeEngagementScoresChunk(chunk);
            Object.assign(results, chunkResults);
        }
        return results;
    }
    async computeEngagementScoresChunk(donorIds) {
        if (!donorIds.length)
            return {};
        const now = new Date();
        const oneYearAgo = new Date(now);
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        const results = {};
        const [donations, pledges, sponsorships] = await Promise.all([
            this.prisma.donation.findMany({
                where: { donorId: { in: donorIds }, isDeleted: false },
                select: { donorId: true, donationDate: true, donationAmount: true },
                orderBy: [{ donorId: "asc" }, { donationDate: "desc" }],
            }),
            this.prisma.pledge.findMany({
                where: {
                    donorId: { in: donorIds },
                    isDeleted: false,
                    status: { in: ["PENDING", "POSTPONED"] },
                },
                select: { donorId: true, expectedFulfillmentDate: true },
            }),
            this.prisma.sponsorship.findMany({
                where: { donorId: { in: donorIds } },
                select: { donorId: true, status: true },
            }),
        ]);
        const donationsByDonor = {};
        const pledgesByDonor = {};
        const sponsorsByDonor = {};
        for (const d of donations) {
            (donationsByDonor[d.donorId] ??= []).push(d);
        }
        for (const p of pledges) {
            (pledgesByDonor[p.donorId] ??= []).push(p);
        }
        for (const s of sponsorships) {
            (sponsorsByDonor[s.donorId] ??= []).push(s);
        }
        for (const donorId of donorIds) {
            const donorDonations = donationsByDonor[donorId] || [];
            const donorPledges = pledgesByDonor[donorId] || [];
            const donorSponsorships = sponsorsByDonor[donorId] || [];
            let score = 100;
            const reasons = [];
            const lastDonation = donorDonations[0];
            if (!lastDonation) {
                score -= 30;
                reasons.push("No donations recorded");
            }
            else {
                const lastDate = new Date(lastDonation.donationDate);
                const daysSince = Math.ceil((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
                if (daysSince > 365) {
                    score -= 35;
                    reasons.push(`No donation in ${daysSince} days`);
                }
                else if (daysSince > 180) {
                    score -= 25;
                }
                else if (daysSince > 120) {
                    score -= 20;
                }
                else if (daysSince > 60) {
                    score -= 10;
                }
            }
            const count12Mo = donorDonations.filter((d) => d.donationDate >= oneYearAgo).length;
            if (count12Mo === 0 && donorDonations.length > 0) {
                score -= 15;
            }
            else if (count12Mo >= 4) {
                score += 10;
            }
            else if (count12Mo >= 2) {
                score += 5;
            }
            const ltv = donorDonations.reduce((sum, d) => sum + Number(d.donationAmount || 0), 0);
            if (ltv > 100000) {
                score += 10;
            }
            else if (ltv > 50000) {
                score += 5;
            }
            if (donorSponsorships.some((s) => s.status === "ACTIVE")) {
                score += 10;
            }
            const overdue = donorPledges.filter((p) => p.expectedFulfillmentDate && p.expectedFulfillmentDate < now);
            if (overdue.length >= 3) {
                score -= 25;
                reasons.push(`${overdue.length} pledges overdue`);
            }
            else if (overdue.length >= 1) {
                score -= 10 * overdue.length;
            }
            score = Math.max(0, Math.min(100, score));
            const status = score >= 60
                ? donors_types_1.HealthStatus.GREEN
                : score >= 35
                    ? donors_types_1.HealthStatus.YELLOW
                    : donors_types_1.HealthStatus.RED;
            results[donorId] = { score, status, reasons };
        }
        return results;
    }
};
exports.DonorsEngagementService = DonorsEngagementService;
exports.DonorsEngagementService = DonorsEngagementService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DonorsEngagementService);
//# sourceMappingURL=donors.engagement.service.js.map