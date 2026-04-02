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
var DonationsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DonationsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const receipt_service_1 = require("../receipt/receipt.service");
const email_service_1 = require("../email/email.service");
const communication_log_service_1 = require("../communication-log/communication-log.service");
const organization_profile_service_1 = require("../organization-profile/organization-profile.service");
const client_1 = require("@prisma/client");
const masking_util_1 = require("../common/utils/masking.util");
const communications_service_1 = require("../communications/communications.service");
const notification_service_1 = require("../notifications/notification.service");
let DonationsService = DonationsService_1 = class DonationsService {
    constructor(prisma, auditService, receiptService, emailService, communicationLogService, orgProfileService, communicationsService, notificationService) {
        this.prisma = prisma;
        this.auditService = auditService;
        this.receiptService = receiptService;
        this.emailService = emailService;
        this.communicationLogService = communicationLogService;
        this.orgProfileService = orgProfileService;
        this.communicationsService = communicationsService;
        this.notificationService = notificationService;
        this.logger = new common_1.Logger(DonationsService_1.name);
    }
    getDonorAccessFilter(_user) {
        return {};
    }
    shouldMaskDonorData(user) {
        return user.role !== client_1.Role.ADMIN;
    }
    async findAll(user, options = {}) {
        const { page = 1, limit = 20, donorId, startDate, endDate, sortBy = "donationDate", sortOrder = "desc", search, donationType, donationHomeType, } = options;
        const accessFilter = this.getDonorAccessFilter(user);
        const where = {
            isDeleted: false,
            ...accessFilter,
        };
        if (donorId)
            where.donorId = donorId;
        if (donationType && donationType !== "all") {
            where.donationType = donationType;
        }
        if (donationHomeType && donationHomeType !== "all") {
            where.donationHomeType = donationHomeType;
        }
        if (search) {
            where.donor = {
                ...where.donor,
                OR: [
                    { firstName: { contains: search, mode: "insensitive" } },
                    { lastName: { contains: search, mode: "insensitive" } },
                    { donorCode: { contains: search, mode: "insensitive" } },
                    { primaryPhone: { contains: search } },
                ],
            };
        }
        if (startDate || endDate) {
            where.donationDate = {};
            if (startDate)
                where.donationDate.gte = new Date(startDate);
            if (endDate)
                where.donationDate.lte = new Date(endDate);
        }
        const [donations, total] = await Promise.all([
            this.prisma.donation.findMany({
                where,
                include: {
                    donor: {
                        select: {
                            id: true,
                            donorCode: true,
                            firstName: true,
                            lastName: true,
                            primaryPhone: true,
                            personalEmail: true,
                            city: true,
                        },
                    },
                    createdBy: { select: { id: true, name: true } },
                    home: { select: { id: true, fullName: true } },
                    campaign: { select: { id: true, name: true } },
                },
                orderBy: { [sortBy]: sortOrder },
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.donation.count({ where }),
        ]);
        const maskedDonations = this.shouldMaskDonorData(user)
            ? donations.map((donation) => (0, masking_util_1.maskDonorInDonation)(donation))
            : donations;
        return {
            items: maskedDonations,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
    async findOne(user, id) {
        const accessFilter = this.getDonorAccessFilter(user);
        const donation = await this.prisma.donation.findFirst({
            where: {
                id,
                isDeleted: false,
                ...accessFilter,
            },
            include: {
                donor: {
                    select: {
                        id: true,
                        donorCode: true,
                        firstName: true,
                        lastName: true,
                        primaryPhone: true,
                        personalEmail: true,
                        officialEmail: true,
                        whatsappPhone: true,
                        city: true,
                        state: true,
                    },
                },
                createdBy: { select: { id: true, name: true } },
                home: true,
                campaign: { select: { id: true, name: true } },
            },
        });
        if (!donation) {
            throw new common_1.NotFoundException("Donation not found");
        }
        return this.shouldMaskDonorData(user)
            ? (0, masking_util_1.maskDonorInDonation)(donation)
            : donation;
    }
    async create(user, data, ipAddress, userAgent) {
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth() + 1;
        const financialYear = currentMonth >= 4
            ? `${currentYear}-${(currentYear + 1).toString().slice(-2)}`
            : `${currentYear - 1}-${currentYear.toString().slice(-2)}`;
        const receiptPrefix = `AKF-REC-${currentYear}-`;
        const lastReceipt = await this.prisma.donation.findFirst({
            where: {
                receiptNumber: { startsWith: receiptPrefix, not: null },
            },
            orderBy: { receiptNumber: "desc" },
            select: { receiptNumber: true },
        });
        let nextReceiptNum = 1;
        if (lastReceipt?.receiptNumber) {
            const match = lastReceipt.receiptNumber.match(/-(\d+)$/);
            if (match)
                nextReceiptNum = parseInt(match[1], 10) + 1;
        }
        const receiptNumber = `AKF-REC-${currentYear}-${nextReceiptNum
            .toString()
            .padStart(4, "0")}`;
        const validHomeTypes = ["GIRLS_HOME", "BLIND_BOYS_HOME", "OLD_AGE_HOME", "GENERAL"];
        if (data.donationHomeType && !validHomeTypes.includes(data.donationHomeType)) {
            if (data.donationHomeType === "NONE" || data.donationHomeType === "none" || data.donationHomeType === "") {
                data.donationHomeType = null;
            }
            else {
                throw new common_1.BadRequestException(`Invalid donationHomeType: ${data.donationHomeType}. Valid values: ${validHomeTypes.join(", ")}`);
            }
        }
        const { emailType: _emailType, ...donationData } = data;
        const donation = await this.prisma.donation.create({
            data: {
                ...donationData,
                donationDate: new Date(donationData.donationDate),
                donationHomeType: donationData.donationHomeType || null,
                receiptNumber,
                financialYear,
                createdById: user.id,
            },
        });
        await this.auditService.logDonationCreate(user.id, donation.id, { receiptNumber, donorId: data.donorId, amount: data.donationAmount }, ipAddress, userAgent);
        this.updatePrimaryHomeInterest(data.donorId).catch((err) => this.logger.warn(`primaryHomeInterest compute failed for donor ${data.donorId}: ${err?.message}`));
        const communicationResults = {};
        const orgProfile = await this.orgProfileService.getProfile();
        const notificationParams = {
            donationId: donation.id,
            donorId: data.donorId,
            receiptNumber,
            donationAmount: Number(donation.donationAmount),
            currency: donation.currency,
            donationType: donation.donationType || 'General',
            donationMode: donation.donationMode || undefined,
            donationDate: donation.donationDate,
            emailType: data.emailType || 'GENERAL',
            userId: user.id,
        };
        if (orgProfile.enableDonationEmail) {
            communicationResults.emailStatus = "queued";
            this.notificationService.sendDonationEmail(notificationParams)
                .then((result) => {
                this.logger.log(`Donation email for ${donation.id}: status=${result.status}`);
            })
                .catch((err) => {
                this.logger.error(`Donation email error for ${donation.id}: ${err?.message}`);
            });
        }
        if (orgProfile.enableDonationWhatsApp !== false) {
            try {
                const waResult = await this.notificationService.sendDonationWhatsApp(notificationParams);
                communicationResults.whatsAppStatus = waResult.status;
                communicationResults.whatsAppMessageId = waResult.messageId;
                this.logger.log(`Donation WhatsApp for ${donation.id}: status=${waResult.status}`);
            }
            catch (err) {
                communicationResults.whatsAppStatus = "failed";
                this.logger.error(`Donation WhatsApp error for ${donation.id}: ${err?.message}`);
            }
        }
        return { ...donation, communicationResults };
    }
    async sendDonationReceiptEmail(donationId, donorId, receiptNumber, userId) {
        try {
            const donation = await this.prisma.donation.findUnique({
                where: { id: donationId },
            });
            if (!donation) {
                this.logger.warn(`Donation ${donationId} not found`);
                return;
            }
            const donor = await this.prisma.donor.findUnique({
                where: { id: donorId },
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    personalEmail: true,
                    officialEmail: true,
                },
            });
            if (!donor)
                return;
            const donorEmail = donor.personalEmail || donor.officialEmail;
            if (!donorEmail)
                return;
            const donorName = [donor.firstName, donor.lastName].filter(Boolean).join(" ") ||
                "Valued Donor";
            const kindDon = (0, receipt_service_1.isInKindDonation)(donation.donationType || '');
            let pdfBuffer;
            if (kindDon) {
                pdfBuffer = await this.receiptService.generateAcknowledgementPDF({
                    ackNumber: receiptNumber,
                    donationDate: donation.donationDate,
                    donorName,
                    donationType: donation.donationType || 'KIND',
                    currency: donation.currency,
                });
            }
            else {
                pdfBuffer = await this.receiptService.generateReceiptPDF({
                    receiptNumber,
                    donationDate: donation.donationDate,
                    donorName,
                    donationAmount: donation.donationAmount.toNumber(),
                    currency: donation.currency,
                    paymentMode: donation.donationMode,
                    donationType: donation.donationType || 'CASH',
                    receiptType: 'GENERAL',
                });
            }
            const result = await this.emailService.sendDonationReceipt(donorEmail, donorName, receiptNumber, pdfBuffer, { emailType: kindDon ? 'KIND' : 'GENERAL' });
            await this.communicationLogService.logEmail({
                donorId,
                donationId,
                toEmail: donorEmail,
                subject: `Donation Receipt - ${receiptNumber}`,
                messagePreview: `Receipt email sent for ${receiptNumber}`,
                status: result.success ? "SENT" : "FAILED",
                errorMessage: result.error,
                sentById: userId,
                type: client_1.CommunicationType.RECEIPT,
            });
        }
        catch (error) {
            this.logger.error(`Email error: ${error?.message || error}`);
        }
    }
    async update(user, id, data, ipAddress, userAgent) {
        const existing = await this.prisma.donation.findFirst({
            where: { id, isDeleted: false },
            include: { donor: { select: { assignedToUserId: true } } },
        });
        if (!existing)
            throw new common_1.NotFoundException("Donation not found");
        const updateData = { ...data };
        if (data.donationDate)
            updateData.donationDate = new Date(data.donationDate);
        const validHomeTypes = ["GIRLS_HOME", "BLIND_BOYS_HOME", "OLD_AGE_HOME", "GENERAL"];
        if (updateData.donationHomeType !== undefined) {
            if (!updateData.donationHomeType || updateData.donationHomeType === "NONE" || updateData.donationHomeType === "none") {
                updateData.donationHomeType = null;
            }
            else if (!validHomeTypes.includes(updateData.donationHomeType)) {
                throw new common_1.BadRequestException(`Invalid donationHomeType: ${updateData.donationHomeType}. Valid values: ${validHomeTypes.join(", ")}`);
            }
        }
        const updated = await this.prisma.donation.update({
            where: { id },
            data: updateData,
        });
        await this.auditService.logDonationUpdate(user.id, id, {
            receiptNumber: existing.receiptNumber,
            amount: existing.donationAmount,
        }, { ...data }, ipAddress, userAgent);
        return updated;
    }
    async softDelete(user, id, ipAddress, userAgent) {
        if (user.role !== client_1.Role.ADMIN && user.role !== client_1.Role.FOUNDER) {
            throw new common_1.ForbiddenException("Only administrators can delete donations");
        }
        const existing = await this.prisma.donation.findFirst({
            where: { id, isDeleted: false },
        });
        if (!existing)
            throw new common_1.NotFoundException("Donation not found");
        const deleted = await this.prisma.donation.update({
            where: { id },
            data: { isDeleted: true, deletedAt: new Date() },
        });
        await this.auditService.logDonationDelete(user.id, id, { receiptNumber: existing.receiptNumber }, ipAddress, userAgent);
        return deleted;
    }
    async regenerateReceipt(user, id, ipAddress, userAgent) {
        const donation = await this.prisma.donation.findFirst({
            where: { id, isDeleted: false },
        });
        if (!donation)
            throw new common_1.NotFoundException("Donation not found");
        await this.auditService.logReceiptRegenerate(user.id, id, { receiptNumber: donation.receiptNumber }, ipAddress, userAgent);
        return {
            success: true,
            message: "Receipt regeneration logged",
            receiptNumber: donation.receiptNumber,
        };
    }
    async resendReceipt(user, id, emailType) {
        const donation = await this.prisma.donation.findFirst({
            where: { id, isDeleted: false },
            include: {
                donor: {
                    select: {
                        id: true,
                        donorCode: true,
                        firstName: true,
                        lastName: true,
                        personalEmail: true,
                        officialEmail: true,
                        primaryPhone: true,
                        address: true,
                        city: true,
                        state: true,
                        pincode: true,
                        pan: true,
                    },
                },
            },
        });
        if (!donation)
            throw new common_1.NotFoundException("Donation not found");
        const donorEmail = donation.donor.personalEmail || donation.donor.officialEmail;
        if (!donorEmail) {
            throw new common_1.BadRequestException("Donor does not have an email address on file");
        }
        const donorName = `${donation.donor.firstName} ${donation.donor.lastName || ""}`.trim();
        const addressParts = [
            donation.donor.address,
            donation.donor.city,
            donation.donor.state,
            donation.donor.pincode,
        ].filter(Boolean);
        const donorAddress = addressParts.length
            ? addressParts.join(", ")
            : undefined;
        const kindDonation = (0, receipt_service_1.isInKindDonation)(donation.donationType || '');
        const effectiveEmailType = kindDonation ? 'KIND' : (emailType || 'GENERAL');
        let pdfBuffer;
        if (kindDonation) {
            pdfBuffer = await this.receiptService.generateAcknowledgementPDF({
                ackNumber: donation.receiptNumber || 'N/A',
                donationDate: donation.donationDate,
                donorName,
                donationType: donation.donationType || 'KIND',
                estimatedValue: donation.donationAmount.toNumber() || undefined,
                currency: donation.currency,
                designatedHome: donation.donationHomeType || null,
                remarks: donation.remarks || undefined,
                donorEmail,
            });
        }
        else {
            pdfBuffer = await this.receiptService.generateReceiptPDF({
                receiptNumber: donation.receiptNumber || 'N/A',
                donationDate: donation.donationDate,
                donorName,
                donationAmount: donation.donationAmount.toNumber(),
                currency: donation.currency,
                paymentMode: donation.donationMode,
                donationType: donation.donationType || 'CASH',
                remarks: donation.remarks || undefined,
                donorAddress,
                donorEmail,
                donorPAN: donation.donor.pan || undefined,
                transactionRef: donation.transactionId || undefined,
                designatedHome: donation.donationHomeType || null,
                receiptType: effectiveEmailType === 'TAX' ? 'TAX' : 'GENERAL',
            });
        }
        const emailResult = await this.emailService.sendDonationReceipt(donorEmail, donorName, donation.receiptNumber || "N/A", pdfBuffer, {
            emailType: effectiveEmailType,
            donationAmount: donation.donationAmount.toNumber(),
            currency: donation.currency,
            donationDate: donation.donationDate,
            donationMode: donation.donationMode || undefined,
            donationType: donation.donationType || undefined,
            donorPAN: donation.donor.pan || undefined,
        });
        await this.communicationLogService.logEmail({
            donorId: donation.donorId,
            donationId: donation.id,
            toEmail: donorEmail,
            subject: `Donation Receipt - ${(await this.orgProfileService.getProfile()).name} (${donation.receiptNumber})`,
            messagePreview: `Receipt re-sent by ${user.role}: ${donation.receiptNumber}`,
            status: emailResult.success ? "SENT" : "FAILED",
            errorMessage: emailResult.error,
            sentById: user.id,
            type: client_1.CommunicationType.RECEIPT,
        });
        this.logger.log(`Receipt ${donation.receiptNumber} re-sent to ${donorEmail} by user ${user.id}`);
        return {
            success: emailResult.success,
            message: emailResult.success
                ? `Receipt ${donation.receiptNumber} has been re-sent to ${donorEmail}`
                : `Failed to re-send receipt: ${emailResult.error}`,
            receiptNumber: donation.receiptNumber,
            recipientEmail: donorEmail,
        };
    }
    async getStatsByHome(user) {
        const accessFilter = this.getDonorAccessFilter(user);
        const donations = await this.prisma.donation.findMany({
            where: { isDeleted: false, ...accessFilter },
            select: {
                donationHomeType: true,
                donationType: true,
                donationAmount: true,
                currency: true,
            },
        });
        const homeStats = {
            GIRLS_HOME: { cashTotal: 0, inKindCount: 0, totalCount: 0 },
            BLIND_BOYS_HOME: { cashTotal: 0, inKindCount: 0, totalCount: 0 },
            OLD_AGE_HOME: { cashTotal: 0, inKindCount: 0, totalCount: 0 },
            GENERAL: { cashTotal: 0, inKindCount: 0, totalCount: 0 },
        };
        let totalCash = 0;
        let totalInKind = 0;
        for (const donation of donations) {
            const homeType = donation.donationHomeType || "GENERAL";
            const amount = Number(donation.donationAmount) || 0;
            const isCash = donation.donationType === "CASH";
            if (homeStats[homeType]) {
                homeStats[homeType].totalCount++;
                if (isCash) {
                    homeStats[homeType].cashTotal += amount;
                    totalCash += amount;
                }
                else {
                    homeStats[homeType].inKindCount++;
                    totalInKind++;
                }
            }
        }
        return {
            byHome: [
                {
                    homeType: "GIRLS_HOME",
                    label: "Girls Home",
                    ...homeStats.GIRLS_HOME,
                },
                {
                    homeType: "BLIND_BOYS_HOME",
                    label: "Blind Boys Home",
                    ...homeStats.BLIND_BOYS_HOME,
                },
                {
                    homeType: "OLD_AGE_HOME",
                    label: "Old Age Home",
                    ...homeStats.OLD_AGE_HOME,
                },
                { homeType: "GENERAL", label: "General", ...homeStats.GENERAL },
            ],
            totals: {
                cashTotal: totalCash,
                inKindCount: totalInKind,
                totalDonations: donations.length,
            },
        };
    }
    async exportDonations(user, filters = {}, ipAddress, userAgent) {
        if (user.role !== client_1.Role.ADMIN) {
            throw new common_1.ForbiddenException("Only administrators can export donation data");
        }
        const where = { isDeleted: false };
        if (filters.startDate || filters.endDate) {
            where.donationDate = {};
            if (filters.startDate)
                where.donationDate.gte = new Date(filters.startDate);
            if (filters.endDate)
                where.donationDate.lte = new Date(filters.endDate);
        }
        if (filters.donorId)
            where.donorId = filters.donorId;
        const donations = await this.prisma.donation.findMany({
            where,
            include: {
                donor: {
                    select: {
                        id: true,
                        donorCode: true,
                        firstName: true,
                        lastName: true,
                        primaryPhone: true,
                        personalEmail: true,
                        city: true,
                    },
                },
                home: { select: { id: true, fullName: true } },
                campaign: { select: { id: true, name: true } },
            },
            orderBy: { donationDate: "desc" },
        });
        await this.auditService.logDataExport(user.id, "Donations", filters, donations.length, ipAddress, userAgent);
        return donations;
    }
    async exportToExcel(user, filters = {}, ipAddress, userAgent) {
        const ExcelJS = await Promise.resolve().then(() => __importStar(require("exceljs")));
        const workbook = new ExcelJS.default.Workbook();
        const worksheet = workbook.addWorksheet("Donations");
        const where = { isDeleted: false };
        if (filters.startDate || filters.endDate) {
            where.donationDate = {};
            if (filters.startDate)
                where.donationDate.gte = new Date(filters.startDate);
            if (filters.endDate)
                where.donationDate.lte = new Date(filters.endDate);
        }
        if (filters.donationType && filters.donationType !== "all") {
            where.donationType = filters.donationType;
        }
        if (filters.donationHomeType && filters.donationHomeType !== "all") {
            where.donationHomeType = filters.donationHomeType;
        }
        const donations = await this.prisma.donation.findMany({
            where,
            include: {
                donor: {
                    select: {
                        donorCode: true,
                        firstName: true,
                        lastName: true,
                        primaryPhone: true,
                        personalEmail: true,
                    },
                },
            },
            orderBy: { donationDate: "desc" },
        });
        worksheet.columns = [
            { header: "Date", key: "date", width: 15 },
            { header: "Receipt No", key: "receiptNumber", width: 20 },
            { header: "Donor Name", key: "donorName", width: 25 },
            { header: "Donor Code", key: "donorCode", width: 15 },
            { header: "Phone", key: "phone", width: 15 },
            { header: "Donation Type", key: "donationType", width: 15 },
            { header: "Purpose", key: "purpose", width: 18 },
            { header: "Quantity", key: "quantity", width: 12 },
            { header: "Unit", key: "unit", width: 10 },
            { header: "Amount/Value", key: "amount", width: 15 },
            { header: "Payment Mode", key: "paymentMode", width: 15 },
            { header: "Designated Home", key: "home", width: 20 },
            { header: "Notes", key: "notes", width: 30 },
        ];
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFE0E0E0" },
        };
        for (const donation of donations) {
            const donorName = [donation.donor.firstName, donation.donor.lastName]
                .filter(Boolean)
                .join(" ");
            const homeLabel = this.getHomeTypeLabel(donation.donationHomeType || undefined);
            worksheet.addRow({
                date: new Date(donation.donationDate).toLocaleDateString("en-IN"),
                receiptNumber: donation.receiptNumber || "-",
                donorName,
                donorCode: donation.donor.donorCode,
                phone: donation.donor.primaryPhone || "-",
                donationType: donation.donationType.replace(/_/g, " "),
                purpose: donation.donationPurpose?.replace(/_/g, " ") || "-",
                quantity: donation.quantity ? donation.quantity.toString() : "-",
                unit: donation.unit || "-",
                amount: Number(donation.donationAmount) || 0,
                paymentMode: donation.donationMode?.replace(/_/g, " ") || "-",
                home: homeLabel,
                notes: donation.remarks || "-",
            });
        }
        await this.auditService.logDataExport(user.id, "DonationsExcel", filters, donations.length, ipAddress, userAgent);
        const buffer = await workbook.xlsx.writeBuffer();
        return Buffer.from(buffer);
    }
    getHomeTypeLabel(homeType) {
        switch (homeType) {
            case "GIRLS_HOME":
                return "Girls Home";
            case "BLIND_BOYS_HOME":
                return "Blind Boys Home";
            case "OLD_AGE_HOME":
                return "Old Age Home";
            case "GENERAL":
                return "General";
            default:
                return "-";
        }
    }
    async getReceiptPdf(user, donationId) {
        const donation = await this.prisma.donation.findFirst({
            where: { id: donationId, isDeleted: false },
            include: {
                donor: {
                    select: {
                        id: true,
                        donorCode: true,
                        firstName: true,
                        lastName: true,
                        primaryPhone: true,
                        personalEmail: true,
                        address: true,
                        city: true,
                        state: true,
                        pincode: true,
                        pan: true,
                    },
                },
            },
        });
        if (!donation)
            throw new common_1.NotFoundException("Donation not found");
        if (!donation.receiptNumber)
            throw new common_1.BadRequestException("No receipt generated for this donation");
        const remarks = donation.donationType !== "CASH" && donation.quantity
            ? `${donation.donationType.replace(/_/g, " ")}: ${donation.quantity}${donation.unit ? " " + donation.unit : ""}${donation.itemDescription ? " - " + donation.itemDescription : ""}`
            : donation.remarks || undefined;
        const pdfBuffer = await this.receiptService.generateReceiptPDF({
            receiptNumber: donation.receiptNumber,
            donorName: [donation.donor.firstName, donation.donor.lastName]
                .filter(Boolean)
                .join(" "),
            donorAddress: [
                donation.donor.address,
                donation.donor.city,
                donation.donor.state,
                donation.donor.pincode,
            ]
                .filter(Boolean)
                .join(", "),
            donorPAN: donation.donor.pan || "",
            donationDate: donation.donationDate,
            donationAmount: Number(donation.donationAmount),
            currency: donation.currency,
            paymentMode: donation.donationMode || "N/A",
            transactionRef: donation.transactionId || "",
            donationType: donation.donationType,
            remarks,
        });
        return {
            buffer: pdfBuffer,
            filename: `receipt_${donation.receiptNumber}.pdf`,
        };
    }
    async updatePrimaryHomeInterest(donorId) {
        const HOME_THRESHOLD = 4;
        const AUTO_TAGS = {
            GIRLS_HOME: "GIRLS_HOME_DONOR",
            BLIND_BOYS_HOME: "BLIND_HOME_DONOR",
            OLD_AGE_HOME: "OLD_AGE_HOME_DONOR",
        };
        const counts = await this.prisma.donation.groupBy({
            by: ["donationHomeType"],
            where: { donorId, isDeleted: false, donationHomeType: { not: null } },
            _count: { donationHomeType: true },
        });
        const qualified = counts.filter((c) => (c._count.donationHomeType ?? 0) >= HOME_THRESHOLD);
        if (qualified.length === 0)
            return;
        qualified.sort((a, b) => (b._count.donationHomeType ?? 0) - (a._count.donationHomeType ?? 0));
        const topHomeType = qualified[0].donationHomeType;
        const donor = await this.prisma.donor.findUnique({
            where: { id: donorId },
            select: { primaryHomeInterest: true, donorTags: true },
        });
        if (!donor)
            return;
        if (donor.primaryHomeInterest === topHomeType)
            return;
        const autoTag = AUTO_TAGS[topHomeType];
        const updatedTags = autoTag && !donor.donorTags.includes(autoTag)
            ? [...donor.donorTags, autoTag]
            : donor.donorTags;
        await this.prisma.donor.update({
            where: { id: donorId },
            data: {
                primaryHomeInterest: topHomeType,
                donorTags: updatedTags,
            },
        });
    }
};
exports.DonationsService = DonationsService;
exports.DonationsService = DonationsService = DonationsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService,
        receipt_service_1.ReceiptService,
        email_service_1.EmailService,
        communication_log_service_1.CommunicationLogService,
        organization_profile_service_1.OrganizationProfileService,
        communications_service_1.CommunicationsService,
        notification_service_1.NotificationService])
], DonationsService);
//# sourceMappingURL=donations.service.js.map