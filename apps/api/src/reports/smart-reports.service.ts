import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

export interface SmartReportFilters {
  gender?: string;
  city?: string;
  state?: string;
  country?: string;
  profession?: string;
  category?: string;
  occasion?: string;
  donationType?: string;
  minAmount?: number;
  maxAmount?: number;
  dateFrom?: string;
  dateTo?: string;
  visited?: boolean;
  donationFrequency?: string;
  donorTag?: string;
  preferredHome?: string;
  supportType?: string;
}

type GroupByField =
  | 'gender' | 'city' | 'state' | 'country' | 'profession'
  | 'category' | 'occasion'
  | 'donationFrequency' | 'donorTag' | 'preferredHome' | 'supportType';

const PROFILE_GROUP_BYS: string[] = ['donationFrequency', 'donorTag', 'preferredHome', 'supportType'];

export interface SmartReportDonor {
  id: string;
  donorCode: string;
  name: string;
  phone: string;
  city: string;
  state: string;
  amount: number;
  donationFrequency?: string;
  donorTags?: string[];
  preferredHomes?: string[];
  supportPreferences?: string[];
}

export interface SmartReportRow {
  groupName: string;
  donorCount: number;
  totalAmount: number;
  donors: SmartReportDonor[];
}

@Injectable()
export class SmartReportsService {
  constructor(private readonly prisma: PrismaService) {}

  private toNum(v: any): number {
    if (!v) return 0;
    return typeof v === 'object' && typeof v.toNumber === 'function' ? v.toNumber() : Number(v);
  }

  private titleCase(s: string): string {
    return s
      .replace(/_/g, ' ')
      .split(' ')
      .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  }

  private buildDonorWhere(filters: SmartReportFilters) {
    const where: any = { deletedAt: null };
    if (filters.gender) where.gender = filters.gender;
    if (filters.city) where.city = { contains: filters.city, mode: 'insensitive' };
    if (filters.state) where.state = { contains: filters.state, mode: 'insensitive' };
    if (filters.country) where.country = { contains: filters.country, mode: 'insensitive' };
    if (filters.profession) where.profession = filters.profession;
    if (filters.visited !== undefined) where.visited = filters.visited;
    if (filters.donationFrequency) where.donationFrequency = filters.donationFrequency;
    if (filters.supportType) where.supportPreferences = { has: filters.supportType };
    return where;
  }

  private buildDonationWhere(filters: SmartReportFilters) {
    const where: any = { deletedAt: null };
    if (filters.category) where.donationCategory = filters.category;
    if (filters.occasion) where.donationOccasion = filters.occasion;
    if (filters.donationType) where.scheduleType = filters.donationType;
    if (filters.dateFrom || filters.dateTo) {
      where.donationDate = {};
      if (filters.dateFrom) where.donationDate.gte = new Date(filters.dateFrom);
      if (filters.dateTo) where.donationDate.lte = new Date(filters.dateTo);
    }
    if (filters.minAmount !== undefined || filters.maxAmount !== undefined) {
      where.donationAmount = {};
      if (filters.minAmount !== undefined) where.donationAmount.gte = filters.minAmount;
      if (filters.maxAmount !== undefined) where.donationAmount.lte = filters.maxAmount;
    }
    return where;
  }

