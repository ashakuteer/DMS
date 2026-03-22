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
exports.SponsorshipReminderProcessor = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const email_service_1 = require("../../email/email.service");
const sponsorship_template_1 = require("../templates/sponsorship.template");
let SponsorshipReminderProcessor = class SponsorshipReminderProcessor {
    constructor(prisma, emailService) {
        this.prisma = prisma;
        this.emailService = emailService;
    }
    async process() {
        const result = { queued: 0, sent: 0, failed: 0, errors: [] };
        const sponsorships = await this.prisma.sponsorship.findMany({
            where: { isActive: true },
            include: { donor: true, beneficiary: true },
        });
        for (const s of sponsorships) {
            const donor = s.donor;
            const email = donor?.personalEmail || donor?.officialEmail;
            if (!email)
                continue;
            const { subject, body } = (0, sponsorship_template_1.getSponsorshipDueTemplate)(donor.firstName, s.beneficiary?.fullName ?? "Beneficiary", String(s.amount ?? 0), "Home", 0, { name: "NGO" });
            await this.emailService.sendEmail({
                to: email,
                subject,
                html: body,
            });
            result.sent++;
        }
        return result;
    }
};
exports.SponsorshipReminderProcessor = SponsorshipReminderProcessor;
exports.SponsorshipReminderProcessor = SponsorshipReminderProcessor = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        email_service_1.EmailService])
], SponsorshipReminderProcessor);
//# sourceMappingURL=sponsorship-reminder.processor.js.map