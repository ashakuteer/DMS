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
exports.DuplicatesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let DuplicatesService = class DuplicatesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async detectDuplicatesInBatch(rows, mapping) {
        const phones = [];
        const emails = [];
        rows.forEach((row) => {
            if (mapping["primaryPhone"] && row[mapping["primaryPhone"]]) {
                phones.push(row[mapping["primaryPhone"]]);
            }
            if (mapping["personalEmail"] && row[mapping["personalEmail"]]) {
                emails.push(row[mapping["personalEmail"]]);
            }
        });
        const donors = await this.prisma.donor.findMany({
            where: {
                OR: [
                    { primaryPhone: { in: phones } },
                    { personalEmail: { in: emails } },
                ],
            },
            select: {
                id: true,
                firstName: true,
                primaryPhone: true,
                personalEmail: true,
            },
        });
        return donors;
    }
};
exports.DuplicatesService = DuplicatesService;
exports.DuplicatesService = DuplicatesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DuplicatesService);
//# sourceMappingURL=donor-duplicates.service.js.map