  async getSmartReport(filters: SmartReportFilters, groupBy: GroupByField): Promise<SmartReportRow[]> {
    const donorWhere = this.buildDonorWhere(filters);
    const donationWhere = this.buildDonationWhere(filters);
    const isProfileGroupBy = PROFILE_GROUP_BYS.includes(groupBy);

    const donors = await this.prisma.donor.findMany({
      where: donorWhere,
      select: {
        id: true,
        donorCode: true,
        firstName: true,
        lastName: true,
        primaryPhone: true,
        city: true,
        state: true,
        country: true,
        gender: true,
        profession: true,
        donationFrequency: true,
        donorTags: true,
        preferredHomes: true,
        supportPreferences: true,
        donations: {
          where: donationWhere,
          select: {
            donationAmount: true,
            donationCategory: true,
            donationOccasion: true,
          },
        },
      },
      take: 20000,
    });

    let eligibleDonors = donors;

    if (!isProfileGroupBy) {
      eligibleDonors = donors.filter(d => d.donations.length > 0);
    }

    if (filters.donorTag) {
      const tag = filters.donorTag.toLowerCase();
      eligibleDonors = eligibleDonors.filter(d =>
        d.donorTags.some(t => t.toLowerCase().includes(tag)),
      );
    }
    if (filters.preferredHome) {
      const home = filters.preferredHome.toLowerCase();
      eligibleDonors = eligibleDonors.filter(d =>
        d.preferredHomes.some(h => h.toLowerCase().includes(home)),
      );
    }

    const grouped = new Map<string, {
      donorIds: Set<string>;
      totalAmount: number;
      donorData: Map<string, SmartReportDonor>;
    }>();

    for (const donor of eligibleDonors) {
      const donorTotal = donor.donations.reduce(
        (sum, don) => sum + this.toNum(don.donationAmount),
        0,
      );

      let keys: string[] = [];

      if (groupBy === 'gender') {
        keys = [donor.gender || 'UNKNOWN'];
      } else if (groupBy === 'city') {
        keys = [(donor.city?.trim() || 'Unknown City').toLowerCase()];
      } else if (groupBy === 'state') {
        keys = [(donor.state?.trim() || 'Unknown State').toLowerCase()];
      } else if (groupBy === 'country') {
        keys = [(donor.country?.trim() || 'India').toLowerCase()];
      } else if (groupBy === 'profession') {
        keys = [donor.profession || 'OTHER'];
      } else if (groupBy === 'category') {
        keys = [...new Set(donor.donations.map(d => d.donationCategory || 'OTHER'))];
      } else if (groupBy === 'occasion') {
        keys = [...new Set(donor.donations.map(d => d.donationOccasion || 'GENERAL'))];
      } else if (groupBy === 'donationFrequency') {
        keys = [donor.donationFrequency || 'UNSPECIFIED'];
      } else if (groupBy === 'donorTag') {
        keys = donor.donorTags.length > 0 ? [...new Set(donor.donorTags)] : ['No Tag'];
      } else if (groupBy === 'preferredHome') {
        keys = donor.preferredHomes.length > 0 ? [...new Set(donor.preferredHomes)] : ['No Preference'];
      } else if (groupBy === 'supportType') {
        keys = donor.supportPreferences.length > 0
          ? [...new Set(donor.supportPreferences.map(String))]
          : ['UNSPECIFIED'];
      }

      for (const key of keys) {
        if (!grouped.has(key)) {
          grouped.set(key, { donorIds: new Set(), totalAmount: 0, donorData: new Map() });
        }
        const group = grouped.get(key)!;
        if (!group.donorIds.has(donor.id)) {
          group.donorIds.add(donor.id);
          group.totalAmount += donorTotal;
          group.donorData.set(donor.id, {
            id: donor.id,
            donorCode: donor.donorCode,
            name: `${donor.firstName} ${donor.lastName || ''}`.trim(),
            phone: donor.primaryPhone || '-',
            city: donor.city?.trim() || '-',
            state: donor.state?.trim() || '-',
            amount: donorTotal,
            donationFrequency: donor.donationFrequency || undefined,
            donorTags: donor.donorTags,
            preferredHomes: donor.preferredHomes,
            supportPreferences: donor.supportPreferences.map(String),
          });
        }
      }
    }

    const result: SmartReportRow[] = [];
    for (const [groupKey, data] of grouped.entries()) {
      result.push({
        groupName: this.titleCase(groupKey),
        donorCount: data.donorIds.size,
        totalAmount: data.totalAmount,
        donors: Array.from(data.donorData.values()).sort((a, b) => b.amount - a.amount),
      });
    }

    return result.sort((a, b) => b.totalAmount - a.totalAmount);
  }

