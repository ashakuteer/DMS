import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrganizationProfileService } from '../organization-profile/organization-profile.service';
import { HomeType, BeneficiaryStatus, HealthEventSeverity } from '@prisma/client';
import * as ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

export interface HomeSummaryData {
  month: number;
  year: number;
  monthLabel: string;
  generatedAt: string;
  homes: HomeStat[];
  totals: {
    totalBeneficiaries: number;
    totalActive: number;
    totalInactive: number;
    totalHealthNormal: number;
    totalHealthSick: number;
    totalHealthHospitalized: number;
    totalSchoolGoing: number;
    totalCollegeGoing: number;
    totalNewJoinings: number;
    totalExits: number;
  };
}

export interface HomeStat {
  homeType: string;
  homeLabel: string;
  totalBeneficiaries: number;
  activeBeneficiaries: number;
  inactiveBeneficiaries: number;
  healthNormal: number;
  healthSick: number;
  healthHospitalized: number;
  schoolGoing: number;
  collegeGoing: number;
  newJoinings: number;
  exits: number;
}

@Injectable()
export class HomeSummaryService {
  private readonly logger = new Logger(HomeSummaryService.name);

  constructor(
    private prisma: PrismaService,
    private orgProfileService: OrganizationProfileService,
  ) {}

  private homeLabel(type: string): string {
    const map: Record<string, string> = {
      ORPHAN_GIRLS: 'Orphan Girls Home',
      BLIND_BOYS: 'Blind Boys Home',
      OLD_AGE: 'Old Age Home',
    };
    return map[type] || type.replace(/_/g, ' ');
  }

  private monthLabel(month: number, year: number): string {
    const date = new Date(year, month - 1, 1);
    return date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  }

  async getSummary(month: number, year: number): Promise<HomeSummaryData> {
    if (month < 1 || month > 12) throw new BadRequestException('Invalid month');
    if (year < 2000 || year > 2100) throw new BadRequestException('Invalid year');

    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0, 23, 59, 59, 999);

    const homeTypes = Object.values(HomeType);
    const homes: HomeStat[] = [];

    for (const homeType of homeTypes) {
      const allBeneficiaries = await this.prisma.beneficiary.findMany({
        where: {
          homeType,
          isDeleted: false,
          createdAt: { lte: monthEnd },
        },
        select: {
          id: true,
          status: true,
          educationClassOrRole: true,
          schoolOrCollege: true,
          currentHealthStatus: true,
          joinDate: true,
          createdAt: true,
        },
      });

      const activeBeneficiaries = allBeneficiaries.filter(b => b.status === BeneficiaryStatus.ACTIVE);
      const inactiveBeneficiaries = allBeneficiaries.filter(b => b.status === BeneficiaryStatus.INACTIVE);
      const beneficiaryIds = allBeneficiaries.map(b => b.id);

      const healthEvents = await this.prisma.beneficiaryHealthEvent.findMany({
        where: {
          beneficiaryId: { in: beneficiaryIds },
          eventDate: { gte: monthStart, lte: monthEnd },
        },
        select: {
          beneficiaryId: true,
          severity: true,
          title: true,
        },
      });

      const sickBeneficiaryIds = new Set<string>();
      const hospitalizedBeneficiaryIds = new Set<string>();

      for (const event of healthEvents) {
        if (event.severity === HealthEventSeverity.CRITICAL) {
          hospitalizedBeneficiaryIds.add(event.beneficiaryId);
        } else if (event.severity === HealthEventSeverity.HIGH || event.severity === HealthEventSeverity.MEDIUM) {
          sickBeneficiaryIds.add(event.beneficiaryId);
        }
      }

      for (const id of hospitalizedBeneficiaryIds) {
        sickBeneficiaryIds.delete(id);
      }

      const healthHospitalized = hospitalizedBeneficiaryIds.size;
      const healthSick = sickBeneficiaryIds.size;
      const healthNormal = activeBeneficiaries.length - healthSick - healthHospitalized;

      let schoolGoing = 0;
      let collegeGoing = 0;
      for (const b of activeBeneficiaries) {
        const edu = (b.educationClassOrRole || '').toLowerCase();
        const school = (b.schoolOrCollege || '').toLowerCase();
        if (edu.includes('college') || edu.includes('degree') || edu.includes('b.') || edu.includes('m.') || school.includes('college') || school.includes('university')) {
          collegeGoing++;
        } else if (edu || school) {
          schoolGoing++;
        }
      }

      const newJoinings = allBeneficiaries.filter(b => {
        const joinDate = b.joinDate || b.createdAt;
        return joinDate >= monthStart && joinDate <= monthEnd;
      }).length;

      const exitedBeneficiaries = await this.prisma.beneficiary.count({
        where: {
          homeType,
          isDeleted: false,
          status: BeneficiaryStatus.INACTIVE,
          updatedAt: { gte: monthStart, lte: monthEnd },
        },
      });

      homes.push({
        homeType,
        homeLabel: this.homeLabel(homeType),
        totalBeneficiaries: allBeneficiaries.length,
        activeBeneficiaries: activeBeneficiaries.length,
        inactiveBeneficiaries: inactiveBeneficiaries.length,
        healthNormal: Math.max(0, healthNormal),
        healthSick,
        healthHospitalized,
        schoolGoing,
        collegeGoing,
        newJoinings,
        exits: exitedBeneficiaries,
      });
    }

