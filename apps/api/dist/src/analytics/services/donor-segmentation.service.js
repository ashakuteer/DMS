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
exports.DonorSegmentationService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let DonorSegmentationService = class DonorSegmentationService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getDonorSegmentation() {
        const rows = await this.prisma.$queryRaw `
      SELECT
        CASE
          WHEN total >= 100000 THEN 'champion'
          WHEN total >= 50000  THEN 'major'
          WHEN total >= 10000  THEN 'active'
          ELSE 'small'
        END AS band,
        COUNT(*) AS cnt
      FROM (
        SELECT "donorId", SUM("donationAmount") AS total
        FROM donations
        WHERE "isDeleted" = false
        GROUP BY "donorId"
      ) t
      GROUP BY band
    `;
        let championDonors = 0;
        let majorDonors = 0;
        let activeDonors = 0;
        let smallDonors = 0;
        for (const row of rows) {
            const count = Number(row.cnt);
            if (row.band === 'champion')
                championDonors = count;
            else if (row.band === 'major')
                majorDonors = count;
            else if (row.band === 'active')
                activeDonors = count;
            else
                smallDonors = count;
        }
        return {
            championDonors,
            majorDonors,
            activeDonors,
            smallDonors,
            total: championDonors + majorDonors + activeDonors + smallDonors,
        };
    }
};
exports.DonorSegmentationService = DonorSegmentationService;
exports.DonorSegmentationService = DonorSegmentationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DonorSegmentationService);
//# sourceMappingURL=donor-segmentation.service.js.map