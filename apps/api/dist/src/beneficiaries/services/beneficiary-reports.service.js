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
exports.BeneficiaryReportsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let BeneficiaryReportsService = class BeneficiaryReportsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getReportCampaigns() {
        return this.prisma.reportCampaign.findMany({
            include: {
                createdBy: { select: { id: true, name: true } },
            },
            orderBy: { createdAt: "desc" },
        });
    }
    async createReportCampaign(user, dto) {
        return this.prisma.reportCampaign.create({
            data: {
                ...dto,
                createdById: user.id,
            },
        });
    }
    async exportToExcel(user) {
        return this.prisma.beneficiary.findMany({
            where: { isDeleted: false },
            select: {
                id: true,
                code: true,
                fullName: true,
                homeType: true,
                category: true,
                gender: true,
                dobDay: true,
                dobMonth: true,
                dobYear: true,
                approxAge: true,
                joinDate: true,
                heightCmAtJoin: true,
                weightKgAtJoin: true,
                educationClassOrRole: true,
                schoolOrCollege: true,
                healthNotes: true,
                currentHealthStatus: true,
                background: true,
                hobbies: true,
                dreamCareer: true,
                favouriteSubject: true,
                favouriteGame: true,
                favouriteActivityAtHome: true,
                bestFriend: true,
                sourceOfPrideOrHappiness: true,
                funFact: true,
                additionalNotes: true,
                protectPrivacy: true,
                photoUrl: true,
                photoPath: true,
                status: true,
                createdById: true,
                isDeleted: true,
                deletedAt: true,
                createdAt: true,
                updatedAt: true,
            },
        });
    }
    async queueReportCampaignEmails(user, campaignId) {
        return { status: "queued", campaignId };
    }
};
exports.BeneficiaryReportsService = BeneficiaryReportsService;
exports.BeneficiaryReportsService = BeneficiaryReportsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], BeneficiaryReportsService);
//# sourceMappingURL=beneficiary-reports.service.js.map