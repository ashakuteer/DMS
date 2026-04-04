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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsExportService = void 0;
const common_1 = require("@nestjs/common");
const pdfkit_1 = __importDefault(require("pdfkit"));
const ExcelJS = __importStar(require("exceljs"));
let AnalyticsExportService = class AnalyticsExportService {
    async exportSummaryPdf(data) {
        return new Promise((resolve) => {
            const doc = new pdfkit_1.default({ margin: 40 });
            const chunks = [];
            doc.on("data", (chunk) => chunks.push(chunk));
            doc.on("end", () => resolve(Buffer.concat(chunks)));
            doc.fontSize(18).text("Analytics Summary Report", { align: "center" });
            doc.moveDown();
            doc.fontSize(10).text(`Generated: ${new Date().toLocaleDateString("en-IN")}`);
            doc.moveDown();
            Object.entries(data || {}).forEach(([key, value]) => {
                doc.text(`${key}: ${value}`);
            });
            doc.end();
        });
    }
    async exportDonationsXlsx(data = []) {
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet("Donations");
        sheet.columns = [
            { header: "Donor", key: "donor", width: 30 },
            { header: "Amount", key: "amount", width: 15 },
        ];
        data.forEach((d) => sheet.addRow(d));
        sheet.getRow(1).font = { bold: true };
        const buffer = await workbook.xlsx.writeBuffer();
        return Buffer.from(buffer);
    }
    async exportDonationsDetailXlsx(filters) {
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet("Donations Detail");
        sheet.columns = [
            { header: "Filter", key: "filter", width: 30 },
            { header: "Value", key: "value", width: 30 },
        ];
        Object.entries(filters || {}).forEach(([key, value]) => {
            sheet.addRow({ filter: key, value });
        });
        sheet.getRow(1).font = { bold: true };
        const buffer = await workbook.xlsx.writeBuffer();
        return Buffer.from(buffer);
    }
    async exportRiskXlsx(data = []) {
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet("Risk Donors");
        sheet.columns = [
            { header: "Donor Code", key: "donorCode", width: 18 },
            { header: "Donor Name", key: "donorName", width: 30 },
            { header: "Days Since Last Donation", key: "daysSinceLastDonation", width: 22 },
        ];
        data.forEach((d) => sheet.addRow(d));
        sheet.getRow(1).font = { bold: true };
        const buffer = await workbook.xlsx.writeBuffer();
        return Buffer.from(buffer);
    }
    async exportBoardSummaryPdf(data = {}) {
        return new Promise((resolve) => {
            const doc = new pdfkit_1.default({ margin: 40 });
            const chunks = [];
            doc.on("data", (chunk) => chunks.push(chunk));
            doc.on("end", () => resolve(Buffer.concat(chunks)));
            doc.fontSize(18).text("Board Summary Report", { align: "center" });
            doc.moveDown();
            Object.entries(data || {}).forEach(([key, value]) => {
                doc.fontSize(10).text(`${key}: ${value}`);
            });
            doc.end();
        });
    }
    async exportHomeTotalsXlsx(data = []) {
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet("Home Totals");
        sheet.columns = [
            { header: "Home", key: "home", width: 30 },
            { header: "Total Amount", key: "total", width: 20 },
        ];
        data.forEach((d) => sheet.addRow(d));
        sheet.getRow(1).font = { bold: true };
        const buffer = await workbook.xlsx.writeBuffer();
        return Buffer.from(buffer);
    }
};
exports.AnalyticsExportService = AnalyticsExportService;
exports.AnalyticsExportService = AnalyticsExportService = __decorate([
    (0, common_1.Injectable)()
], AnalyticsExportService);
//# sourceMappingURL=analytics-export.service.js.map