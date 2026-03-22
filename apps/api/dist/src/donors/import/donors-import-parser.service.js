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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DonorsImportParserService = void 0;
const common_1 = require("@nestjs/common");
const XLSX = __importStar(require("xlsx"));
const ExcelJS = __importStar(require("exceljs"));
let DonorsImportParserService = class DonorsImportParserService {
    async parseImportFile(file) {
        const workbook = XLSX.read(file.buffer, { type: "buffer" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        if (data.length < 2) {
            throw new common_1.BadRequestException("File must have header row and at least one data row");
        }
        const headers = data[0].map((h) => String(h || "").trim());
        const rows = data
            .slice(1)
            .filter((row) => row.some((cell) => cell !== undefined && cell !== ""));
        return {
            headers,
            rows: rows.slice(0, 100),
            totalRows: rows.length,
        };
    }
    async generateBulkTemplate() {
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet("Donors");
        sheet.columns = [
            { header: "First Name", key: "firstName", width: 20 },
            { header: "Primary Phone", key: "primaryPhone", width: 20 },
            { header: "Email", key: "personalEmail", width: 25 },
        ];
        sheet.addRow({
            firstName: "Rajesh",
            primaryPhone: "9876543210",
            personalEmail: "rajesh@email.com",
        });
        const buffer = await workbook.xlsx.writeBuffer();
        return Buffer.from(buffer);
    }
};
exports.DonorsImportParserService = DonorsImportParserService;
exports.DonorsImportParserService = DonorsImportParserService = __decorate([
    (0, common_1.Injectable)()
], DonorsImportParserService);
//# sourceMappingURL=donors-import-parser.service.js.map