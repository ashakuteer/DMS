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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var EmailJobsController_1;
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailJobsController = void 0;
const common_1 = require("@nestjs/common");
const email_jobs_service_1 = require("./email-jobs.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const organization_profile_service_1 = require("../organization-profile/organization-profile.service");
const communication_log_service_1 = require("../communication-log/communication-log.service");
const email_service_1 = require("../email/email.service");
let EmailJobsController = EmailJobsController_1 = class EmailJobsController {
    constructor(emailJobsService, prisma, orgProfileService, communicationLogService, emailService) {
        this.emailJobsService = emailJobsService;
        this.prisma = prisma;
        this.orgProfileService = orgProfileService;
        this.communicationLogService = communicationLogService;
        this.emailService = emailService;
        this.logger = new common_1.Logger(EmailJobsController_1.name);
    }
    async findAll(status, type, startDate, endDate, page, limit) {
        const filters = {
            status,
            type,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
            page: page ? parseInt(page, 10) : 1,
            limit: limit ? parseInt(limit, 10) : 50,
        };
        return this.emailJobsService.findAll(filters);
    }
    async getStats() {
        return this.emailJobsService.getStats();
    }
    async retry(id) {
        return this.emailJobsService.retryFailed(id);
    }
    async delete(id) {
        return this.emailJobsService.delete(id);
    }
    async queueEmail(user, body) {
        try {
            const org = await this.orgProfileService.getProfile();
            if (!this.emailService.isConfigured()) {
                const configStatus = this.emailService.getConfigStatus();
                throw new common_1.HttpException(`Email not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS environment variables. ${configStatus.error || ''}`, common_1.HttpStatus.BAD_REQUEST);
            }
            const featureType = body.type === 'special_day' ? 'SPECIALDAY' : 'PLEDGE';
            this.logger.log(`[${featureType}] Queueing email for donor ${body.donorId}, SMTP_USER: ${this.emailService.getSmtpUser()}`);
            const donor = await this.prisma.donor.findUnique({
                where: { id: body.donorId },
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    personalEmail: true,
                    officialEmail: true,
                    prefEmail: true,
                },
            });
            if (!donor) {
                throw new common_1.HttpException('Donor not found', common_1.HttpStatus.NOT_FOUND);
            }
            const email = donor.prefEmail
                ? (donor.personalEmail || donor.officialEmail)
                : (donor.officialEmail || donor.personalEmail);
            if (!email) {
                throw new common_1.HttpException('No email address on file for this donor', common_1.HttpStatus.BAD_REQUEST);
            }
            const donorName = `${donor.firstName}${donor.lastName ? ' ' + donor.lastName : ''}`;
            let subject = '';
            let emailBody = '';
            let emailJobType;
            let relatedId = '';
            if (body.type === 'special_day') {
                emailJobType = 'SPECIAL_DAY';
                const occasionLabel = this.getOccasionLabel(body.occasionType || '');
                const personName = body.relatedPersonName || donorName;
                subject = `${occasionLabel} Wishes from ${org.name}`;
                emailBody = this.getSpecialDayEmailBody(body.occasionType || '', personName, donorName, org.name);
                relatedId = `${body.occasionType || 'special'}_${body.donorId}_${new Date().toISOString().split('T')[0]}`;
            }
            else if (body.type === 'pledge') {
                emailJobType = 'PLEDGE_REMINDER';
                if (body.pledgeId) {
                    const pledge = await this.prisma.pledge.findUnique({
                        where: { id: body.pledgeId },
                    });
                    if (pledge && pledge.donorId !== body.donorId) {
                        throw new common_1.HttpException('Pledge does not belong to this donor', common_1.HttpStatus.BAD_REQUEST);
                    }
                    relatedId = body.pledgeId;
                    const pledgeDesc = pledge?.quantity ||
                        (pledge?.amount ? `₹${Number(pledge.amount).toLocaleString('en-IN')}` : 'your pledge');
                    subject = `Reminder: Your Pledge to ${org.name}`;
                    emailBody = `<p>Dear ${donorName},</p>
<p>This is a gentle reminder about your pledge of ${pledgeDesc} to ${org.name}.</p>
<p>Your continued support helps us make a positive impact in the lives of those we serve. We truly appreciate your commitment to our mission.</p>
<p>If you have already fulfilled this pledge, please disregard this message.</p>
<p>With heartfelt gratitude,<br/>${org.name}</p>`;
                }
                else {
                    subject = `Reminder: Your Pledge to ${org.name}`;
                    emailBody = `<p>Dear ${donorName},</p>
<p>This is a gentle reminder about your pledge to ${org.name}.</p>
<p>Your continued support helps us make a positive impact in the lives of those we serve.</p>
<p>With heartfelt gratitude,<br/>${org.name}</p>`;
                    relatedId = `pledge_${body.donorId}_${new Date().toISOString().split('T')[0]}`;
                }
            }
            else {
                throw new common_1.HttpException('Invalid email type', common_1.HttpStatus.BAD_REQUEST);
            }
            const job = await this.emailJobsService.create({
                donorId: donor.id,
                toEmail: email,
                subject,
                body: emailBody,
                type: emailJobType,
                relatedId,
                scheduledAt: new Date(),
            });
            await this.communicationLogService.create({
                donorId: donor.id,
                channel: 'EMAIL',
                type: body.type === 'special_day' ? 'GREETING' : 'FOLLOW_UP',
                status: 'TRIGGERED',
                recipient: email,
                subject,
                messagePreview: emailBody.replace(/<[^>]*>/g, '').substring(0, 200),
                sentById: user.id,
            });
            return {
                success: true,
                message: `Email queued for ${donorName}`,
                jobId: job.id,
            };
        }
        catch (error) {
            if (error instanceof common_1.HttpException)
                throw error;
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';
            throw new common_1.HttpException(`Failed to queue email: ${errorMsg}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    getOccasionLabel(occasionType) {
        const labels = {
            DOB_SELF: 'Birthday',
            DOB_SPOUSE: 'Birthday',
            DOB_CHILD: 'Birthday',
            ANNIVERSARY: 'Anniversary',
            DEATH_ANNIVERSARY: 'Memorial',
            OTHER: 'Special Day',
        };
        return labels[occasionType] || 'Special Day';
    }
    getSpecialDayEmailBody(occasionType, personName, donorName, orgName) {
        switch (occasionType) {
            case 'DOB_SELF':
                return `<p>Dear ${donorName},</p>
<p>Wishing you a wonderful Birthday! May this special day bring you joy, happiness, and all your heart's desires.</p>
<p>Thank you for being a part of the ${orgName} family. Your support continues to make a difference in the lives of many.</p>
<p>With warm wishes,<br/>${orgName}</p>`;
            case 'DOB_SPOUSE':
            case 'DOB_CHILD':
                return `<p>Dear ${donorName},</p>
<p>Wishing ${personName} a very Happy Birthday! May this special day be filled with joy and cherished moments.</p>
<p>Thank you for your continued support of ${orgName}.</p>
<p>With warm wishes,<br/>${orgName}</p>`;
            case 'ANNIVERSARY':
                return `<p>Dear ${donorName},</p>
<p>Wishing you a very Happy Anniversary! May your bond continue to grow stronger with each passing year.</p>
<p>Thank you for your continued support of ${orgName}.</p>
<p>With warm wishes,<br/>${orgName}</p>`;
            case 'DEATH_ANNIVERSARY':
                return `<p>Dear ${donorName},</p>
<p>On this day, we hold you and your family in our thoughts and prayers. May you find comfort in cherished memories.</p>
<p>With heartfelt condolences,<br/>${orgName}</p>`;
            default:
                return `<p>Dear ${donorName},</p>
<p>Wishing you a wonderful day from all of us at ${orgName}.</p>
<p>Thank you for your continued support.</p>
<p>With warm wishes,<br/>${orgName}</p>`;
        }
    }
};
exports.EmailJobsController = EmailJobsController;
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.STAFF),
    __param(0, (0, common_1.Query)('status')),
    __param(1, (0, common_1.Query)('type')),
    __param(2, (0, common_1.Query)('startDate')),
    __param(3, (0, common_1.Query)('endDate')),
    __param(4, (0, common_1.Query)('page')),
    __param(5, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_a = typeof client_1.EmailJobStatus !== "undefined" && client_1.EmailJobStatus) === "function" ? _a : Object, typeof (_b = typeof client_1.EmailJobType !== "undefined" && client_1.EmailJobType) === "function" ? _b : Object, String, String, String, String]),
    __metadata("design:returntype", Promise)
], EmailJobsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], EmailJobsController.prototype, "getStats", null);
__decorate([
    (0, common_1.Post)(':id/retry'),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], EmailJobsController.prototype, "retry", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], EmailJobsController.prototype, "delete", null);
__decorate([
    (0, common_1.Post)('queue'),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.STAFF),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], EmailJobsController.prototype, "queueEmail", null);
exports.EmailJobsController = EmailJobsController = EmailJobsController_1 = __decorate([
    (0, common_1.Controller)('email-jobs'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [email_jobs_service_1.EmailJobsService,
        prisma_service_1.PrismaService,
        organization_profile_service_1.OrganizationProfileService,
        communication_log_service_1.CommunicationLogService,
        email_service_1.EmailService])
], EmailJobsController);
//# sourceMappingURL=email-jobs.controller.js.map