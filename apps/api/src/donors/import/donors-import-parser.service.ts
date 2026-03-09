import { Injectable, BadRequestException } from "@nestjs/common";
import * as XLSX from "xlsx";
import * as ExcelJS from "exceljs";

@Injectable()
export class DonorsImportParserService {

  async parseImportFile(file: Express.Multer.File) {
    const workbook = XLSX.read(file.buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];

    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

    if (data.length < 2) {
      throw new BadRequestException(
        "File must have header row and at least one data row",
      );
    }

    const headers = data[0].map((h: any) => String(h || "").trim());

    const rows = data
      .slice(1)
      .filter((row) =>
        row.some((cell) => cell !== undefined && cell !== ""),
      );

    return {
      headers,
      rows: rows.slice(0, 100),
      totalRows: rows.length,
    };
  }

  async generateBulkTemplate(): Promise<Buffer> {
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
}