  async exportExcel(filters: SmartReportFilters, groupBy: GroupByField): Promise<Buffer> {
    const summary = await this.getSmartReport(filters, groupBy);
    const workbook = new ExcelJS.Workbook();
    const GREEN = 'FF4A7C59';
    const WHITE = 'FFFFFFFF';
    const LIGHT_GREEN = 'FFE8F5E9';
    const LIGHT_GRAY = 'FFF5F5F5';

    const groupLabel = groupBy.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

    const summarySheet = workbook.addWorksheet('Summary');
    summarySheet.columns = [
      { header: groupLabel, key: 'groupName', width: 30 },
      { header: 'Donor Count', key: 'donorCount', width: 15 },
      { header: 'Total Amount (Rs.)', key: 'totalAmount', width: 22 },
    ];
    const sh1 = summarySheet.getRow(1);
    sh1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GREEN } };
    sh1.font = { bold: true, color: { argb: WHITE } };
    sh1.commit();
    for (const row of summary) {
      summarySheet.addRow({ groupName: row.groupName, donorCount: row.donorCount, totalAmount: row.totalAmount });
    }

    const detailSheet = workbook.addWorksheet('Donor Details');
    detailSheet.columns = [
      { header: groupLabel, key: 'group', width: 28 },
      { header: 'Donor Code', key: 'donorCode', width: 16 },
      { header: 'Donor Name', key: 'name', width: 28 },
      { header: 'Phone', key: 'phone', width: 18 },
      { header: 'City', key: 'city', width: 18 },
      { header: 'State', key: 'state', width: 18 },
      { header: 'Donation Frequency', key: 'donationFrequency', width: 22 },
      { header: 'Donor Tags', key: 'donorTags', width: 28 },
      { header: 'Preferred Homes', key: 'preferredHomes', width: 35 },
      { header: 'Support Types', key: 'supportPreferences', width: 30 },
      { header: 'Amount (Rs.)', key: 'amount', width: 18 },
    ];
    const dh1 = detailSheet.getRow(1);
    dh1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GREEN } };
    dh1.font = { bold: true, color: { argb: WHITE } };
    dh1.commit();

    let rowIndex = 2;
    for (const group of summary) {
      const headerRow = detailSheet.getRow(rowIndex++);
      headerRow.getCell(1).value = `>> ${group.groupName}`;
      headerRow.getCell(2).value = `${group.donorCount} donors`;
      headerRow.getCell(11).value = group.totalAmount;
      headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: LIGHT_GREEN } };
      headerRow.font = { bold: true };
      headerRow.commit();

      for (const [di, donor] of group.donors.entries()) {
        const row = detailSheet.getRow(rowIndex++);
        row.getCell(1).value = group.groupName;
        row.getCell(2).value = donor.donorCode;
        row.getCell(3).value = donor.name;
        row.getCell(4).value = donor.phone;
        row.getCell(5).value = donor.city;
        row.getCell(6).value = donor.state;
        row.getCell(7).value = donor.donationFrequency?.replace(/_/g, ' ') || '-';
        row.getCell(8).value = (donor.donorTags ?? []).join(', ') || '-';
        row.getCell(9).value = (donor.preferredHomes ?? []).join(' | ') || '-';
        row.getCell(10).value = (donor.supportPreferences ?? []).map((s: string) => s.replace(/_/g, ' ')).join(', ') || '-';
        row.getCell(11).value = donor.amount;
        if (di % 2 === 1) {
          row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: LIGHT_GRAY } };
        }
        row.commit();
      }

      detailSheet.getRow(rowIndex++);
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  async exportPdf(filters: SmartReportFilters, groupBy: GroupByField): Promise<Buffer> {
    const summary = await this.getSmartReport(filters, groupBy);

    return new Promise((resolve) => {
      const doc = new PDFDocument({ margin: 36, size: 'A4' });
      const chunks: Buffer[] = [];
      doc.on('data', (c: Buffer) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      const W = 523;
      const GREEN = '#4A7C59';
      const codeColW = 65;
      const nameColW = 115;
      const phoneColW = 85;
      const cityColW = 75;
      const freqColW = 75;
      const amtColW = 70;
      const totalRowW = codeColW + nameColW + phoneColW + cityColW + freqColW + amtColW;

      const groupLabel = groupBy.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

      doc.fontSize(15).font('Helvetica-Bold').fillColor('#000000')
        .text('Asha Kuteer Foundation – Smart Report', { align: 'center' });
      doc.fontSize(10).font('Helvetica')
        .text(`Grouped by: ${groupLabel}`, { align: 'center' });
      doc.fontSize(8)
        .text(`Generated: ${new Date().toLocaleDateString('en-IN')} | ${summary.length} groups | ${summary.reduce((s, r) => s + r.donorCount, 0)} donors`, { align: 'center' });
      doc.moveDown(0.8);

      let y = doc.y;

      doc.rect(36, y, W, 14).fill(GREEN);
      doc.fontSize(8).font('Helvetica-Bold').fillColor('#FFFFFF');
      let cx = 38;
      doc.text(groupLabel, cx, y + 3, { width: 130, lineBreak: false }); cx += 130;
      doc.text('Donors', cx, y + 3, { width: 70, align: 'center', lineBreak: false }); cx += 70;
      doc.text('Total Amount (Rs.)', cx, y + 3, { width: 130, align: 'right', lineBreak: false });
      y += 18;

      doc.fillColor('#000000').font('Helvetica').fontSize(8);
      for (const [i, row] of summary.entries()) {
        if (y > 780) { doc.addPage(); y = 36; }
        if (i % 2 === 0) { doc.rect(36, y - 1, W, 13).fill('#F0F7F3'); doc.fillColor('#000000'); }
        cx = 38;
        doc.text(row.groupName, cx, y, { width: 130, lineBreak: false }); cx += 130;
        doc.text(row.donorCount.toString(), cx, y, { width: 70, align: 'center', lineBreak: false }); cx += 70;
        doc.text(`Rs.${row.totalAmount.toLocaleString('en-IN')}`, cx, y, { width: 130, align: 'right', lineBreak: false });
        y += 13;
      }

      y += 20;

      for (const group of summary) {
        if (y > 700) { doc.addPage(); y = 36; }

        doc.rect(36, y, W, 16).fill(GREEN);
        doc.fontSize(9).font('Helvetica-Bold').fillColor('#FFFFFF')
          .text(`${group.groupName}  —  ${group.donorCount} donors  |  Rs.${group.totalAmount.toLocaleString('en-IN')}`,
            38, y + 3, { width: W - 4, lineBreak: false });
        y += 20;

        doc.rect(36, y, totalRowW, 12).fill('#E8F5E9');
        doc.fontSize(7).font('Helvetica-Bold').fillColor('#000000');
        cx = 38;
        doc.text('Code', cx, y + 2, { width: codeColW, lineBreak: false }); cx += codeColW;
        doc.text('Name', cx, y + 2, { width: nameColW, lineBreak: false }); cx += nameColW;
        doc.text('Phone', cx, y + 2, { width: phoneColW, lineBreak: false }); cx += phoneColW;
        doc.text('City / State', cx, y + 2, { width: cityColW, lineBreak: false }); cx += cityColW;
        doc.text('Frequency', cx, y + 2, { width: freqColW, lineBreak: false }); cx += freqColW;
        doc.text('Amount (Rs.)', cx, y + 2, { width: amtColW, align: 'right', lineBreak: false });
        y += 14;

        doc.font('Helvetica').fontSize(7).fillColor('#000000');
        for (const [di, donor] of group.donors.entries()) {
          if (y > 780) { doc.addPage(); y = 36; }
          if (di % 2 === 1) { doc.rect(36, y - 1, totalRowW, 12).fill('#FAFAFA'); doc.fillColor('#000000'); }
          cx = 38;
          doc.text(donor.donorCode, cx, y, { width: codeColW, lineBreak: false }); cx += codeColW;
          doc.text(donor.name, cx, y, { width: nameColW, lineBreak: false }); cx += nameColW;
          doc.text(donor.phone, cx, y, { width: phoneColW, lineBreak: false }); cx += phoneColW;
          const loc = [donor.city !== '-' ? donor.city : '', donor.state !== '-' ? donor.state : ''].filter(Boolean).join(', ') || '-';
          doc.text(loc, cx, y, { width: cityColW, lineBreak: false }); cx += cityColW;
          doc.text((donor.donationFrequency || '-').replace(/_/g, ' '), cx, y, { width: freqColW, lineBreak: false }); cx += freqColW;
          doc.text(donor.amount > 0 ? `Rs.${donor.amount.toLocaleString('en-IN')}` : '-',
            cx, y, { width: amtColW, align: 'right', lineBreak: false });
          y += 12;
        }

        const hasTags = group.donors.some(d => (d.donorTags ?? []).length > 0);
        const hasHomes = group.donors.some(d => (d.preferredHomes ?? []).length > 0);
        const hasSupport = group.donors.some(d => (d.supportPreferences ?? []).length > 0);

        if (hasTags || hasHomes || hasSupport) {
          y += 4;
          doc.fontSize(6).fillColor('#555555');
          for (const donor of group.donors) {
            const extras: string[] = [];
            if ((donor.donorTags ?? []).length > 0) extras.push(`Tags: ${donor.donorTags!.join(', ')}`);
            if ((donor.preferredHomes ?? []).length > 0) extras.push(`Homes: ${donor.preferredHomes!.join(' | ')}`);
            if ((donor.supportPreferences ?? []).length > 0) {
              extras.push(`Support: ${donor.supportPreferences!.map((s: string) => s.replace(/_/g, ' ')).join(', ')}`);
            }
            if (extras.length > 0) {
              if (y > 780) { doc.addPage(); y = 36; }
              doc.text(`  ${donor.donorCode}: ${extras.join(' | ')}`, 38, y, { width: W - 4, lineBreak: false });
              y += 10;
            }
          }
          doc.fillColor('#000000').fontSize(7);
        }

        y += 6;
        doc.moveTo(36, y).lineTo(36 + W, y).strokeColor('#DDDDDD').lineWidth(0.5).stroke();
        y += 10;
        doc.y = y;
      }

      doc.end();
    });
  }

  async saveReport(name: string, filters: SmartReportFilters, groupBy: string) {
    try {
      return await this.prisma.reportHistory.create({
        data: { name, filters: filters as any, groupBy },
      });
    } catch {
      return null;
    }
  }

  async getReportHistory() {
    try {
      return await this.prisma.reportHistory.findMany({ orderBy: { createdAt: 'desc' }, take: 50 });
    } catch {
      return [];
    }
  }

  async getAnalytics() {
    const now = new Date();
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

    const [allDonations, donorWithProfession, repeatDonors, topDonorsRaw] = await Promise.all([
      this.prisma.donation.findMany({
        where: { deletedAt: null, donationDate: { gte: twelveMonthsAgo } },
        select: {
          donationAmount: true,
          donationDate: true,
          donationCategory: true,
          donationOccasion: true,
          scheduleType: true,
          donor: { select: { id: true, city: true, state: true, country: true, profession: true } },
        },
      }),
      this.prisma.donor.findMany({
        where: { deletedAt: null },
        select: { id: true, profession: true },
      }),
      this.prisma.donor.findMany({
        where: { deletedAt: null, donations: { some: { deletedAt: null } } },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          donations: { where: { deletedAt: null }, select: { donationAmount: true, donationDate: true } },
        },
      }),
      this.prisma.donor.findMany({
        where: { deletedAt: null },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          donorCode: true,
          city: true,
          donations: { where: { deletedAt: null }, select: { donationAmount: true } },
        },
      }),
    ]);

    const toNum = (v: any) => typeof v === 'object' && typeof v?.toNumber === 'function' ? v.toNumber() : Number(v || 0);

    const monthlyMap = new Map<string, { amount: number; count: number }>();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthlyMap.set(key, { amount: 0, count: 0 });
    }
    for (const d of allDonations) {
      const key = `${d.donationDate.getFullYear()}-${String(d.donationDate.getMonth() + 1).padStart(2, '0')}`;
      if (monthlyMap.has(key)) {
        const e = monthlyMap.get(key)!;
        e.amount += toNum(d.donationAmount);
        e.count += 1;
      }
    }
    const monthlyDonations = Array.from(monthlyMap.entries()).map(([month, v]) => ({ month, amount: v.amount, count: v.count }));

    const profMap = new Map<string, number>();
    for (const d of donorWithProfession) {
      const key = d.profession || 'OTHER';
      profMap.set(key, (profMap.get(key) || 0) + 1);
    }
    const professionStats = Array.from(profMap.entries()).map(([profession, count]) => ({ profession, count })).sort((a, b) => b.count - a.count);

    const catMap = new Map<string, { amount: number; count: number }>();
    for (const d of allDonations) {
      const key = d.donationCategory || 'OTHER';
      if (!catMap.has(key)) catMap.set(key, { amount: 0, count: 0 });
      const e = catMap.get(key)!;
      e.amount += toNum(d.donationAmount);
      e.count += 1;
    }
    const categoryStats = Array.from(catMap.entries()).map(([category, v]) => ({ category, ...v })).sort((a, b) => b.amount - a.amount);

    const occMap = new Map<string, { amount: number; count: number }>();
    for (const d of allDonations) {
      const key = d.donationOccasion || 'GENERAL';
      if (!occMap.has(key)) occMap.set(key, { amount: 0, count: 0 });
      const e = occMap.get(key)!;
      e.amount += toNum(d.donationAmount);
      e.count += 1;
    }
    const occasionStats = Array.from(occMap.entries()).map(([occasion, v]) => ({ occasion, ...v })).sort((a, b) => b.amount - a.amount);

    let hyderabad = 0, telanganaOther = 0, otherStates = 0, international = 0;
    const donorSet = new Map<string, { city: string; state: string; country: string }>();
    for (const d of allDonations) {
      if (!donorSet.has(d.donor.id)) {
        donorSet.set(d.donor.id, { city: d.donor.city || '', state: d.donor.state || '', country: d.donor.country || 'India' });
      }
    }
    for (const [, v] of donorSet.entries()) {
      const country = v.country?.toLowerCase() || 'india';
      const city = v.city?.toLowerCase() || '';
      const state = v.state?.toLowerCase() || '';
      if (country !== 'india') international++;
      else if (city.includes('hyderabad') || city.includes('secunderabad')) hyderabad++;
      else if (state.includes('telangana')) telanganaOther++;
      else otherStates++;
    }
    const geoStats = { hyderabad, telanganaOther, otherStates, international };

    let repeat = 0, oneTime = 0;
    for (const d of repeatDonors) {
      if (d.donations.length > 1) repeat++; else oneTime++;
    }
    const repeatVsOneTime = { repeat, oneTime };

    const topDonors = topDonorsRaw
      .map(d => ({
        id: d.id,
        name: `${d.firstName} ${d.lastName || ''}`.trim(),
        donorCode: d.donorCode,
        city: d.city || '-',
        totalAmount: d.donations.reduce((s, don) => s + toNum(don.donationAmount), 0),
        donationCount: d.donations.length,
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 10);

    const trendMap = new Map<string, number>();
    for (const d of allDonations) {
      const key = `${d.donationDate.getFullYear()}-${String(d.donationDate.getMonth() + 1).padStart(2, '0')}`;
      trendMap.set(key, (trendMap.get(key) || 0) + toNum(d.donationAmount));
    }
    const donationTrend = Array.from(trendMap.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([month, amount]) => ({ month, amount }));

    return { monthlyDonations, professionStats, categoryStats, occasionStats, geoStats, repeatVsOneTime, topDonors, donationTrend };
  }
}