    const totals = {
      totalBeneficiaries: homes.reduce((s, h) => s + h.totalBeneficiaries, 0),
      totalActive: homes.reduce((s, h) => s + h.activeBeneficiaries, 0),
      totalInactive: homes.reduce((s, h) => s + h.inactiveBeneficiaries, 0),
      totalHealthNormal: homes.reduce((s, h) => s + h.healthNormal, 0),
      totalHealthSick: homes.reduce((s, h) => s + h.healthSick, 0),
      totalHealthHospitalized: homes.reduce((s, h) => s + h.healthHospitalized, 0),
      totalSchoolGoing: homes.reduce((s, h) => s + h.schoolGoing, 0),
      totalCollegeGoing: homes.reduce((s, h) => s + h.collegeGoing, 0),
      totalNewJoinings: homes.reduce((s, h) => s + h.newJoinings, 0),
      totalExits: homes.reduce((s, h) => s + h.exits, 0),
    };

    return {
      month,
      year,
      monthLabel: this.monthLabel(month, year),
      generatedAt: new Date().toISOString(),
      homes,
      totals,
    };
  }

  async generatePdf(month: number, year: number): Promise<Buffer> {
    const [data, orgProfile] = await Promise.all([
      this.getSummary(month, year),
      this.orgProfileService.getProfile(),
    ]);
    const orgName = orgProfile.name;
    const primaryColor = orgProfile.brandingPrimaryColor || '#2E7D32';

    return new Promise((resolve) => {
      const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      doc.rect(0, 0, 842, 55).fill(primaryColor);
      doc.fill('#FFFFFF').fontSize(16).font('Helvetica-Bold');
      doc.text(orgName, 40, 12, { align: 'center', width: 762 });
      doc.fontSize(11).font('Helvetica');
      doc.text(`Home-wise Monthly Summary — ${data.monthLabel}`, 40, 33, { align: 'center', width: 762 });

      doc.fill('#333333');
      doc.y = 70;
      doc.fontSize(9).font('Helvetica');
      doc.text(`Generated: ${new Date().toLocaleDateString('en-IN', { dateStyle: 'long' })}`, 40, 70);
      doc.moveDown(1.5);

      this.pdfSection(doc, 'Beneficiary Count by Home');
      const headers1 = ['Home', 'Total', 'Active', 'Inactive'];
      const rows1 = data.homes.map(h => [h.homeLabel, `${h.totalBeneficiaries}`, `${h.activeBeneficiaries}`, `${h.inactiveBeneficiaries}`]);
      rows1.push(['TOTAL', `${data.totals.totalBeneficiaries}`, `${data.totals.totalActive}`, `${data.totals.totalInactive}`]);
      this.pdfTable(doc, headers1, rows1, true);

      doc.moveDown(1);
      this.pdfSection(doc, 'Health Summary');
      const headers2 = ['Home', 'Normal', 'Sick', 'Hospitalized'];
      const rows2 = data.homes.map(h => [h.homeLabel, `${h.healthNormal}`, `${h.healthSick}`, `${h.healthHospitalized}`]);
      rows2.push(['TOTAL', `${data.totals.totalHealthNormal}`, `${data.totals.totalHealthSick}`, `${data.totals.totalHealthHospitalized}`]);
      this.pdfTable(doc, headers2, rows2, true);

      if (doc.y > 400) doc.addPage();
      else doc.moveDown(1);
      this.pdfSection(doc, 'Education Summary');
      const headers3 = ['Home', 'School Going', 'College Going'];
      const rows3 = data.homes.map(h => [h.homeLabel, `${h.schoolGoing}`, `${h.collegeGoing}`]);
      rows3.push(['TOTAL', `${data.totals.totalSchoolGoing}`, `${data.totals.totalCollegeGoing}`]);
      this.pdfTable(doc, headers3, rows3, true);

      doc.moveDown(1);
      this.pdfSection(doc, 'New Joinings & Exits');
      const headers4 = ['Home', 'New Joinings', 'Exits'];
      const rows4 = data.homes.map(h => [h.homeLabel, `${h.newJoinings}`, `${h.exits}`]);
      rows4.push(['TOTAL', `${data.totals.totalNewJoinings}`, `${data.totals.totalExits}`]);
      this.pdfTable(doc, headers4, rows4, true);

      doc.moveDown(2);
      doc.fontSize(7).fillColor('#999999').text('This report was auto-generated by NGO DMS.', { align: 'center' });
      doc.end();
    });
  }

  private pdfSection(doc: PDFKit.PDFDocument, title: string) {
    doc.moveDown(0.3);
    doc.fontSize(11).font('Helvetica-Bold').fill('#1E4D3A').text(title, 40);
    doc.moveTo(40, doc.y).lineTo(802, doc.y).strokeColor('#1E4D3A').lineWidth(1).stroke();

    doc.moveDown(0.3);
    doc.fill('#333333');
  }

  private pdfTable(doc: PDFKit.PDFDocument, headers: string[], rows: string[][], highlightLast = false) {
    const tableWidth = 762;
    const colW = tableWidth / headers.length;
    const startX = 40;
    let y = doc.y;

    doc.fontSize(9).font('Helvetica-Bold');
    doc.rect(startX, y, tableWidth, 18).fill('#E8E8E8');
    doc.fill('#333333');
    for (let i = 0; i < headers.length; i++) {
      doc.text(headers[i], startX + i * colW + 6, y + 4, { width: colW - 12, lineBreak: false });
    }
    y += 18;

    doc.font('Helvetica').fontSize(9);
    for (let ri = 0; ri < rows.length; ri++) {
      const row = rows[ri];
      const isLast = ri === rows.length - 1 && highlightLast;
      if (isLast) {
        doc.rect(startX, y, tableWidth, 17).fill('#F0F7F4');
        doc.fill('#1E4D3A').font('Helvetica-Bold');
      } else {
        doc.fill('#333333').font('Helvetica');
      }
      for (let i = 0; i < row.length; i++) {
        doc.text(row[i] || '', startX + i * colW + 6, y + 4, { width: colW - 12, lineBreak: false });
      }
      y += 17;
    }
    doc.y = y + 5;
    doc.fill('#333333').font('Helvetica');
  }

  async generateExcel(month: number, year: number): Promise<Buffer> {
    const data = await this.getSummary(month, year);
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'NGO DMS';
    workbook.created = new Date();

    const headerStyle: Partial<ExcelJS.Style> = {
      font: { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E4D3A' } },
      alignment: { horizontal: 'center', vertical: 'middle' },
    };

    const totalStyle: Partial<ExcelJS.Style> = {
      font: { bold: true, size: 11 },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F7F4' } },
    };

    const overviewSheet = workbook.addWorksheet('Overview');
    overviewSheet.columns = [
      { header: 'Home', key: 'home', width: 25 },
      { header: 'Total', key: 'total', width: 12 },
      { header: 'Active', key: 'active', width: 12 },
      { header: 'Inactive', key: 'inactive', width: 12 },
      { header: 'Normal', key: 'normal', width: 12 },
      { header: 'Sick', key: 'sick', width: 12 },
      { header: 'Hospitalized', key: 'hospitalized', width: 15 },
      { header: 'School Going', key: 'school', width: 15 },
      { header: 'College Going', key: 'college', width: 15 },
      { header: 'New Joinings', key: 'joinings', width: 15 },
      { header: 'Exits', key: 'exits', width: 12 },
    ];
    overviewSheet.getRow(1).eachCell((cell) => Object.assign(cell, { style: headerStyle }));

    for (const h of data.homes) {
      overviewSheet.addRow({
        home: h.homeLabel,
        total: h.totalBeneficiaries,
        active: h.activeBeneficiaries,
        inactive: h.inactiveBeneficiaries,
        normal: h.healthNormal,
        sick: h.healthSick,
        hospitalized: h.healthHospitalized,
        school: h.schoolGoing,
        college: h.collegeGoing,
        joinings: h.newJoinings,
        exits: h.exits,
      });
    }

    const totalRow = overviewSheet.addRow({
      home: 'TOTAL',
      total: data.totals.totalBeneficiaries,
      active: data.totals.totalActive,
      inactive: data.totals.totalInactive,
      normal: data.totals.totalHealthNormal,
      sick: data.totals.totalHealthSick,
      hospitalized: data.totals.totalHealthHospitalized,
      school: data.totals.totalSchoolGoing,
      college: data.totals.totalCollegeGoing,
      joinings: data.totals.totalNewJoinings,
      exits: data.totals.totalExits,
    });
    totalRow.eachCell((cell) => Object.assign(cell, { style: totalStyle }));

    const healthSheet = workbook.addWorksheet('Health Summary');
    healthSheet.columns = [
      { header: 'Home', key: 'home', width: 25 },
      { header: 'Normal', key: 'normal', width: 15 },
      { header: 'Sick', key: 'sick', width: 15 },
      { header: 'Hospitalized', key: 'hospitalized', width: 15 },
    ];
    healthSheet.getRow(1).eachCell((cell) => Object.assign(cell, { style: headerStyle }));
    for (const h of data.homes) {
      healthSheet.addRow({ home: h.homeLabel, normal: h.healthNormal, sick: h.healthSick, hospitalized: h.healthHospitalized });
    }
    const hTotal = healthSheet.addRow({ home: 'TOTAL', normal: data.totals.totalHealthNormal, sick: data.totals.totalHealthSick, hospitalized: data.totals.totalHealthHospitalized });
    hTotal.eachCell((cell) => Object.assign(cell, { style: totalStyle }));

    const eduSheet = workbook.addWorksheet('Education Summary');
    eduSheet.columns = [
      { header: 'Home', key: 'home', width: 25 },
      { header: 'School Going', key: 'school', width: 18 },
      { header: 'College Going', key: 'college', width: 18 },
    ];
    eduSheet.getRow(1).eachCell((cell) => Object.assign(cell, { style: headerStyle }));
    for (const h of data.homes) {
      eduSheet.addRow({ home: h.homeLabel, school: h.schoolGoing, college: h.collegeGoing });
    }
    const eTotal = eduSheet.addRow({ home: 'TOTAL', school: data.totals.totalSchoolGoing, college: data.totals.totalCollegeGoing });
    eTotal.eachCell((cell) => Object.assign(cell, { style: totalStyle }));

    const movementSheet = workbook.addWorksheet('Joinings & Exits');
    movementSheet.columns = [
      { header: 'Home', key: 'home', width: 25 },
      { header: 'New Joinings', key: 'joinings', width: 18 },
      { header: 'Exits', key: 'exits', width: 18 },
    ];
    movementSheet.getRow(1).eachCell((cell) => Object.assign(cell, { style: headerStyle }));
    for (const h of data.homes) {
      movementSheet.addRow({ home: h.homeLabel, joinings: h.newJoinings, exits: h.exits });
    }
    const mTotal = movementSheet.addRow({ home: 'TOTAL', joinings: data.totals.totalNewJoinings, exits: data.totals.totalExits });
    mTotal.eachCell((cell) => Object.assign(cell, { style: totalStyle }));

   return Buffer.from(await workbook.xlsx.writeBuffer());
  }
}
