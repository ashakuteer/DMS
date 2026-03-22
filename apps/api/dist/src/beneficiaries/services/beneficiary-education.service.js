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
exports.BeneficiaryEducationService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let BeneficiaryEducationService = class BeneficiaryEducationService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getProgressCards(beneficiaryId) {
        return this.prisma.progressCard.findMany({
            where: { beneficiaryId },
            include: {
                createdBy: { select: { id: true, name: true } },
            },
            orderBy: [{ academicYear: "desc" }],
        });
    }
    async addProgressCard(user, beneficiaryId, dto) {
        return this.prisma.progressCard.create({
            data: {
                ...dto,
                beneficiaryId,
                createdById: user.id,
            },
        });
    }
    async getEducationTimeline(beneficiaryId) {
        return this.prisma.progressCard.findMany({
            where: { beneficiaryId },
            orderBy: { academicYear: "desc" },
        });
    }
    async exportEducationSummaryPdf(beneficiaryId) {
        return this.getProgressCards(beneficiaryId);
    }
};
exports.BeneficiaryEducationService = BeneficiaryEducationService;
exports.BeneficiaryEducationService = BeneficiaryEducationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], BeneficiaryEducationService);
//# sourceMappingURL=beneficiary-education.service.js.map