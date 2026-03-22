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
var ReportCampaignsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportCampaignsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const email_jobs_service_1 = require("../email-jobs/email-jobs.service");
const organization_profile_service_1 = require("../organization-profile/organization-profile.service");
let ReportCampaignsService = ReportCampaignsService_1 = class ReportCampaignsService {
    constructor(prisma, emailJobsService, orgProfileService) {
        this.prisma = prisma;
        this.emailJobsService = emailJobsService;
        this.orgProfileService = orgProfileService;
        this.logger = new common_1.Logger(ReportCampaignsService_1.name);
    }
    async findAll() {
        return this.prisma.reportCampaign.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                createdBy: { select: { id: true, name: true } },
                document: { select: { id: true, title: true, storagePath: true, mimeType: true } },
            },
        });
    }
    async findOne(id) {
        const campaign = await this.prisma.reportCampaign.findUnique({
            where: { id },
            include: {
                createdBy: { select: { id: true, name: true } },
                document: { select: { id: true, title: true, storagePath: true, mimeType: true } },
            },
        });
        if (!campaign)
            throw new common_1.NotFoundException('Campaign not found');
        return campaign;
    }
    async create(dto, user) {
        if (dto.target === 'CUSTOM' && (!dto.customDonorIds || dto.customDonorIds.length === 0)) {
            throw new common_1.BadRequestException('Please select at least one donor for custom audience');
        }
        return this.prisma.reportCampaign.create({
            data: {
                name: dto.name,
                type: dto.type,
                periodStart: new Date(dto.periodStart),
                periodEnd: new Date(dto.periodEnd),
                target: dto.target,
                customDonorIds: dto.customDonorIds || [],
                notes: dto.notes || null,
                status: 'DRAFT',
                createdById: user.userId,
            },
            include: {
                createdBy: { select: { id: true, name: true } },
                document: { select: { id: true, title: true, storagePath: true, mimeType: true } },
            },
        });
    }
    async attachDocument(campaignId, documentData, user) {
        const campaign = await this.prisma.reportCampaign.findUnique({ where: { id: campaignId } });
        if (!campaign)
            throw new common_1.NotFoundException('Campaign not found');
        if (campaign.status !== 'DRAFT')
            throw new common_1.BadRequestException('Can only attach documents to draft campaigns');
        const document = await this.prisma.document.create({
            data: {
                ownerType: 'ORGANIZATION',
                docType: 'OTHER',
                title: documentData.title,
                storageBucket: documentData.storageBucket,
                storagePath: documentData.storagePath,
                mimeType: documentData.mimeType,
                sizeBytes: documentData.sizeBytes,
                isSensitive: false,
                shareWithDonor: true,
                createdById: user.userId,
            },
        });
        const updated = await this.prisma.reportCampaign.update({
            where: { id: campaignId },
            data: { documentId: document.id },
            include: {
                createdBy: { select: { id: true, name: true } },
                document: { select: { id: true, title: true, storagePath: true, mimeType: true } },
            },
        });
        this.logger.log(`Document attached to campaign ${campaignId}: ${document.id}`);
        return updated;
    }
    async send(campaignId, user) {
        const campaign = await this.prisma.reportCampaign.findUnique({
            where: { id: campaignId },
            include: {
                document: { select: { id: true, title: true, storagePath: true } },
            },
        });
        if (!campaign)
            throw new common_1.NotFoundException('Campaign not found');
        if (campaign.status === 'SENT')
            throw new common_1.BadRequestException('Campaign has already been sent');
        if (!campaign.document)
            throw new common_1.BadRequestException('Please attach a report document before sending');
        const donors = await this.getTargetDonors(campaign.target, campaign.customDonorIds);
        if (donors.length === 0) {
            throw new common_1.BadRequestException('No donors found for the selected target audience');
        }
        const orgProfile = await this.orgProfileService.getProfile();
        const orgName = orgProfile.name;
        const reportUrl = campaign.document.storagePath;
        const periodLabel = this.formatPeriodLabel(campaign);
        await this.prisma.reportCampaign.update({
            where: { id: campaignId },
            data: { status: 'QUEUED' },
        });
        let emailCount = 0;
        const scheduledAt = new Date(Date.now() + 60000);
        for (const donor of donors) {
            const toEmail = donor.personalEmail || donor.officialEmail;
            if (!toEmail)
                continue;
            const donorName = [donor.firstName, donor.lastName].filter(Boolean).join(' ');
            const subject = `${campaign.name} - ${orgName}`;
            const body = this.buildEmailBody(donorName, orgName, campaign.name, periodLabel, reportUrl, campaign.document.title);
            const emailJobDto = {
                donorId: donor.id,
                toEmail,
                subject,
                body,
                type: 'REPORT_CAMPAIGN',
                relatedId: campaignId,
                scheduledAt,
            };
            try {
                await this.emailJobsService.create(emailJobDto);
                emailCount++;
                await this.prisma.outboundMessageLog.create({
                    data: {
                        type: 'REPORT_CAMPAIGN',
                        channel: 'EMAIL',
                        donorId: donor.id,
                        beneficiaryIds: [],
                        status: 'QUEUED',
                        createdById: user.userId,
                    },
                });
            }
            catch (err) {
                this.logger.warn(`Failed to queue email for donor ${donor.id}: ${err.message}`);
            }
        }
        await this.prisma.reportCampaign.update({
            where: { id: campaignId },
            data: {
                status: 'SENT',
                emailsSent: emailCount,
                sentAt: new Date(),
            },
        });
        this.logger.log(`Campaign ${campaignId} sent: ${emailCount} emails queued`);
        return {
            success: true,
            message: `Report emails queued for ${emailCount} donor${emailCount !== 1 ? 's' : ''}`,
            emailCount,
        };
    }
    async getWhatsAppText(campaignId) {
        const campaign = await this.prisma.reportCampaign.findUnique({
            where: { id: campaignId },
            include: {
                document: { select: { id: true, title: true, storagePath: true } },
            },
        });
        if (!campaign)
            throw new common_1.NotFoundException('Campaign not found');
        const orgProfile = await this.orgProfileService.getProfile();
        const orgName = orgProfile.name;
        const periodLabel = this.formatPeriodLabel(campaign);
        const reportUrl = campaign.document?.storagePath || '';
        const text = [
            `Dear Donor,`,
            ``,
            `Greetings from ${orgName}!`,
            ``,
            `We are pleased to share our ${campaign.name} covering the period ${periodLabel}.`,
            ``,
            reportUrl ? `You can view/download the report here:` : '',
            reportUrl || '',
            ``,
            `Thank you for your continued support and generosity.`,
            ``,
            `With gratitude,`,
            orgName,
        ].filter((line) => line !== undefined).join('\n');
        return { text, reportUrl };
    }
    async markWhatsAppSent(campaignId, donorId, user) {
        const campaign = await this.prisma.reportCampaign.findUnique({ where: { id: campaignId } });
        if (!campaign)
            throw new common_1.NotFoundException('Campaign not found');
        await this.prisma.outboundMessageLog.create({
            data: {
                type: 'REPORT_CAMPAIGN',
                channel: 'WHATSAPP',
                donorId,
                beneficiaryIds: [],
                status: 'COPIED',
                createdById: user.userId,
            },
        });
        return { success: true };
    }
    async searchDonors(query) {
        if (!query || query.length < 2)
            return [];
        return this.prisma.donor.findMany({
            where: {
                isDeleted: false,
                OR: [
                    { firstName: { contains: query, mode: 'insensitive' } },
                    { lastName: { contains: query, mode: 'insensitive' } },
                    { donorCode: { contains: query, mode: 'insensitive' } },
                    { personalEmail: { contains: query, mode: 'insensitive' } },
                ],
            },
            select: {
                id: true,
                donorCode: true,
                firstName: true,
                lastName: true,
                personalEmail: true,
                officialEmail: true,
            },
            take: 20,
            orderBy: { firstName: 'asc' },
        });
    }
    async getCampaignDonors(campaignId) {
        const campaign = await this.prisma.reportCampaign.findUnique({
            where: { id: campaignId },
            select: { customDonorIds: true },
        });
        if (!campaign)
            throw new common_1.NotFoundException('Campaign not found');
        if (campaign.customDonorIds.length === 0)
            return [];
        return this.prisma.donor.findMany({
            where: { id: { in: campaign.customDonorIds }, isDeleted: false },
            select: {
                id: true,
                donorCode: true,
                firstName: true,
                lastName: true,
                personalEmail: true,
                officialEmail: true,
            },
        });
    }
    async getTargetDonors(target, customDonorIds = []) {
        if (target === 'CUSTOM' && customDonorIds.length > 0) {
            return this.prisma.donor.findMany({
                where: { id: { in: customDonorIds }, isDeleted: false },
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    personalEmail: true,
                    officialEmail: true,
                    whatsappPhone: true,
                },
            });
        }
        const where = { isDeleted: false };
        if (target === 'SPONSORS_ONLY') {
            where.sponsorships = {
                some: { isActive: true, status: 'ACTIVE' },
            };
        }
        return this.prisma.donor.findMany({
            where,
            select: {
                id: true,
                firstName: true,
                lastName: true,
                personalEmail: true,
                officialEmail: true,
                whatsappPhone: true,
            },
        });
    }
    formatPeriodLabel(campaign) {
        const start = new Date(campaign.periodStart);
        const end = new Date(campaign.periodEnd);
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${months[start.getMonth()]} ${start.getFullYear()} - ${months[end.getMonth()]} ${end.getFullYear()}`;
    }
    buildEmailBody(donorName, orgName, campaignName, periodLabel, reportUrl, documentTitle) {
        return `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
  <p>Dear <strong>${donorName}</strong>,</p>
  <p>Greetings from <strong>${orgName}</strong>!</p>
  <p>We are pleased to share our <strong>${campaignName}</strong> covering the period <strong>${periodLabel}</strong>.</p>
  <p>This report highlights the impact of your generous contributions and the progress made by our beneficiaries.</p>
  <div style="text-align:center;margin:24px 0;">
    <a href="${reportUrl}" style="display:inline-block;padding:12px 24px;background-color:#2E7D5A;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:bold;">
      View Report: ${documentTitle}
    </a>
  </div>
  <p>Thank you for your continued support and generosity. Together, we are making a real difference.</p>
  <p>With warm regards,<br/><strong>${orgName}</strong></p>
</div>`;
    }
};
exports.ReportCampaignsService = ReportCampaignsService;
exports.ReportCampaignsService = ReportCampaignsService = ReportCampaignsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        email_jobs_service_1.EmailJobsService,
        organization_profile_service_1.OrganizationProfileService])
], ReportCampaignsService);
//# sourceMappingURL=report-campaigns.service.js.map