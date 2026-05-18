"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var BeneficiaryProgressReportsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BeneficiaryProgressReportsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const organization_profile_service_1 = require("../organization-profile/organization-profile.service");
const email_jobs_service_1 = require("../email-jobs/email-jobs.service");
const pdfkit_1 = __importDefault(require("pdfkit"));
const https = __importStar(require("https"));
const http = __importStar(require("http"));
let BeneficiaryProgressReportsService = BeneficiaryProgressReportsService_1 = class BeneficiaryProgressReportsService {
    constructor(prisma, emailJobsService, orgProfileService) {
        this.prisma = prisma;
        this.emailJobsService = emailJobsService;
        this.orgProfileService = orgProfileService;
        this.logger = new common_1.Logger(BeneficiaryProgressReportsService_1.name);
    }
    async generate(dto, user) {
        const beneficiary = await this.prisma.beneficiary.findUnique({
            where: { id: dto.beneficiaryId },
            select: {
                id: true, fullName: true, code: true, homeType: true, gender: true,
                approxAge: true, photoUrl: true, joinDate: true,
                educationClassOrRole: true, schoolOrCollege: true,
                currentHealthStatus: true, hobbies: true, dreamCareer: true,
                favouriteSubject: true, protectPrivacy: true,
            },
        });
        if (!beneficiary)
            throw new common_1.NotFoundException('Beneficiary not found');
        const periodStart = new Date(dto.periodStart);
        const periodEnd = new Date(dto.periodEnd);
        if (isNaN(periodStart.getTime()) || isNaN(periodEnd.getTime())) {
            throw new common_1.BadRequestException('Invalid date range');
        }
        const title = dto.title || `Progress Report - ${beneficiary.fullName} (${this.formatDateRange(periodStart, periodEnd)})`;
        const report = await this.prisma.beneficiaryProgressReport.create({
            data: {
                beneficiaryId: dto.beneficiaryId,
                title,
                periodStart,
                periodEnd,
                includePhotos: dto.includePhotos ?? true,
                includeHealth: dto.includeHealth ?? true,
                includeEducation: dto.includeEducation ?? true,
                includeUpdates: dto.includeUpdates ?? true,
                generatedById: user.id,
                status: 'GENERATING',
            },
        });
        try {
            const reportData = await this.aggregateData(dto.beneficiaryId, periodStart, periodEnd, {
                includePhotos: dto.includePhotos ?? true,
                includeHealth: dto.includeHealth ?? true,
                includeEducation: dto.includeEducation ?? true,
                includeUpdates: dto.includeUpdates ?? true,
            }, beneficiary);
            await this.prisma.beneficiaryProgressReport.update({
                where: { id: report.id },
                data: { reportData: reportData, status: 'READY' },
            });
            return { id: report.id, status: 'READY' };
        }
        catch (err) {
            this.logger.error(`Failed to generate progress report: ${err.message}`, err.stack);
            await this.prisma.beneficiaryProgressReport.update({
                where: { id: report.id },
                data: { status: 'FAILED' },
            });
            throw err;
        }
    }
    async aggregateData(beneficiaryId, periodStart, periodEnd, options, beneficiary) {
        const [healthEvents, metrics, progressCards, updates, sponsorships] = await Promise.all([
            options.includeHealth
                ? this.prisma.beneficiaryHealthEvent.findMany({
                    where: {
                        beneficiaryId,
                        eventDate: { gte: periodStart, lte: periodEnd },
                    },
                    orderBy: { eventDate: 'asc' },
                })
                : Promise.resolve([]),
            options.includeHealth
                ? this.prisma.beneficiaryMetric.findMany({
                    where: {
                        beneficiaryId,
                        recordedOn: { gte: periodStart, lte: periodEnd },
                    },
                    orderBy: { recordedOn: 'asc' },
                })
                : Promise.resolve([]),
            options.includeEducation
                ? this.prisma.progressCard.findMany({
                    where: {
                        beneficiaryId,
                        createdAt: { gte: periodStart, lte: periodEnd },
                    },
                    orderBy: { createdAt: 'asc' },
                })
                : Promise.resolve([]),
            options.includeUpdates
                ? this.prisma.beneficiaryUpdate.findMany({
                    where: {
                        beneficiaryId,
                        createdAt: { gte: periodStart, lte: periodEnd },
                        isPrivate: false,
                    },
                    orderBy: { createdAt: 'asc' },
                })
                : Promise.resolve([]),
            this.prisma.sponsorship.findMany({
                where: { beneficiaryId, isActive: true },
                include: { donor: { select: { firstName: true, lastName: true, donorCode: true } } },
            }),
        ]);
        const photos = [];
        if (options.includePhotos) {
            if (beneficiary.photoUrl && !beneficiary.protectPrivacy) {
                photos.push(beneficiary.photoUrl);
            }
            for (const u of updates) {
                if (u.mediaUrls?.length) {
                    photos.push(...u.mediaUrls);
                }
            }
        }
        return {
            beneficiary: {
                fullName: beneficiary.fullName,
                code: beneficiary.code,
                homeType: beneficiary.homeType,
                gender: beneficiary.gender,
                approxAge: beneficiary.approxAge,
                photoUrl: !beneficiary.protectPrivacy ? beneficiary.photoUrl : undefined,
                joinDate: beneficiary.joinDate?.toISOString(),
                educationClassOrRole: beneficiary.educationClassOrRole,
                schoolOrCollege: beneficiary.schoolOrCollege,
                currentHealthStatus: beneficiary.currentHealthStatus,
                hobbies: beneficiary.hobbies,
                dreamCareer: beneficiary.dreamCareer,
                favouriteSubject: beneficiary.favouriteSubject,
            },
            period: {
                start: periodStart.toISOString(),
                end: periodEnd.toISOString(),
                label: this.formatDateRange(periodStart, periodEnd),
            },
            healthEvents: healthEvents.map((e) => ({
                date: e.eventDate.toISOString(),
                title: e.title,
                description: e.description,
                severity: e.severity,
            })),
            healthMetrics: metrics.map((m) => ({
                date: m.recordedOn.toISOString(),
                heightCm: m.heightCm,
                weightKg: m.weightKg ? Number(m.weightKg) : undefined,
                healthStatus: m.healthStatus,
                notes: m.notes,
            })),
            progressCards: progressCards.map((p) => ({
                academicYear: p.academicYear,
                term: p.term,
                classGrade: p.classGrade,
                school: p.school,
                percentage: p.overallPercentage ? Number(p.overallPercentage) : undefined,
                remarks: p.remarks,
            })),
            updates: updates.map((u) => ({
                date: u.createdAt.toISOString(),
                type: u.updateType,
                title: u.title,
                content: u.content,
                mediaUrls: u.mediaUrls || [],
            })),
            sponsors: sponsorships.map((s) => ({
                name: `${s.donor.firstName} ${s.donor.lastName || ''}`.trim(),
                code: s.donor.donorCode,
            })),
            photos,
        };
    }
    async findAll(page = 1, limit = 20, filters) {
        const where = {};
        if (filters?.beneficiaryId)
            where.beneficiaryId = filters.beneficiaryId;
        const [items, total] = await Promise.all([
            this.prisma.beneficiaryProgressReport.findMany({
                where,
                include: {
                    beneficiary: { select: { fullName: true, code: true, homeType: true } },
                    generatedBy: { select: { name: true } },
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.beneficiaryProgressReport.count({ where }),
        ]);
        return { items, total, page, totalPages: Math.ceil(total / limit) };
    }
    async findOne(id) {
        const report = await this.prisma.beneficiaryProgressReport.findUnique({
            where: { id },
            include: {
                beneficiary: { select: { fullName: true, code: true, homeType: true, photoUrl: true } },
                generatedBy: { select: { name: true } },
            },
        });
        if (!report)
            throw new common_1.NotFoundException('Progress report not found');
        return report;
    }
    async generatePdf(id) {
        const report = await this.findOne(id);
        if (report.status !== 'READY' && report.status !== 'SHARED') {
            throw new common_1.BadRequestException('Report is not ready for download');
        }
        const data = report.reportData;
        if (!data)
            throw new common_1.BadRequestException('Report data missing');
        const orgProfile = await this.orgProfileService.getProfile();
        const orgName = orgProfile.name;
        const orgTagline = orgProfile.tagline1 || '';
        let profileImageBuffer = null;
        if (data.beneficiary.photoUrl && report.includePhotos) {
            try {
                profileImageBuffer = await this.fetchImageBuffer(data.beneficiary.photoUrl);
            }
            catch (e) {
                this.logger.warn(`Failed to fetch profile photo: ${e.message}`);
            }
        }
        return new Promise((resolve, reject) => {
            const doc = new pdfkit_1.default({ size: 'A4', margin: 50, bufferPages: true });
            const chunks = [];
            doc.on('data', (c) => chunks.push(c));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);
            const pageWidth = doc.page.width - 100;
            const primaryColor = orgProfile.brandingPrimaryColor || '#1a365d';
            const accentColor = '#2b6cb0';
            const lightBg = '#f7fafc';
            this.addWatermark(doc, orgName);
            doc.rect(50, 50, pageWidth, 80).fill(primaryColor);
            doc.fillColor('#ffffff').fontSize(20).font('Helvetica-Bold')
                .text(orgName, 60, 65, { width: pageWidth - 20 });
            if (orgTagline) {
                doc.fontSize(10).font('Helvetica').text(orgTagline, 60, 90, { width: pageWidth - 20 });
            }
            doc.fontSize(12).text('Beneficiary Progress Report', 60, 108, { width: pageWidth - 20, align: 'right' });
            let y = 150;
            doc.rect(50, y, pageWidth, profileImageBuffer ? 100 : 70).fill(lightBg);
            let textX = 60;
            if (profileImageBuffer) {
                try {
                    doc.image(profileImageBuffer, 60, y + 10, { width: 80, height: 80 });
                    textX = 155;
                }
                catch (e) {
                    this.logger.warn(`Failed to embed profile image: ${e.message}`);
                }
            }
            doc.fillColor(primaryColor).fontSize(16).font('Helvetica-Bold')
                .text(data.beneficiary.fullName, textX, y + 12, { width: pageWidth - textX + 40 });
            doc.fillColor('#4a5568').fontSize(9).font('Helvetica');
            const infoY = y + 32;
            doc.text(`Code: ${data.beneficiary.code}`, textX, infoY);
            doc.text(`Home: ${this.formatHomeType(data.beneficiary.homeType)}`, textX, infoY + 14);
            if (data.beneficiary.gender)
                doc.text(`Gender: ${data.beneficiary.gender}`, textX + 200, infoY);
            if (data.beneficiary.approxAge)
                doc.text(`Approx Age: ${data.beneficiary.approxAge}`, textX + 200, infoY + 14);
            if (data.beneficiary.educationClassOrRole)
                doc.text(`Class/Role: ${data.beneficiary.educationClassOrRole}`, textX, infoY + 28);
            if (data.beneficiary.schoolOrCollege)
                doc.text(`School: ${data.beneficiary.schoolOrCollege}`, textX + 200, infoY + 28);
            y += profileImageBuffer ? 110 : 80;
            doc.fillColor(accentColor).fontSize(10).font('Helvetica-Bold')
                .text(`Report Period: ${data.period.label}`, 60, y);
            y += 20;
            if (data.beneficiary.hobbies || data.beneficiary.dreamCareer || data.beneficiary.favouriteSubject) {
                y = this.addSectionHeader(doc, 'About Me', y, pageWidth, primaryColor);
                doc.fillColor('#4a5568').fontSize(9).font('Helvetica');
                if (data.beneficiary.hobbies) {
                    doc.text(`Hobbies: ${data.beneficiary.hobbies}`, 60, y);
                    y += 14;
                }
                if (data.beneficiary.favouriteSubject) {
                    doc.text(`Favourite Subject: ${data.beneficiary.favouriteSubject}`, 60, y);
                    y += 14;
                }
                if (data.beneficiary.dreamCareer) {
                    doc.text(`Dream Career: ${data.beneficiary.dreamCareer}`, 60, y);
                    y += 14;
                }
                y += 6;
            }
            if (data.healthEvents.length > 0 || data.healthMetrics.length > 0) {
                y = this.checkPageBreak(doc, y, 80, orgName);
                y = this.addSectionHeader(doc, 'Health & Wellbeing', y, pageWidth, primaryColor);
                if (data.healthMetrics.length > 0) {
                    doc.fillColor(accentColor).fontSize(9).font('Helvetica-Bold').text('Growth Metrics', 60, y);
                    y += 14;
                    y = this.drawTableHeader(doc, ['Date', 'Height (cm)', 'Weight (kg)', 'Status'], [60, 180, 280, 380], y, lightBg);
                    for (const m of data.healthMetrics) {
                        y = this.checkPageBreak(doc, y, 16, orgName);
                        doc.fillColor('#4a5568').fontSize(8).font('Helvetica');
                        doc.text(this.fmtDate(m.date), 60, y);
                        doc.text(m.heightCm?.toString() || '-', 180, y);
                        doc.text(m.weightKg?.toString() || '-', 280, y);
                        doc.text(m.healthStatus, 380, y);
                        y += 14;
                    }
                    y += 8;
                }
                if (data.healthEvents.length > 0) {
                    doc.fillColor(accentColor).fontSize(9).font('Helvetica-Bold').text('Health Events', 60, y);
                    y += 14;
                    for (const ev of data.healthEvents) {
                        y = this.checkPageBreak(doc, y, 30, orgName);
                        const severityColor = ev.severity === 'CRITICAL' ? '#e53e3e' : ev.severity === 'HIGH' ? '#dd6b20' : ev.severity === 'MEDIUM' ? '#d69e2e' : '#38a169';
                        doc.rect(56, y, 3, 22).fill(severityColor);
                        doc.fillColor('#2d3748').fontSize(9).font('Helvetica-Bold')
                            .text(`${this.fmtDate(ev.date)} - ${ev.title}`, 66, y);
                        doc.fillColor('#718096').fontSize(8).font('Helvetica')
                            .text(ev.description, 66, y + 12, { width: pageWidth - 30 });
                        y += 30;
                    }
                    y += 6;
                }
            }
            if (data.progressCards.length > 0) {
                y = this.checkPageBreak(doc, y, 80, orgName);
                y = this.addSectionHeader(doc, 'Academic Progress', y, pageWidth, primaryColor);
                y = this.drawTableHeader(doc, ['Year', 'Term', 'Class', 'School', '%', 'Remarks'], [60, 140, 210, 270, 380, 410], y, lightBg);
                for (const p of data.progressCards) {
                    y = this.checkPageBreak(doc, y, 16, orgName);
                    doc.fillColor('#4a5568').fontSize(8).font('Helvetica');
                    doc.text(p.academicYear, 60, y);
                    doc.text(p.term.replace('_', ' '), 140, y);
                    doc.text(p.classGrade, 210, y);
                    doc.text((p.school || '-').substring(0, 18), 270, y);
                    doc.text(p.percentage != null ? `${p.percentage}%` : '-', 380, y);
                    doc.text((p.remarks || '-').substring(0, 12), 410, y);
                    y += 14;
                }
                y += 10;
            }
            if (data.updates.length > 0) {
                y = this.checkPageBreak(doc, y, 60, orgName);
                y = this.addSectionHeader(doc, 'Updates & Milestones', y, pageWidth, primaryColor);
                for (const u of data.updates) {
                    y = this.checkPageBreak(doc, y, 40, orgName);
                    doc.fillColor(accentColor).fontSize(9).font('Helvetica-Bold')
                        .text(`${this.fmtDate(u.date)} - ${u.title}`, 60, y);
                    doc.fillColor('#718096').fontSize(8).font('Helvetica')
                        .text(`[${u.type}]`, 60, y + 12);
                    const contentHeight = doc.heightOfString(u.content, { width: pageWidth - 20 });
                    doc.fillColor('#4a5568').fontSize(8).font('Helvetica')
                        .text(u.content, 60, y + 24, { width: pageWidth - 20 });
                    y += 30 + contentHeight;
                }
                y += 6;
            }
            if (data.sponsors.length > 0) {
                y = this.checkPageBreak(doc, y, 40, orgName);
                y = this.addSectionHeader(doc, 'Sponsors', y, pageWidth, primaryColor);
                for (const s of data.sponsors) {
                    doc.fillColor('#4a5568').fontSize(9).font('Helvetica')
                        .text(`${s.name} (${s.code})`, 60, y);
                    y += 14;
                }
            }
            const pageCount = doc.bufferedPageRange().count;
            for (let i = 0; i < pageCount; i++) {
                doc.switchToPage(i);
                doc.fillColor('#a0aec0').fontSize(7).font('Helvetica')
                    .text(`${orgName} | Confidential | Page ${i + 1} of ${pageCount}`, 50, doc.page.height - 35, { width: pageWidth, align: 'center' });
            }
            doc.end();
        });
    }
    addWatermark(doc, orgName) {
        doc.save();
        doc.fillColor('#e2e8f0').fontSize(50).font('Helvetica-Bold').opacity(0.07);
        const textWidth = doc.widthOfString(orgName);
        const cx = doc.page.width / 2;
        const cy = doc.page.height / 2;
        doc.translate(cx, cy);
        doc.rotate(-35, { origin: [0, 0] });
        doc.text(orgName, -textWidth / 2, -25);
        doc.restore();
    }
    addSectionHeader(doc, title, y, pageWidth, color) {
        doc.rect(50, y, pageWidth, 20).fill(color);
        doc.fillColor('#ffffff').fontSize(11).font('Helvetica-Bold')
            .text(title, 60, y + 4);
        return y + 28;
    }
    drawTableHeader(doc, cols, xs, y, bg) {
        doc.rect(50, y, doc.page.width - 100, 16).fill(bg);
        doc.fillColor('#4a5568').fontSize(8).font('Helvetica-Bold');
        cols.forEach((col, i) => doc.text(col, xs[i], y + 3));
        return y + 18;
    }
    checkPageBreak(doc, y, needed, orgName) {
        if (y + needed > doc.page.height - 60) {
            doc.addPage();
            this.addWatermark(doc, orgName);
            return 60;
        }
        return y;
    }
    fetchImageBuffer(url) {
        return new Promise((resolve, reject) => {
            const client = url.startsWith('https') ? https : http;
            const req = client.get(url, { timeout: 8000 }, (res) => {
                if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                    this.fetchImageBuffer(res.headers.location).then(resolve).catch(reject);
                    return;
                }
                const chunks = [];
                res.on('data', (c) => chunks.push(c));
                res.on('end', () => resolve(Buffer.concat(chunks)));
                res.on('error', reject);
            });
            req.on('error', reject);
            req.on('timeout', () => { req.destroy(); reject(new Error('Image fetch timed out')); });
        });
    }
    async shareWithSponsors(id, user) {
        const report = await this.findOne(id);
        if (report.status !== 'READY' && report.status !== 'SHARED') {
            throw new common_1.BadRequestException('Report is not ready for sharing');
        }
        const sponsorships = await this.prisma.sponsorship.findMany({
            where: { beneficiaryId: report.beneficiaryId, isActive: true },
            include: {
                donor: { select: { id: true, firstName: true, lastName: true, personalEmail: true, officialEmail: true } },
            },
        });
        if (sponsorships.length === 0) {
            throw new common_1.BadRequestException('No active sponsors to share with');
        }
        const orgProfile = await this.orgProfileService.getProfile();
        const orgName = orgProfile.name;
        const data = report.reportData;
        const donorIds = [];
        for (const sp of sponsorships) {
            const email = sp.donor.personalEmail || sp.donor.officialEmail;
            if (!email)
                continue;
            const donorName = `${sp.donor.firstName} ${sp.donor.lastName || ''}`.trim();
            const subject = `Progress Report: ${data?.beneficiary?.fullName || report.beneficiary.fullName}`;
            const body = this.buildShareEmail(donorName, data?.beneficiary?.fullName || report.beneficiary.fullName, data?.period?.label || '', orgName);
            await this.emailJobsService.create({
                donorId: sp.donor.id,
                toEmail: email,
                subject,
                body,
                type: 'BENEFICIARY_PROGRESS_REPORT',
                relatedId: id,
                scheduledAt: new Date(),
            });
            donorIds.push(sp.donor.id);
        }
        await this.prisma.beneficiaryProgressReport.update({
            where: { id },
            data: {
                status: 'SHARED',
                sharedAt: new Date(),
                sharedTo: donorIds,
            },
        });
        return { sharedCount: donorIds.length };
    }
    async shareToDonors(id, donorIds, user) {
        const report = await this.findOne(id);
        if (report.status !== 'READY' && report.status !== 'SHARED') {
            throw new common_1.BadRequestException('Report is not ready for sharing');
        }
        const donors = await this.prisma.donor.findMany({
            where: { id: { in: donorIds } },
            select: { id: true, firstName: true, lastName: true, personalEmail: true, officialEmail: true },
        });
        const orgProfile = await this.orgProfileService.getProfile();
        const orgName = orgProfile.name;
        const data = report.reportData;
        let sharedCount = 0;
        for (const donor of donors) {
            const email = donor.personalEmail || donor.officialEmail;
            if (!email)
                continue;
            const donorName = `${donor.firstName} ${donor.lastName || ''}`.trim();
            const subject = `Progress Report: ${data?.beneficiary?.fullName || report.beneficiary.fullName}`;
            const body = this.buildShareEmail(donorName, data?.beneficiary?.fullName || report.beneficiary.fullName, data?.period?.label || '', orgName);
            await this.emailJobsService.create({
                donorId: donor.id,
                toEmail: email,
                subject,
                body,
                type: 'BENEFICIARY_PROGRESS_REPORT',
                relatedId: id,
                scheduledAt: new Date(),
            });
            sharedCount++;
        }
        const existingShared = report.sharedTo || [];
        const allShared = [...new Set([...existingShared, ...donorIds])];
        await this.prisma.beneficiaryProgressReport.update({
            where: { id },
            data: {
                status: 'SHARED',
                sharedAt: new Date(),
                sharedTo: allShared,
            },
        });
        return { sharedCount };
    }
    async delete(id) {
        const report = await this.findOne(id);
        await this.prisma.beneficiaryProgressReport.delete({ where: { id: report.id } });
        return { deleted: true };
    }
    async searchBeneficiaries(q) {
        const beneficiaries = await this.prisma.beneficiary.findMany({
            where: {
                isDeleted: false,
                OR: [
                    { fullName: { contains: q, mode: 'insensitive' } },
                    { code: { contains: q, mode: 'insensitive' } },
                ],
            },
            select: { id: true, fullName: true, code: true, homeType: true },
            take: 15,
        });
        return beneficiaries;
    }
    buildShareEmail(donorName, beneficiaryName, period, orgName) {
        return `
Dear ${donorName},

We are pleased to share the progress report for ${beneficiaryName}${period ? ` covering the period ${period}` : ''}.

This report includes updates on their health, education, and overall development. We hope this gives you joy and confidence in the positive impact of your support.

Please find the detailed report attached or contact us for more information.

With gratitude,
${orgName}
    `.trim();
    }
    formatDateRange(start, end) {
        const fmt = (d) => d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
        return `${fmt(start)} - ${fmt(end)}`;
    }
    formatHomeType(ht) {
        return ht.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    }
    fmtDate(iso) {
        return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    }
};
exports.BeneficiaryProgressReportsService = BeneficiaryProgressReportsService;
exports.BeneficiaryProgressReportsService = BeneficiaryProgressReportsService = BeneficiaryProgressReportsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        email_jobs_service_1.EmailJobsService,
        organization_profile_service_1.OrganizationProfileService])
], BeneficiaryProgressReportsService);
//# sourceMappingURL=beneficiary-progress-reports.service.js.map