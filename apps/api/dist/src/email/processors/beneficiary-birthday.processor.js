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
exports.BeneficiaryBirthdayProcessor = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const email_service_1 = require("../../email/email.service");
const beneficiary_birthday_template_1 = require("../templates/beneficiary-birthday.template");
let BeneficiaryBirthdayProcessor = class BeneficiaryBirthdayProcessor {
    constructor(prisma, emailService) {
        this.prisma = prisma;
        this.emailService = emailService;
    }
    async process() {
        const result = { queued: 0, sent: 0, failed: 0, errors: [] };
        const beneficiaries = await this.prisma.beneficiary.findMany({
            select: {
                id: true,
                fullName: true,
                dobMonth: true,
                dobDay: true,
                homeType: true,
                isDeleted: true,
                status: true,
                sponsorships: {
                    select: {
                        id: true,
                        isActive: true,
                        status: true,
                        donor: {
                            select: {
                                id: true,
                                firstName: true,
                                personalEmail: true,
                                officialEmail: true,
                            },
                        },
                    },
                },
            },
        });
        for (const beneficiary of beneficiaries) {
            for (const sponsorship of beneficiary.sponsorships) {
                const donor = sponsorship.donor;
                const email = donor.personalEmail || donor.officialEmail;
                if (!email)
                    continue;
                const { subject, body } = (0, beneficiary_birthday_template_1.getBeneficiaryBirthdayTemplate)(donor.firstName, beneficiary.fullName, "Home", "Doing well", 0, { name: "NGO" });
                await this.emailService.sendEmail({
                    to: email,
                    subject,
                    html: body
                });
                result.sent++;
            }
        }
        return result;
    }
};
exports.BeneficiaryBirthdayProcessor = BeneficiaryBirthdayProcessor;
exports.BeneficiaryBirthdayProcessor = BeneficiaryBirthdayProcessor = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        email_service_1.EmailService])
], BeneficiaryBirthdayProcessor);
//# sourceMappingURL=beneficiary-birthday.processor.js.map