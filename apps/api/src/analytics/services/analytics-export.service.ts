import { Injectable } from "@nestjs/common"
import PDFDocument from "pdfkit"
import * as ExcelJS from "exceljs"

@Injectable()
export class AnalyticsExportService {
  async exportSummaryPdf(data: any): Promise<Buffer> {
    return new Promise((resolve) => {
      const doc = new PDFDocument()

      const chunks: Buffer[] = []

      doc.on("data", (chunk: Buffer) => chunks.push(chunk))

      doc.text("Analytics Summary")

      doc.text(JSON.stringify(data, null, 2))

      doc.end()

      doc.on("end", () => {
        resolve(Buffer.concat(chunks))
      })
    })
  }

  async exportDonationsXlsx(data: any[]): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook()

    const sheet = workbook.addWorksheet("Donations")

    sheet.columns = [
      { header: "Donor", key: "donor", width: 25 },
      { header: "Amount", key: "amount", width: 15 },
    ]

    data.forEach((d) => sheet.addRow(d))

    const buffer = await workbook.xlsx.writeBuffer()

    return Buffer.from(buffer)
  }
}
