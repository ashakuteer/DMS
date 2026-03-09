import { Injectable } from "@nestjs/common";
import PDFDocument from "pdfkit";
import * as ExcelJS from "exceljs";

@Injectable()
export class AnalyticsExportService {

  // ---------------- PDF SUMMARY ----------------
  async exportSummaryPdf(data: any): Promise<Buffer> {

    return new Promise((resolve) => {

      const doc = new PDFDocument();
      const chunks: Buffer[] = [];

      doc.on("data", (chunk: Buffer) => chunks.push(chunk));

      doc.fontSize(18).text("Analytics Summary Report");
      doc.moveDown();

      doc.fontSize(10).text(JSON.stringify(data, null, 2));

      doc.end();

      doc.on("end", () => resolve(Buffer.concat(chunks)));
    });
  }


  // ---------------- DONATIONS XLSX ----------------
  async exportDonationsXlsx(data: any[] = []): Promise<Buffer> {

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Donations");

    sheet.columns = [
      { header: "Donor", key: "donor", width: 30 },
      { header: "Amount", key: "amount", width: 15 },
    ];

    data.forEach((d) => sheet.addRow(d));

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }


  // ---------------- DONATIONS DETAIL XLSX ----------------
  async exportDonationsDetailXlsx(filters: any): Promise<Buffer> {

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Donations Detail");

    sheet.columns = [
      { header: "Filter", key: "filter", width: 30 },
      { header: "Value", key: "value", width: 30 },
    ];

    Object.keys(filters || {}).forEach((key) => {
      sheet.addRow({ filter: key, value: filters[key] });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }


  // ---------------- RISK XLSX ----------------
  async exportRiskXlsx(): Promise<Buffer> {

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Risk Donors");

    sheet.columns = [
      { header: "Donor", key: "donor", width: 30 },
      { header: "Risk Level", key: "risk", width: 15 },
    ];

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }


  // ---------------- BOARD SUMMARY PDF ----------------
  async exportBoardSummaryPdf(): Promise<Buffer> {

    return new Promise((resolve) => {

      const doc = new PDFDocument();
      const chunks: Buffer[] = [];

      doc.on("data", (chunk: Buffer) => chunks.push(chunk));

      doc.fontSize(18).text("Board Summary Report");

      doc.end();

      doc.on("end", () => resolve(Buffer.concat(chunks)));
    });
  }


  // ---------------- HOME TOTALS XLSX ----------------
  async exportHomeTotalsXlsx(): Promise<Buffer> {

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Home Totals");

    sheet.columns = [
      { header: "Home", key: "home", width: 30 },
      { header: "Total", key: "total", width: 20 },
    ];

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

}
