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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const organization_profile_service_1 = require("../organization-profile/organization-profile.service");
const ExcelJS = __importStar(require("exceljs"));
const pdfkit_1 = __importDefault(require("pdfkit"));
function calculateDonorHealth(lastDonationDate) {
    if (!lastDonationDate)
        return 'DORMANT';
    const daysSince = Math.floor((Date.now() - lastDonationDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysSince < 60)
        return 'HEALTHY';
    if (daysSince < 120)
        return 'AT_RISK';
    return 'DORMANT';
}
function getFinancialYear(date) {
    const year = date.getFullYear();
    const month = date.getMonth();
    if (month >= 3) {
        return `FY ${year}-${(year + 1).toString().slice(-2)}`;
    }
    else {
        return `FY ${year - 1}-${year.toString().slice(-2)}`;
    }
}
let ReportsService = class ReportsService {
    constructor(prisma, orgProfileService) {
        this.prisma = prisma;
        this.orgProfileService = orgProfileService;
    }
    getFYDates(fyType) {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();
        let fyStartYear;
        if (currentMonth >= 3) {
            fyStartYear = fyType === 'current' ? currentYear : currentYear - 1;
        }
        else {
            fyStartYear = fyType === 'current' ? currentYear - 1 : currentYear - 2;
        }
        const start = new Date(fyStartYear, 3, 1);
        const end = new Date(fyStartYear + 1, 2, 31, 23, 59, 59);
        return { start, end };
    }
    buildDateFilter(filter) {
        const where = {};
        if (filter.startDate) {
            where.donationDate = { ...where.donationDate, gte: new Date(filter.startDate) };
        }
        if (filter.endDate) {
            where.donationDate = { ...where.donationDate, lte: new Date(filter.endDate) };
        }
        return where;
    }
    async getMonthlyDonations(filter, pagination) {
        const { page = 1, limit = 20, search = '' } = pagination;
        const skip = (page - 1) * limit;
        const dateWhere = this.buildDateFilter(filter);
        const searchWhere = search
            ? {
                OR: [
                    { donor: { firstName: { contains: search, mode: 'insensitive' } } },
                    { donor: { lastName: { contains: search, mode: 'insensitive' } } },
                    { donor: { donorCode: { contains: search, mode: 'insensitive' } } },
                    { receiptNumber: { contains: search, mode: 'insensitive' } },
                ],
            }
            : {};
        const where = {
            deletedAt: null,
            ...dateWhere,
            ...searchWhere,
        };
        const [donations, total, aggregation] = await Promise.all([
            this.prisma.donation.findMany({
                where,
                include: {
                    donor: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            donorCode: true,
                        },
                    },
                },
                orderBy: { donationDate: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.donation.count({ where }),
            this.prisma.donation.aggregate({
                where,
                _sum: { donationAmount: true },
                _count: true,
            }),
        ]);
        return {
            data: donations.map((d) => ({
                id: d.id,
                donationDate: d.donationDate,
                donorName: `${d.donor.firstName} ${d.donor.lastName || ''}`.trim(),
                donorCode: d.donor.donorCode,
                donationType: d.donationType,
                donationMode: d.donationMode,
                amount: d.donationAmount,
                receiptNumber: d.receiptNumber,
                remarks: d.remarks,
            })),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
            summary: {
                totalAmount: aggregation._sum?.donationAmount || 0,
                totalCount: aggregation._count,
            },
        };
    }
    async getDonorSummary(filter, pagination) {
        const { page = 1, limit = 20, search = '' } = pagination;
        const skip = (page - 1) * limit;
        const searchWhere = search
            ? {
                OR: [
                    { firstName: { contains: search, mode: 'insensitive' } },
                    { lastName: { contains: search, mode: 'insensitive' } },
                    { donorCode: { contains: search, mode: 'insensitive' } },
                ],
            }
            : {};
        const donorWhere = {
            deletedAt: null,
            ...searchWhere,
        };
        const [donors, total] = await Promise.all([
            this.prisma.donor.findMany({
                where: donorWhere,
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    donorCode: true,
                    category: true,
                    donations: {
                        where: { deletedAt: null },
                        select: {
                            donationAmount: true,
                            donationDate: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.donor.count({ where: donorWhere }),
        ]);
        const fyDates = filter.startDate && filter.endDate
            ? { start: new Date(filter.startDate), end: new Date(filter.endDate) }
            : this.getFYDates('current');
        const data = donors.map((donor) => {
            const allDonations = donor.donations;
            const fyDonations = allDonations.filter((d) => d.donationDate >= fyDates.start && d.donationDate <= fyDates.end);
            return {
                id: donor.id,
                donorName: `${donor.firstName} ${donor.lastName || ''}`.trim(),
                donorCode: donor.donorCode,
                category: donor.category,
                fyTotal: fyDonations.reduce((sum, d) => sum + (d.donationAmount?.toNumber() || 0), 0),
                fyCount: fyDonations.length,
                lifetimeTotal: allDonations.reduce((sum, d) => sum + (d.donationAmount?.toNumber() || 0), 0),
                lifetimeCount: allDonations.length,
                lastDonation: allDonations.length > 0
                    ? allDonations.sort((a, b) => b.donationDate.getTime() - a.donationDate.getTime())[0].donationDate
                    : null,
            };
        });
        return {
            data,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async getDonorReport(filter, params) {
        const { page = 1, limit = 20, search = '', sortBy = 'lifetime', sortOrder = 'desc' } = params;
        const skip = (page - 1) * limit;
        const searchWhere = search
            ? {
                OR: [
                    { firstName: { contains: search, mode: 'insensitive' } },
                    { lastName: { contains: search, mode: 'insensitive' } },
                    { donorCode: { contains: search, mode: 'insensitive' } },
                    { primaryPhone: { contains: search, mode: 'insensitive' } },
                    { personalEmail: { contains: search, mode: 'insensitive' } },
                    { officialEmail: { contains: search, mode: 'insensitive' } },
                ],
            }
            : {};
        const donorWhere = {
            deletedAt: null,
            ...searchWhere,
        };
        const [donors, total] = await Promise.all([
            this.prisma.donor.findMany({
                where: donorWhere,
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    donorCode: true,
                    city: true,
                    state: true,
                    country: true,
                    donations: {
                        where: { deletedAt: null },
                        select: {
                            donationAmount: true,
                            donationDate: true,
                        },
                    },
                },
                skip,
                take: limit,
            }),
            this.prisma.donor.count({ where: donorWhere }),
        ]);
        const fyDates = filter.startDate && filter.endDate
            ? { start: new Date(filter.startDate), end: new Date(filter.endDate) }
            : this.getFYDates('current');
        let data = donors.map((donor) => {
            const allDonations = donor.donations;
            const fyDonations = allDonations.filter((d) => d.donationDate >= fyDates.start && d.donationDate <= fyDates.end);
            const sortedDonations = [...allDonations].sort((a, b) => b.donationDate.getTime() - a.donationDate.getTime());
            const lastDonationDate = sortedDonations.length > 0 ? sortedDonations[0].donationDate : null;
            return {
                id: donor.id,
                donorCode: donor.donorCode,
                donorName: `${donor.firstName} ${donor.lastName || ''}`.trim(),
                city: donor.city || null,
                country: donor.country || 'India',
                lifetimeTotal: allDonations.reduce((sum, d) => sum + (d.donationAmount?.toNumber() || 0), 0),
                fyTotal: fyDonations.reduce((sum, d) => sum + (d.donationAmount?.toNumber() || 0), 0),
                donationCount: allDonations.length,
                lastDonation: lastDonationDate,
                healthStatus: calculateDonorHealth(lastDonationDate),
            };
        });
        data.sort((a, b) => {
            let aVal, bVal;
            if (sortBy === 'lifetime') {
                aVal = a.lifetimeTotal;
                bVal = b.lifetimeTotal;
            }
            else if (sortBy === 'fy') {
                aVal = a.fyTotal;
                bVal = b.fyTotal;
            }
            else {
                aVal = a.lastDonation ? a.lastDonation.getTime() : 0;
                bVal = b.lastDonation ? b.lastDonation.getTime() : 0;
            }
            return sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
        });
        return {
            data,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async exportDonorReportExcel(filter) {
        const allDonors = await this.getDonorReport(filter, { page: 1, limit: 10000, sortBy: 'lifetime', sortOrder: 'desc' });
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Donor-wise Summary');
        sheet.columns = [
            { header: 'Donor ID', key: 'donorCode', width: 18 },
            { header: 'Donor Name', key: 'donorName', width: 28 },
            { header: 'City', key: 'city', width: 18 },
            { header: 'Country', key: 'country', width: 15 },
            { header: 'Lifetime Total (₹)', key: 'lifetimeTotal', width: 18 },
            { header: 'FY Total (₹)', key: 'fyTotal', width: 15 },
            { header: 'Donation Count', key: 'donationCount', width: 15 },
            { header: 'Last Donation', key: 'lastDonation', width: 15 },
            { header: 'Health Status', key: 'healthStatus', width: 15 },
        ];
        sheet.getRow(1).font = { bold: true };
        sheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF4A7C59' },
        };
        sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        allDonors.data.forEach((d) => {
            sheet.addRow({
                donorCode: d.donorCode,
                donorName: d.donorName,
                city: d.city || '-',
                country: d.country,
                lifetimeTotal: d.lifetimeTotal,
                fyTotal: d.fyTotal,
                donationCount: d.donationCount,
                lastDonation: d.lastDonation ? new Date(d.lastDonation).toLocaleDateString('en-IN') : '-',
                healthStatus: d.healthStatus,
            });
        });
        sheet.addRow({});
        const totalLifetime = allDonors.data.reduce((sum, d) => sum + d.lifetimeTotal, 0);
        const totalFY = allDonors.data.reduce((sum, d) => sum + d.fyTotal, 0);
        const summaryRow = sheet.addRow({
            donorCode: 'TOTAL',
            donorName: `${allDonors.data.length} Donors`,
            lifetimeTotal: totalLifetime,
            fyTotal: totalFY,
            donationCount: allDonors.data.reduce((sum, d) => sum + d.donationCount, 0),
        });
        summaryRow.font = { bold: true };
        const buffer = await workbook.xlsx.writeBuffer();
        return Buffer.from(buffer);
    }
    async exportDonorReportPdf(filter) {
        const [allDonors, orgProfile] = await Promise.all([
            this.getDonorReport(filter, { page: 1, limit: 10000, sortBy: 'lifetime', sortOrder: 'desc' }),
            this.orgProfileService.getProfile(),
        ]);
        const orgName = orgProfile.name;
        return new Promise((resolve) => {
            const doc = new pdfkit_1.default({ margin: 30, size: 'A4', layout: 'landscape' });
            const chunks = [];
            doc.on('data', (chunk) => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.fontSize(16).font('Helvetica-Bold').text(orgName, { align: 'center' });
            doc.fontSize(14).text('Donor-wise Summary Report', { align: 'center' });
            doc.moveDown(0.3);
            const dateRange = filter.startDate && filter.endDate
                ? `FY Period: ${new Date(filter.startDate).toLocaleDateString('en-IN')} to ${new Date(filter.endDate).toLocaleDateString('en-IN')}`
                : 'Current Financial Year';
            doc.fontSize(10).font('Helvetica').text(dateRange, { align: 'center' });
            doc.fontSize(9).text(`Generated: ${new Date().toLocaleDateString('en-IN')}`, { align: 'center' });
            doc.moveDown();
            const tableTop = doc.y;
            const colWidths = [75, 110, 70, 60, 80, 70, 55, 70, 60];
            const headers = ['Donor ID', 'Name', 'City', 'Country', 'Lifetime (₹)', 'FY (₹)', 'Count', 'Last Donation', 'Health'];
            let x = 30;
            doc.font('Helvetica-Bold').fontSize(8);
            doc.rect(30, tableTop - 3, 760, 16).fill('#4A7C59');
            doc.fill('#FFFFFF');
            headers.forEach((header, i) => {
                doc.text(header, x + 2, tableTop, { width: colWidths[i] - 4, align: 'left' });
                x += colWidths[i];
            });
            let y = tableTop + 18;
            doc.fill('#000000').font('Helvetica').fontSize(7);
            const maxRows = 35;
            allDonors.data.slice(0, maxRows).forEach((d, index) => {
                if (y > 520) {
                    doc.addPage();
                    y = 40;
                }
                if (index % 2 === 0) {
                    doc.rect(30, y - 2, 760, 14).fill('#F5F5F5');
                    doc.fill('#000000');
                }
                x = 30;
                const rowData = [
                    d.donorCode,
                    d.donorName.substring(0, 22),
                    (d.city || '-').substring(0, 12),
                    (d.country || 'India').substring(0, 10),
                    `₹${d.lifetimeTotal.toLocaleString('en-IN')}`,
                    `₹${d.fyTotal.toLocaleString('en-IN')}`,
                    d.donationCount.toString(),
                    d.lastDonation ? new Date(d.lastDonation).toLocaleDateString('en-IN') : '-',
                    d.healthStatus,
                ];
                rowData.forEach((cell, i) => {
                    doc.text(cell, x + 2, y, { width: colWidths[i] - 4, align: 'left' });
                    x += colWidths[i];
                });
                y += 14;
            });
            doc.moveDown(2);
            const totalLifetime = allDonors.data.reduce((sum, d) => sum + d.lifetimeTotal, 0);
            const totalFY = allDonors.data.reduce((sum, d) => sum + d.fyTotal, 0);
            const healthyCt = allDonors.data.filter((d) => d.healthStatus === 'HEALTHY').length;
            const atRiskCt = allDonors.data.filter((d) => d.healthStatus === 'AT_RISK').length;
            const dormantCt = allDonors.data.filter((d) => d.healthStatus === 'DORMANT').length;
            doc.font('Helvetica-Bold').fontSize(9);
            doc.text(`Total Donors: ${allDonors.data.length} | Lifetime Total: ₹${totalLifetime.toLocaleString('en-IN')} | FY Total: ₹${totalFY.toLocaleString('en-IN')}`, 30, y + 10);
            doc.text(`Health: Healthy ${healthyCt} | At-Risk ${atRiskCt} | Dormant ${dormantCt}`, 30, y + 25);
            doc.fontSize(8).font('Helvetica').text('This is a computer-generated report. For internal use only.', 30, 560, { align: 'center', width: 760 });
            doc.end();
        });
    }
    async getReceiptsAudit(filter, params) {
        const { page = 1, limit = 20, search = '', paymentMode } = params;
        const skip = (page - 1) * limit;
        const dateWhere = this.buildDateFilter(filter);
        const searchWhere = search
            ? {
                OR: [
                    { donor: { firstName: { contains: search, mode: 'insensitive' } } },
                    { donor: { lastName: { contains: search, mode: 'insensitive' } } },
                    { receiptNumber: { contains: search, mode: 'insensitive' } },
                ],
            }
            : {};
        const paymentModeWhere = paymentMode && paymentMode !== 'ALL'
            ? { donationMode: paymentMode }
            : {};
        const where = {
            deletedAt: null,
            receiptNumber: { not: null },
            ...dateWhere,
            ...searchWhere,
            ...paymentModeWhere,
        };
        const [donations, total, summary] = await Promise.all([
            this.prisma.donation.findMany({
                where,
                include: {
                    donor: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            donorCode: true,
                        },
                    },
                },
                orderBy: { receiptNumber: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.donation.count({ where }),
            this.prisma.donation.aggregate({
                where,
                _sum: { donationAmount: true },
                _count: true,
            }),
        ]);
        return {
            data: donations.map((d) => ({
                id: d.id,
                receiptNumber: d.receiptNumber,
                receiptDate: d.donationDate,
                donorName: `${d.donor.firstName} ${d.donor.lastName || ''}`.trim(),
                donorCode: d.donor.donorCode,
                amount: d.donationAmount,
                paymentMode: d.donationMode,
                financialYear: getFinancialYear(d.donationDate),
                donationCategory: d.donationType || 'CASH',
                generatedBy: 'System',
            })),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
            summary: {
                totalAmount: summary._sum.donationAmount,
                totalCount: summary._count,
            },
        };
    }
    async exportReceiptsAuditExcel(filter, paymentMode) {
        const allReceipts = await this.getReceiptsAudit(filter, { page: 1, limit: 10000, paymentMode });
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Receipt Register (Audit)');
        sheet.columns = [
            { header: 'Receipt Number', key: 'receiptNumber', width: 22 },
            { header: 'Receipt Date', key: 'receiptDate', width: 15 },
            { header: 'Donor Name', key: 'donorName', width: 28 },
            { header: 'Amount (₹)', key: 'amount', width: 15 },
            { header: 'Payment Mode', key: 'paymentMode', width: 15 },
            { header: 'Financial Year', key: 'financialYear', width: 15 },
            { header: 'Donation Category', key: 'donationCategory', width: 18 },
            { header: 'Generated By', key: 'generatedBy', width: 15 },
        ];
        sheet.getRow(1).font = { bold: true };
        sheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF2E5A4C' },
        };
        sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        allReceipts.data.forEach((d) => {
            sheet.addRow({
                receiptNumber: d.receiptNumber,
                receiptDate: new Date(d.receiptDate).toLocaleDateString('en-IN'),
                donorName: d.donorName,
                amount: d.amount?.toNumber?.() || d.amount || 0,
                paymentMode: d.paymentMode,
                financialYear: d.financialYear,
                donationCategory: d.donationCategory,
                generatedBy: d.generatedBy,
            });
        });
        sheet.addRow({});
        const totalAmount = allReceipts.data.reduce((sum, d) => sum + (d.amount?.toNumber?.() || d.amount || 0), 0);
        const summaryRow = sheet.addRow({
            receiptNumber: 'TOTAL',
            donorName: `${allReceipts.data.length} Receipts`,
            amount: totalAmount,
        });
        summaryRow.font = { bold: true };
        const buffer = await workbook.xlsx.writeBuffer();
        return Buffer.from(buffer);
    }
    async exportReceiptsAuditPdf(filter, paymentMode) {
        const [allReceipts, orgProfile] = await Promise.all([
            this.getReceiptsAudit(filter, { page: 1, limit: 10000, paymentMode }),
            this.orgProfileService.getProfile(),
        ]);
        const orgName = orgProfile.name;
        return new Promise((resolve) => {
            const doc = new pdfkit_1.default({ margin: 30, size: 'A4', layout: 'landscape' });
            const chunks = [];
            doc.on('data', (chunk) => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.fontSize(16).font('Helvetica-Bold').text(orgName, { align: 'center' });
            doc.fontSize(14).text('Receipt Register (Audit Report)', { align: 'center' });
            doc.moveDown(0.3);
            const dateRange = filter.startDate && filter.endDate
                ? `Period: ${new Date(filter.startDate).toLocaleDateString('en-IN')} to ${new Date(filter.endDate).toLocaleDateString('en-IN')}`
                : 'All Time';
            doc.fontSize(10).font('Helvetica').text(dateRange, { align: 'center' });
            if (paymentMode && paymentMode !== 'ALL') {
                doc.text(`Payment Mode: ${paymentMode}`, { align: 'center' });
            }
            doc.fontSize(9).text(`Generated: ${new Date().toLocaleDateString('en-IN')} | Admin Audit Copy`, { align: 'center' });
            doc.moveDown();
            const tableTop = doc.y;
            const colWidths = [100, 70, 120, 75, 80, 75, 85, 70];
            const headers = ['Receipt #', 'Date', 'Donor Name', 'Amount', 'Mode', 'FY', 'Category', 'Gen. By'];
            let x = 30;
            doc.font('Helvetica-Bold').fontSize(8);
            doc.rect(30, tableTop - 3, 760, 16).fill('#2E5A4C');
            doc.fill('#FFFFFF');
            headers.forEach((header, i) => {
                doc.text(header, x + 2, tableTop, { width: colWidths[i] - 4, align: 'left' });
                x += colWidths[i];
            });
            let y = tableTop + 18;
            doc.fill('#000000').font('Helvetica').fontSize(7);
            let runningTotal = 0;
            allReceipts.data.slice(0, 45).forEach((d, index) => {
                if (y > 520) {
                    doc.addPage();
                    y = 40;
                }
                if (index % 2 === 0) {
                    doc.rect(30, y - 2, 760, 13).fill('#F5F5F5');
                    doc.fill('#000000');
                }
                const amountNum = d.amount?.toNumber?.() || d.amount || 0;
                runningTotal += amountNum;
                x = 30;
                const rowData = [
                    d.receiptNumber,
                    new Date(d.receiptDate).toLocaleDateString('en-IN'),
                    d.donorName.substring(0, 22),
                    `₹${amountNum.toLocaleString('en-IN')}`,
                    d.paymentMode,
                    d.financialYear,
                    d.donationCategory,
                    d.generatedBy,
                ];
                rowData.forEach((cell, i) => {
                    doc.text(cell, x + 2, y, { width: colWidths[i] - 4, align: 'left' });
                    x += colWidths[i];
                });
                y += 13;
            });
            doc.moveDown(2);
            const totalAmount = allReceipts.data.reduce((sum, d) => sum + (d.amount?.toNumber?.() || d.amount || 0), 0);
            doc.font('Helvetica-Bold').fontSize(10);
            doc.text(`Total Receipts: ${allReceipts.data.length} | Total Amount: ₹${totalAmount.toLocaleString('en-IN')}`, 30, y + 15);
            doc.fontSize(8).font('Helvetica').text('This is a computer-generated audit report. For internal use only.', 30, 560, { align: 'center', width: 760 });
            doc.end();
        });
    }
    async getReceiptRegister(filter, pagination) {
        const { page = 1, limit = 20, search = '' } = pagination;
        const skip = (page - 1) * limit;
        const dateWhere = this.buildDateFilter(filter);
        const searchWhere = search
            ? {
                OR: [
                    { donor: { firstName: { contains: search, mode: 'insensitive' } } },
                    { donor: { lastName: { contains: search, mode: 'insensitive' } } },
                    { receiptNumber: { contains: search, mode: 'insensitive' } },
                ],
            }
            : {};
        const where = {
            deletedAt: null,
            receiptNumber: { not: null },
            ...dateWhere,
            ...searchWhere,
        };
        const [donations, total] = await Promise.all([
            this.prisma.donation.findMany({
                where,
                include: {
                    donor: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            donorCode: true,
                        },
                    },
                },
                orderBy: { receiptNumber: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.donation.count({ where }),
        ]);
        return {
            data: donations.map((d) => ({
                id: d.id,
                receiptNumber: d.receiptNumber,
                donationDate: d.donationDate,
                donorName: `${d.donor.firstName} ${d.donor.lastName || ''}`.trim(),
                donorCode: d.donor.donorCode,
                amount: d.donationAmount,
                donationMode: d.donationMode,
                donationType: d.donationType,
            })),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async exportMonthlyDonationsExcel(filter) {
        const allDonations = await this.getMonthlyDonations(filter, { page: 1, limit: 10000 });
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Monthly Donations');
        sheet.columns = [
            { header: 'Date', key: 'date', width: 15 },
            { header: 'Receipt #', key: 'receipt', width: 20 },
            { header: 'Donor Code', key: 'donorCode', width: 18 },
            { header: 'Donor Name', key: 'donorName', width: 25 },
            { header: 'Type', key: 'type', width: 15 },
            { header: 'Mode', key: 'mode', width: 15 },
            { header: 'Amount (₹)', key: 'amount', width: 15 },
            { header: 'Remarks', key: 'remarks', width: 30 },
        ];
        sheet.getRow(1).font = { bold: true };
        sheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' },
        };
        allDonations.data.forEach((d) => {
            sheet.addRow({
                date: new Date(d.donationDate).toLocaleDateString('en-IN'),
                receipt: d.receiptNumber || '-',
                donorCode: d.donorCode,
                donorName: d.donorName,
                type: d.donationType,
                mode: d.donationMode,
                amount: d.amount?.toNumber?.() || d.amount || 0,
                remarks: d.remarks || '-',
            });
        });
        sheet.addRow({});
        const totalRow = sheet.addRow({
            date: 'TOTAL',
            amount: typeof allDonations.summary.totalAmount === 'object'
                ? allDonations.summary.totalAmount.toNumber()
                : allDonations.summary.totalAmount,
        });
        totalRow.font = { bold: true };
        const buffer = await workbook.xlsx.writeBuffer();
        return Buffer.from(buffer);
    }
    async exportMonthlyDonationsPdf(filter) {
        const allDonations = await this.getMonthlyDonations(filter, { page: 1, limit: 10000 });
        return new Promise((resolve) => {
            const doc = new pdfkit_1.default({ margin: 40, size: 'A4', layout: 'landscape' });
            const chunks = [];
            doc.on('data', (chunk) => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.fontSize(18).font('Helvetica-Bold').text('Monthly Donations Report', { align: 'center' });
            doc.moveDown(0.5);
            const dateRange = filter.startDate && filter.endDate
                ? `${new Date(filter.startDate).toLocaleDateString('en-IN')} to ${new Date(filter.endDate).toLocaleDateString('en-IN')}`
                : 'All Time';
            doc.fontSize(10).font('Helvetica').text(`Date Range: ${dateRange}`, { align: 'center' });
            doc.moveDown();
            const tableTop = doc.y;
            const colWidths = [70, 90, 80, 120, 70, 70, 80, 120];
            const headers = ['Date', 'Receipt #', 'Donor Code', 'Donor Name', 'Type', 'Mode', 'Amount', 'Remarks'];
            let x = 40;
            doc.font('Helvetica-Bold').fontSize(9);
            headers.forEach((header, i) => {
                doc.text(header, x, tableTop, { width: colWidths[i], align: 'left' });
                x += colWidths[i];
            });
            doc.moveTo(40, tableTop + 15).lineTo(760, tableTop + 15).stroke();
            let y = tableTop + 20;
            doc.font('Helvetica').fontSize(8);
            allDonations.data.slice(0, 50).forEach((d) => {
                if (y > 500) {
                    doc.addPage();
                    y = 40;
                }
                x = 40;
                const amountNum = d.amount?.toNumber?.() || d.amount || 0;
                const rowData = [
                    new Date(d.donationDate).toLocaleDateString('en-IN'),
                    d.receiptNumber || '-',
                    d.donorCode,
                    d.donorName.substring(0, 20),
                    d.donationType,
                    d.donationMode,
                    `₹${amountNum.toLocaleString('en-IN')}`,
                    (d.remarks || '-').substring(0, 20),
                ];
                rowData.forEach((cell, i) => {
                    doc.text(cell, x, y, { width: colWidths[i], align: 'left' });
                    x += colWidths[i];
                });
                y += 15;
            });
            doc.moveDown(2);
            doc.font('Helvetica-Bold').fontSize(10);
            const totalAmt = typeof allDonations.summary.totalAmount === 'object'
                ? allDonations.summary.totalAmount.toNumber()
                : allDonations.summary.totalAmount;
            doc.text(`Total: ₹${totalAmt.toLocaleString('en-IN')} | Count: ${allDonations.summary.totalCount}`, 40, y + 10);
            doc.end();
        });
    }
    async exportDonorSummaryExcel(filter) {
        const allDonors = await this.getDonorSummary(filter, { page: 1, limit: 10000 });
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Donor Summary');
        sheet.columns = [
            { header: 'Donor Code', key: 'donorCode', width: 18 },
            { header: 'Donor Name', key: 'donorName', width: 25 },
            { header: 'Category', key: 'category', width: 18 },
            { header: 'FY Total (₹)', key: 'fyTotal', width: 15 },
            { header: 'FY Count', key: 'fyCount', width: 12 },
            { header: 'Lifetime Total (₹)', key: 'lifetimeTotal', width: 18 },
            { header: 'Lifetime Count', key: 'lifetimeCount', width: 15 },
            { header: 'Last Donation', key: 'lastDonation', width: 15 },
        ];
        sheet.getRow(1).font = { bold: true };
        sheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' },
        };
        allDonors.data.forEach((d) => {
            sheet.addRow({
                donorCode: d.donorCode,
                donorName: d.donorName,
                category: d.category,
                fyTotal: d.fyTotal,
                fyCount: d.fyCount,
                lifetimeTotal: d.lifetimeTotal,
                lifetimeCount: d.lifetimeCount,
                lastDonation: d.lastDonation ? new Date(d.lastDonation).toLocaleDateString('en-IN') : '-',
            });
        });
        const buffer = await workbook.xlsx.writeBuffer();
        return Buffer.from(buffer);
    }
    async exportDonorSummaryPdf(filter) {
        const allDonors = await this.getDonorSummary(filter, { page: 1, limit: 10000 });
        return new Promise((resolve) => {
            const doc = new pdfkit_1.default({ margin: 40, size: 'A4', layout: 'landscape' });
            const chunks = [];
            doc.on('data', (chunk) => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.fontSize(18).font('Helvetica-Bold').text('Donor-wise Summary Report', { align: 'center' });
            doc.moveDown();
            const tableTop = doc.y;
            const colWidths = [80, 130, 100, 80, 60, 90, 70, 80];
            const headers = ['Donor Code', 'Donor Name', 'Category', 'FY Total', 'FY #', 'Lifetime', 'Life #', 'Last Donation'];
            let x = 40;
            doc.font('Helvetica-Bold').fontSize(9);
            headers.forEach((header, i) => {
                doc.text(header, x, tableTop, { width: colWidths[i], align: 'left' });
                x += colWidths[i];
            });
            doc.moveTo(40, tableTop + 15).lineTo(760, tableTop + 15).stroke();
            let y = tableTop + 20;
            doc.font('Helvetica').fontSize(8);
            allDonors.data.slice(0, 50).forEach((d) => {
                if (y > 500) {
                    doc.addPage();
                    y = 40;
                }
                x = 40;
                const rowData = [
                    d.donorCode,
                    d.donorName.substring(0, 22),
                    d.category,
                    `₹${d.fyTotal.toLocaleString('en-IN')}`,
                    d.fyCount.toString(),
                    `₹${d.lifetimeTotal.toLocaleString('en-IN')}`,
                    d.lifetimeCount.toString(),
                    d.lastDonation ? new Date(d.lastDonation).toLocaleDateString('en-IN') : '-',
                ];
                rowData.forEach((cell, i) => {
                    doc.text(cell, x, y, { width: colWidths[i], align: 'left' });
                    x += colWidths[i];
                });
                y += 15;
            });
            doc.end();
        });
    }
    async exportReceiptRegisterExcel(filter) {
        const allReceipts = await this.getReceiptRegister(filter, { page: 1, limit: 10000 });
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Receipt Register');
        sheet.columns = [
            { header: 'Receipt #', key: 'receipt', width: 22 },
            { header: 'Date', key: 'date', width: 15 },
            { header: 'Donor Code', key: 'donorCode', width: 18 },
            { header: 'Donor Name', key: 'donorName', width: 25 },
            { header: 'Amount (₹)', key: 'amount', width: 15 },
            { header: 'Mode', key: 'mode', width: 15 },
            { header: 'Type', key: 'type', width: 15 },
        ];
        sheet.getRow(1).font = { bold: true };
        sheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' },
        };
        allReceipts.data.forEach((d) => {
            sheet.addRow({
                receipt: d.receiptNumber,
                date: new Date(d.donationDate).toLocaleDateString('en-IN'),
                donorCode: d.donorCode,
                donorName: d.donorName,
                amount: d.amount?.toNumber?.() || d.amount || 0,
                mode: d.donationMode,
                type: d.donationType,
            });
        });
        const buffer = await workbook.xlsx.writeBuffer();
        return Buffer.from(buffer);
    }
    async exportReceiptRegisterPdf(filter) {
        const allReceipts = await this.getReceiptRegister(filter, { page: 1, limit: 10000 });
        return new Promise((resolve) => {
            const doc = new pdfkit_1.default({ margin: 40, size: 'A4', layout: 'landscape' });
            const chunks = [];
            doc.on('data', (chunk) => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.fontSize(18).font('Helvetica-Bold').text('Receipt Register (Audit)', { align: 'center' });
            doc.moveDown(0.5);
            const dateRange = filter.startDate && filter.endDate
                ? `${new Date(filter.startDate).toLocaleDateString('en-IN')} to ${new Date(filter.endDate).toLocaleDateString('en-IN')}`
                : 'All Time';
            doc.fontSize(10).font('Helvetica').text(`Date Range: ${dateRange}`, { align: 'center' });
            doc.moveDown();
            const tableTop = doc.y;
            const colWidths = [120, 80, 90, 150, 90, 80, 80];
            const headers = ['Receipt #', 'Date', 'Donor Code', 'Donor Name', 'Amount', 'Mode', 'Type'];
            let x = 40;
            doc.font('Helvetica-Bold').fontSize(9);
            headers.forEach((header, i) => {
                doc.text(header, x, tableTop, { width: colWidths[i], align: 'left' });
                x += colWidths[i];
            });
            doc.moveTo(40, tableTop + 15).lineTo(760, tableTop + 15).stroke();
            let y = tableTop + 20;
            doc.font('Helvetica').fontSize(8);
            allReceipts.data.slice(0, 50).forEach((d) => {
                if (y > 500) {
                    doc.addPage();
                    y = 40;
                }
                x = 40;
                const amountNum = d.amount?.toNumber?.() || d.amount || 0;
                const rowData = [
                    d.receiptNumber || '-',
                    new Date(d.donationDate).toLocaleDateString('en-IN'),
                    d.donorCode,
                    d.donorName.substring(0, 25),
                    `₹${amountNum.toLocaleString('en-IN')}`,
                    d.donationMode,
                    d.donationType,
                ];
                rowData.forEach((cell, i) => {
                    doc.text(cell, x, y, { width: colWidths[i], align: 'left' });
                    x += colWidths[i];
                });
                y += 15;
            });
            doc.end();
        });
    }
    async generateBoardSummaryPdf() {
        const currentFY = this.getFYDates('current');
        const lastFY = this.getFYDates('last');
        const fyYear = currentFY.start.getFullYear();
        const fyLabel = `FY ${fyYear}-${(fyYear + 1).toString().slice(-2)}`;
        const orgProfile = await this.orgProfileService.getProfile();
        const orgName = orgProfile.name;
        const primaryColor = orgProfile.brandingPrimaryColor || '#2E7D32';
        const [currentFYTotal, lastFYTotal, totalDonors, activeDonors, totalBeneficiaries, monthlyTrends, modeSplit, topDonorsShare,] = await Promise.all([
            this.prisma.donation.aggregate({
                where: {
                    deletedAt: null,
                    donationDate: { gte: currentFY.start, lte: currentFY.end },
                },
                _sum: { donationAmount: true },
                _count: true,
            }),
            this.prisma.donation.aggregate({
                where: {
                    deletedAt: null,
                    donationDate: { gte: lastFY.start, lte: lastFY.end },
                },
                _sum: { donationAmount: true },
            }),
            this.prisma.donor.count({ where: { deletedAt: null } }),
            this.prisma.donor.count({
                where: {
                    deletedAt: null,
                    donations: {
                        some: {
                            donationDate: { gte: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000) },
                        },
                    },
                },
            }),
            this.prisma.beneficiary.count({ where: { deletedAt: null } }),
            this.prisma.$queryRaw `
        SELECT TO_CHAR("donationDate", 'Mon YY') as month,
               SUM("donationAmount") as total
        FROM donations
        WHERE "deletedAt" IS NULL
          AND "donationDate" >= ${currentFY.start}
          AND "donationDate" <= ${currentFY.end}
        GROUP BY TO_CHAR("donationDate", 'Mon YY'), DATE_TRUNC('month', "donationDate")
        ORDER BY DATE_TRUNC('month', "donationDate")
        LIMIT 12
      `,
            this.prisma.donation.groupBy({
                by: ['donationMode'],
                where: {
                    deletedAt: null,
                    donationDate: { gte: currentFY.start, lte: currentFY.end },
                },
                _sum: { donationAmount: true },
                _count: true,
            }),
            this.prisma.$queryRaw `
        WITH top_donors AS (
          SELECT "donorId", SUM("donationAmount") as donor_total
          FROM donations
          WHERE "deletedAt" IS NULL
            AND "donationDate" >= ${currentFY.start}
            AND "donationDate" <= ${currentFY.end}
          GROUP BY "donorId"
          ORDER BY donor_total DESC
          LIMIT 5
        ),
        fy_total AS (
          SELECT SUM("donationAmount") as total
          FROM donations
          WHERE "deletedAt" IS NULL
            AND "donationDate" >= ${currentFY.start}
            AND "donationDate" <= ${currentFY.end}
        )
        SELECT COALESCE(
          ROUND(SUM(td.donor_total) * 100.0 / NULLIF((SELECT total FROM fy_total), 0), 1),
          0
        ) as share
        FROM top_donors td
      `,
        ]);
        const fyTotal = Number(currentFYTotal._sum.donationAmount || 0);
        const prevFyTotal = Number(lastFYTotal._sum.donationAmount || 0);
        const growthPct = prevFyTotal > 0 ? ((fyTotal - prevFyTotal) / prevFyTotal) * 100 : 0;
        const topShare = Number(topDonorsShare[0]?.share || 0);
        let peakMonth = '';
        let peakAmount = 0;
        monthlyTrends.forEach((m) => {
            const amt = Number(m.total || 0);
            if (amt > peakAmount) {
                peakAmount = amt;
                peakMonth = m.month;
            }
        });
        const cashModes = ['CASH'];
        const onlineModes = ['UPI', 'GPAY', 'PHONEPE', 'BANK_TRANSFER', 'NEFT', 'RTGS', 'IMPS', 'CHEQUE'];
        const kindModes = ['KIND', 'GROCERY', 'MEDICINES', 'PREPARED_FOOD', 'CLOTHING', 'HOUSEHOLD', 'VEHICLE', 'OTHER'];
        let cashTotal = 0, onlineTotal = 0, kindTotal = 0;
        modeSplit.forEach((ms) => {
            const amt = Number(ms._sum.donationAmount || 0);
            const mode = ms.donationMode || 'OTHER';
            if (cashModes.includes(mode))
                cashTotal += amt;
            else if (onlineModes.includes(mode))
                onlineTotal += amt;
            else
                kindTotal += amt;
        });
        const modeTotal = cashTotal + onlineTotal + kindTotal;
        const cashPct = modeTotal > 0 ? Math.round((cashTotal / modeTotal) * 100) : 0;
        const onlinePct = modeTotal > 0 ? Math.round((onlineTotal / modeTotal) * 100) : 0;
        const kindPct = modeTotal > 0 ? Math.round((kindTotal / modeTotal) * 100) : 0;
        const formatLakh = (amount) => {
            const lakh = amount / 100000;
            if (lakh >= 1) {
                return `Rs. ${lakh.toFixed(2)} Lakh`;
            }
            else if (amount >= 1000) {
                return `Rs. ${(amount / 1000).toFixed(2)}K`;
            }
            return `Rs. ${amount.toFixed(0)}`;
        };
        return new Promise((resolve) => {
            const doc = new pdfkit_1.default({
                margin: 30,
                size: 'A4',
                autoFirstPage: true,
            });
            const chunks = [];
            doc.on('data', (chunk) => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.rect(0, 0, 595, 55).fill(primaryColor);
            doc.fill('#FFFFFF').fontSize(16).font('Helvetica-Bold');
            doc.text(orgName, 30, 14, { align: 'center', width: 535 });
            doc.fontSize(10).font('Helvetica');
            doc.text(`Board Summary Report (${fyLabel})`, 30, 34, { align: 'center', width: 535 });
            let y = 65;
            doc.fill(primaryColor).fontSize(9).font('Helvetica-Bold');
            doc.text('KEY METRICS', 30, y);
            y += 12;
            const metricsBoxWidth = 125;
            const metricsGap = 10;
            const metricsStartX = 30;
            const metrics = [
                { label: 'Total Donations (FY)', value: formatLakh(fyTotal) },
                { label: 'Total Donors', value: totalDonors.toString() },
                { label: 'Active Donors', value: activeDonors.toString() },
                { label: 'Beneficiaries', value: totalBeneficiaries.toString() },
            ];
            metrics.forEach((m, i) => {
                const x = metricsStartX + i * (metricsBoxWidth + metricsGap);
                doc.rect(x, y, metricsBoxWidth, 38).fillAndStroke('#F5F5F5', '#E0E0E0');
                doc.fill('#1E4D3A').fontSize(12).font('Helvetica-Bold');
                doc.text(m.value, x + 3, y + 6, { width: metricsBoxWidth - 6, align: 'center' });
                doc.fill('#666666').fontSize(7).font('Helvetica');
                doc.text(m.label, x + 3, y + 24, { width: metricsBoxWidth - 6, align: 'center' });
            });
            y += 48;
            doc.fill(primaryColor).fontSize(9).font('Helvetica-Bold');
            doc.text('DONATION TRENDS', 30, y);
            y += 12;
            doc.fontSize(8).font('Helvetica-Bold').fill('#333333');
            doc.text('Monthly Donations:', 30, y);
            y += 10;
            const barMaxWidth = 150;
            const maxMonthlyAmt = Math.max(...monthlyTrends.map((m) => Number(m.total || 0)), 1);
            const trendsToShow = monthlyTrends.slice(0, 6);
            trendsToShow.forEach((m) => {
                const amt = Number(m.total || 0);
                const barWidth = Math.max(5, (amt / maxMonthlyAmt) * barMaxWidth);
                doc.fill('#666666').fontSize(7).font('Helvetica');
                doc.text(m.month, 30, y, { width: 42 });
                doc.rect(75, y, barWidth, 8).fill('#2E7D5A');
                doc.fill('#333333').fontSize(6);
                doc.text(formatLakh(amt), 80 + barWidth + 2, y);
                y += 10;
            });
            const modeX = 290;
            let modeY = y - (trendsToShow.length * 10) - 10;
            doc.fontSize(8).font('Helvetica-Bold').fill('#333333');
            doc.text('Payment Mode Split:', modeX, modeY);
            modeY += 12;
            const modeData = [
                { label: 'Cash', pct: cashPct, color: '#2E7D5A' },
                { label: 'Online', pct: onlinePct, color: '#4A90D9' },
                { label: 'Kind', pct: kindPct, color: '#D4A574' },
            ];
            modeData.forEach((md) => {
                const barWidth = Math.max(3, (md.pct / 100) * 110);
                doc.fill('#666666').fontSize(7).font('Helvetica');
                doc.text(md.label, modeX, modeY, { width: 38 });
                doc.rect(modeX + 42, modeY, barWidth, 8).fill(md.color);
                doc.fill('#333333').fontSize(7);
                doc.text(`${md.pct}%`, modeX + 47 + barWidth + 2, modeY);
                modeY += 11;
            });
            y = Math.max(y, modeY) + 8;
            doc.fill(primaryColor).fontSize(9).font('Helvetica-Bold');
            doc.text('KEY HIGHLIGHTS', 30, y);
            y += 12;
            const highlights = [];
            if (growthPct > 0) {
                highlights.push(`Donation growth: +${growthPct.toFixed(1)}% compared to previous FY`);
            }
            else if (growthPct < 0) {
                highlights.push(`Donation decline: ${growthPct.toFixed(1)}% compared to previous FY`);
            }
            else {
                highlights.push(`Donations maintained at similar levels as previous FY`);
            }
            highlights.push(`Top 5 donors contribute ${topShare.toFixed(1)}% of total FY donations`);
            if (peakMonth) {
                highlights.push(`Peak donation period: ${peakMonth} with ${formatLakh(peakAmount)} collected`);
            }
            highlights.push(`${activeDonors} of ${totalDonors} donors (${totalDonors > 0 ? Math.round((activeDonors / totalDonors) * 100) : 0}%) active in last 120 days`);
            doc.fontSize(8).font('Helvetica').fill('#333333');
            highlights.forEach((h) => {
                doc.circle(36, y + 3, 2).fill('#2E7D5A');
                doc.fill('#333333').text(h, 44, y, { width: 500 });
                y += 12;
            });
            y += 10;
            doc.rect(0, y, 595, 30).fill('#F5F5F5');
            doc.fill('#666666').fontSize(7).font('Helvetica');
            doc.text(`Generated on: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}`, 35, y + 8);
            doc.text('For internal board use only', 35, y + 18);
            doc.text(orgName, 400, y + 12, { align: 'right', width: 155 });
            doc.end();
        });
    }
};
exports.ReportsService = ReportsService;
exports.ReportsService = ReportsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        organization_profile_service_1.OrganizationProfileService])
], ReportsService);
//# sourceMappingURL=reports.service.js.map