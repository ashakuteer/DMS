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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DonorsExportService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const client_1 = require("@prisma/client");
const ExcelJS = __importStar(require("exceljs"));
let DonorsExportService = class DonorsExportService {
    constructor(prisma, auditService) {
        this.prisma = prisma;
        this.auditService = auditService;
    }
    async exportDonors(user, filters = {}, ipAddress, userAgent) {
        if (user.role !== client_1.Role.ADMIN) {
            throw new common_1.ForbiddenException("Only administrators can export donor data");
        }
        const where = { isDeleted: false };
        if (filters.search) {
            where.OR = [
                { firstName: { contains: filters.search, mode: "insensitive" } },
                { lastName: { contains: filters.search, mode: "insensitive" } },
                { donorCode: { contains: filters.search, mode: "insensitive" } },
            ];
        }
        const donors = await this.prisma.donor.findMany({
            where,
            include: {
                assignedToUser: { select: { id: true, name: true } },
                _count: { select: { donations: true } },
            },
            orderBy: { createdAt: "desc" },
        });
        await this.auditService.logDataExport(user.id, "Donors", filters, donors.length, ipAddress, userAgent);
        return donors;
    }
    async exportMasterDonorExcel(user, filters = {}, ipAddress, userAgent) {
        if (user.role !== client_1.Role.ADMIN) {
            throw new common_1.ForbiddenException("Only administrators can export donor data");
        }
        const where = { isDeleted: false };
        if (filters.donorType && filters.donorType !== "all") {
            where.category = filters.donorType;
        }
        const donors = await this.prisma.donor.findMany({
            where,
            include: {
                assignedToUser: { select: { name: true } },
                createdBy: { select: { name: true } },
                specialOccasions: {
                    select: {
                        type: true,
                        day: true,
                        month: true,
                        relatedPersonName: true,
                    },
                },
                familyMembers: {
                    select: { name: true, relationType: true, phone: true },
                },
                sponsorships: {
                    where: { isActive: true },
                    select: {
                        status: true,
                        amount: true,
                        frequency: true,
                        sponsorshipType: true,
                        beneficiary: {
                            select: { fullName: true, homeType: true, code: true },
                        },
                    },
                },
                donations: {
                    where: { isDeleted: false },
                    select: {
                        donationAmount: true,
                        donationDate: true,
                        donationType: true,
                        donationHomeType: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });
        let filtered = donors;
        if (filters.home && filters.home !== "all") {
            filtered = filtered.filter((d) => d.donations.some((don) => don.donationHomeType === filters.home) ||
                d.sponsorships.some((s) => s.beneficiary?.homeType === filters.home));
        }
        const now = new Date();
        const oneYearAgo = new Date(now);
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        if (filters.activity === "active") {
            filtered = filtered.filter((d) => d.donations.some((don) => new Date(don.donationDate) >= oneYearAgo) || d.sponsorships.some((s) => s.status === "ACTIVE"));
        }
        else if (filters.activity === "inactive") {
            filtered = filtered.filter((d) => !d.donations.some((don) => new Date(don.donationDate) >= oneYearAgo) && !d.sponsorships.some((s) => s.status === "ACTIVE"));
        }
        const categoryLabels = {
            INDIVIDUAL: "Individual",
            NGO: "NGO",
            CSR_REP: "CSR Rep",
            WHATSAPP_GROUP: "WhatsApp Group",
            SOCIAL_MEDIA_PERSON: "Social Media",
            CROWD_PULLER: "Crowd Puller",
            VISITOR_ENQUIRY: "Visitor/Enquiry",
        };
        const occasionLabels = {
            DOB_SELF: "Birthday",
            DOB_SPOUSE: "Spouse Birthday",
            DOB_CHILD: "Child Birthday",
            ANNIVERSARY: "Anniversary",
            DEATH_ANNIVERSARY: "Death Anniversary",
            OTHER: "Other",
        };
        const homeLabels = {
            ORPHAN_GIRLS: "Girls Home",
            BLIND_BOYS: "Blind Boys Home",
            OLD_AGE: "Old Age Home",
            GIRLS_HOME: "Girls Home",
            BLIND_BOYS_HOME: "Blind Boys Home",
            OLD_AGE_HOME: "Old Age Home",
            GENERAL: "General",
        };
        const frequencyLabels = {
            MONTHLY: "Monthly",
            QUARTERLY: "Quarterly",
            YEARLY: "Yearly",
            OCCASIONAL: "Occasional",
            ONE_TIME: "One Time",
        };
        const sourceLabels = {
            SOCIAL_MEDIA: "Social Media",
            GOOGLE: "Google",
            JUSTDIAL: "JustDial",
            FRIEND: "Friend",
            SPONSOR: "Sponsor",
            WEBSITE: "Website",
            WALK_IN: "Walk-In",
            REFERRAL: "Referral",
            OTHER: "Other",
        };
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet("Master Donor List");
        sheet.columns = [
            { header: "Donor Code", key: "donorCode", width: 14 },
            { header: "First Name", key: "firstName", width: 16 },
            { header: "Middle Name", key: "middleName", width: 14 },
            { header: "Last Name", key: "lastName", width: 16 },
            { header: "Category", key: "category", width: 16 },
            { header: "Gender", key: "gender", width: 10 },
            { header: "Age", key: "age", width: 8 },
            { header: "Profession", key: "profession", width: 18 },
            { header: "Religion", key: "religion", width: 14 },
            { header: "Primary Phone", key: "primaryPhone", width: 16 },
            { header: "WhatsApp Phone", key: "whatsappPhone", width: 16 },
            { header: "Alternate Phone", key: "alternatePhone", width: 16 },
            { header: "Personal Email", key: "personalEmail", width: 26 },
            { header: "Official Email", key: "officialEmail", width: 26 },
            { header: "Address", key: "address", width: 30 },
            { header: "City", key: "city", width: 16 },
            { header: "State", key: "state", width: 14 },
            { header: "Country", key: "country", width: 12 },
            { header: "Pincode", key: "pincode", width: 10 },
            { header: "PAN", key: "pan", width: 14 },
            { header: "Pref: Email", key: "prefEmail", width: 10 },
            { header: "Pref: WhatsApp", key: "prefWhatsapp", width: 12 },
            { header: "Pref: SMS", key: "prefSms", width: 10 },
            { header: "Pref: Reminders", key: "prefReminders", width: 12 },
            { header: "Donation Frequency", key: "donationFrequency", width: 16 },
            { header: "Source", key: "source", width: 16 },
            { header: "Income Spectrum", key: "incomeSpectrum", width: 14 },
            { header: "Special Days", key: "specialDays", width: 40 },
            { header: "Family Members", key: "familyMembers", width: 36 },
            { header: "Active Sponsorships", key: "sponsorships", width: 40 },
            {
                header: "Sponsorship Total (/mo)",
                key: "sponsorshipMonthlyTotal",
                width: 18,
            },
            { header: "Lifetime Donations", key: "lifetimeDonationCount", width: 16 },
            {
                header: "Lifetime Total (INR)",
                key: "lifetimeDonationTotal",
                width: 18,
            },
            { header: "Last Donation Date", key: "lastDonationDate", width: 16 },
            { header: "Homes Donated To", key: "homesDonatedTo", width: 24 },
            { header: "Health Score", key: "healthScore", width: 12 },
            { header: "Health Status", key: "healthStatus", width: 12 },
            { header: "Assigned To", key: "assignedTo", width: 18 },
            { header: "Notes", key: "notes", width: 30 },
            { header: "Created Date", key: "createdAt", width: 14 },
        ];
        for (const d of filtered) {
            const specialDaysStr = d.specialOccasions
                .map((o) => {
                const label = occasionLabels[o.type] || o.type;
                const dateStr = `${o.day}/${o.month}`;
                const person = o.relatedPersonName ? ` (${o.relatedPersonName})` : "";
                return `${label}: ${dateStr}${person}`;
            })
                .join("; ");
            const familyStr = d.familyMembers
                .map((f) => `${f.name} (${f.relationType})${f.phone ? " - " + f.phone : ""}`)
                .join("; ");
            const sponsorshipsStr = d.sponsorships
                .map((s) => {
                const benefName = s.beneficiary?.fullName || "Unknown";
                const home = s.beneficiary?.homeType
                    ? homeLabels[s.beneficiary.homeType] || s.beneficiary.homeType
                    : "";
                const amt = s.amount ? Number(s.amount) : 0;
                return `${benefName} (${home}) - ₹${amt}/${s.frequency || "Monthly"} [${s.status}]`;
            })
                .join("; ");
            const sponsorshipMonthly = d.sponsorships
                .filter((s) => s.status === "ACTIVE")
                .reduce((sum, s) => sum + (s.amount ? Number(s.amount) : 0), 0);
            const lifetimeTotal = d.donations.reduce((sum, don) => sum + (don.donationAmount ? Number(don.donationAmount) : 0), 0);
            const sortedDonations = [...d.donations].sort((a, b) => new Date(b.donationDate).getTime() -
                new Date(a.donationDate).getTime());
            const lastDonDate = sortedDonations[0]?.donationDate;
            const homes = [
                ...new Set(d.donations
                    .filter((don) => don.donationHomeType)
                    .map((don) => homeLabels[don.donationHomeType] || don.donationHomeType)),
            ].join(", ");
            sheet.addRow({
                donorCode: d.donorCode,
                firstName: d.firstName,
                middleName: d.middleName || "",
                lastName: d.lastName || "",
                category: categoryLabels[d.category] || d.category,
                gender: d.gender || "",
                age: d.approximateAge || "",
                profession: d.profession || "",
                religion: d.religion || "",
                primaryPhone: d.primaryPhone || "",
                whatsappPhone: d.whatsappPhone || "",
                alternatePhone: d.alternatePhone || "",
                personalEmail: d.personalEmail || "",
                officialEmail: d.officialEmail || "",
                address: d.address || "",
                city: d.city || "",
                state: d.state || "",
                country: d.country || "",
                pincode: d.pincode || "",
                pan: d.pan || "",
                prefEmail: d.prefEmail ? "Yes" : "No",
                prefWhatsapp: d.prefWhatsapp ? "Yes" : "No",
                prefSms: d.prefSms ? "Yes" : "No",
                prefReminders: d.prefReminders ? "Yes" : "No",
                donationFrequency: d.donationFrequency
                    ? frequencyLabels[d.donationFrequency] || d.donationFrequency
                    : "",
                source: d.sourceOfDonor
                    ? sourceLabels[d.sourceOfDonor] || d.sourceOfDonor
                    : "",
                incomeSpectrum: d.incomeSpectrum || "",
                specialDays: specialDaysStr,
                familyMembers: familyStr,
                sponsorships: sponsorshipsStr,
                sponsorshipMonthlyTotal: sponsorshipMonthly,
                lifetimeDonationCount: d.donations.length,
                lifetimeDonationTotal: lifetimeTotal,
                lastDonationDate: lastDonDate
                    ? new Date(lastDonDate).toLocaleDateString("en-IN")
                    : "",
                homesDonatedTo: homes,
                healthScore: d.healthScore,
                healthStatus: d.healthStatus,
                assignedTo: d.assignedToUser?.name || "",
                notes: d.notes || "",
                createdAt: d.createdAt.toLocaleDateString("en-IN"),
            });
        }
        const headerRow = sheet.getRow(1);
        headerRow.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FF1E4D3A" },
        };
        headerRow.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
        headerRow.alignment = { vertical: "middle", wrapText: true };
        headerRow.height = 28;
        sheet.getColumn("lifetimeDonationTotal").numFmt = "#,##0.00";
        sheet.getColumn("sponsorshipMonthlyTotal").numFmt = "#,##0.00";
        sheet.autoFilter = {
            from: { row: 1, column: 1 },
            to: { row: 1, column: sheet.columns.length },
        };
        await this.auditService.logDataExport(user.id, "Master Donor Excel", filters, filtered.length, ipAddress, userAgent);
        const buf = await workbook.xlsx.writeBuffer();
        return Buffer.from(buf);
    }
};
exports.DonorsExportService = DonorsExportService;
exports.DonorsExportService = DonorsExportService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService])
], DonorsExportService);
//# sourceMappingURL=donors.export.service.js.map