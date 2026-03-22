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
exports.SpecialDaysProcessor = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const email_service_1 = require("../../email/email.service");
let SpecialDaysProcessor = class SpecialDaysProcessor {
    constructor(prisma, emailService) {
        this.prisma = prisma;
        this.emailService = emailService;
    }
    async process() {
        const result = {
            queued: 0,
            sent: 0,
            failed: 0,
            errors: []
        };
        const donors = await this.prisma.donor.findMany({
            where: {
                isDeleted: false,
                prefReminders: true,
                prefEmail: true
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                personalEmail: true,
                officialEmail: true,
                specialOccasions: true,
            },
        });
        for (const donor of donors) {
            const email = donor.personalEmail ||
                donor.officialEmail;
            if (!email)
                continue;
        }
        return result;
    }
};
exports.SpecialDaysProcessor = SpecialDaysProcessor;
exports.SpecialDaysProcessor = SpecialDaysProcessor = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        email_service_1.EmailService])
], SpecialDaysProcessor);
//# sourceMappingURL=special-days.processor.js.map