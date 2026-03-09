import { Injectable } from "@nestjs/common"
import PDFDocument from "pdfkit"
import * as ExcelJS from "exceljs"

@Injectable()
export class AnalyticsExportService {

  // ---------------- PDF SUMMARY ----------------
  async exportSummaryPdf(data: any): Promise<Buffer> {

    return new Promise((resolve) => {

      const doc = new PDFDocument({ margin: 40 })
      const chunks: Buffer[] = []

      doc.on("data", (chunk: Buffer) => chunks.push(chunk))
      doc.on("end", () => resolve(Buffer.concat(chunks)))

      doc.fontSize(18).text("Analytics Summary Report", { align: "center" })
      doc.moveDown()

      doc.fontSize(10).text(
        `Generated: ${new Date().toLocaleDateString("en-IN")}`
      )

      doc.moveDown()

      Object.entries(data || {}).forEach(([key, value]) => {
        doc.text(`${key}: ${value}`)
      })

      doc.end()
    })
  }

  // ---------------- DONATIONS XLSX ----------------
  async exportDonationsXlsx(data: any[] = []): Promise<Buffer> {

    const workbook = new ExcelJS.Workbook()
    const sheet = workbook.addWorksheet("Donations")

    sheet.columns = [
      { header: "Donor", key: "donor", width: 30 },
      { header: "Amount", key: "amount", width: 15 },
    ]

    data.forEach((d) => sheet.addRow(d))

    sheet.getRow(1).font = { bold: true }

    const buffer = await workbook.xlsx.writeBuffer()
    return Buffer.from(buffer)
  }

  // ---------------- DONATIONS DETAIL XLSX ----------------
  async exportDonationsDetailXlsx(filters: any): Promise<Buffer> {

    const workbook = new ExcelJS.Workbook()
    const sheet = workbook.addWorksheet("Donations Detail")

    sheet.columns = [
      { header: "Filter", key: "filter", width: 30 },
      { header: "Value", key: "value", width: 30 },
    ]

    Object.entries(filters || {}).forEach(([key, value]) => {
      sheet.addRow({ filter: key, value })
    })

    sheet.getRow(1).font = { bold: true }

    const buffer = await workbook.xlsx.writeBuffer()
    return Buffer.from(buffer)
  }

  // ---------------- RISK XLSX ----------------
  async exportRiskXlsx(data: any[] = []): Promise<Buffer> {

    const workbook = new ExcelJS.Workbook()
    const sheet = workbook.addWorksheet("Risk Donors")

    sheet.columns = [
      { header: "Donor Code", key: "donorCode", width: 18 },
      { header: "Donor Name", key: "donorName", width: 30 },
      { header: "Days Since Last Donation", key: "daysSinceLastDonation", width: 22 },
    ]

    data.forEach((d) => sheet.addRow(d))

    sheet.getRow(1).font = { bold: true }

    const buffer = await workbook.xlsx.writeBuffer()
    return Buffer.from(buffer)
  }

  // ---------------- BOARD SUMMARY PDF ----------------
  async exportBoardSummaryPdf(data: any = {}): Promise<Buffer> {

    return new Promise((resolve) => {

      const doc = new PDFDocument({ margin: 40 })
      const chunks: Buffer[] = []

      doc.on("data", (chunk: Buffer) => chunks.push(chunk))
      doc.on("end", () => resolve(Buffer.concat(chunks)))

      doc.fontSize(18).text("Board Summary Report", { align: "center" })

      doc.moveDown()

      Object.entries(data || {}).forEach(([key, value]) => {
        doc.fontSize(10).text(`${key}: ${value}`)
      })

      doc.end()
    })
  }

  // ---------------- HOME TOTALS XLSX ----------------
  async exportHomeTotalsXlsx(data: any[] = []): Promise<Buffer> {

    const workbook = new ExcelJS.Workbook()
    const sheet = workbook.addWorksheet("Home Totals")

    sheet.columns = [
      { header: "Home", key: "home", width: 30 },
      { header: "Total Amount", key: "total", width: 20 },
    ]

    data.forEach((d) => sheet.addRow(d))

    sheet.getRow(1).font = { bold: true }

    const buffer = await workbook.xlsx.writeBuffer()
    return Buffer.from(buffer)
  }

}
