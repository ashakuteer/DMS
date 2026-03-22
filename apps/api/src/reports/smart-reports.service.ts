import { Injectable, ForbiddenException } from '@nestjs/common';
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
}

type GroupByField = 'gender' | 'city' | 'state' | 'country' | 'profession' | 'category' | 'occasion';

export interface SmartReportRow {
  groupName: string;
  donorCount: number;
  totalAmount: number;
}

@Injectable()
export class SmartReportsService {
  constructor(private readonly prisma: PrismaService) {}

  private buildDonorWhere(filters: SmartReportFilters) {
    const where: any = { deletedAt: null };
    if (filters.gender) where.gender = filters.gender;
    if (filters.city) where.city = { contains: filters.city, mode: 'insensitive' };
    if (filters.state) where.state = { contains: filters.state, mode: 'insensitive' };
    if (filters.country) where.country = { contains: filters.country, mode: 'insensitive' };
    if (filters.profession) where.professionType = filters.profession;
    if (filters.visited !== undefined) where.visited = filters.visited;
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

    const donors = await this.prisma.donor.findMany({
      where: donorWhere,
      select: {
        id: true,
        gender: true,
        city: true,
        state: true,
        country: true,
        professionType: true,
        donations: {
          where: donationWhere,
          select: {
            donationAmount: true,
            donationCategory: true,
            donationOccasion: true,
          },
        },
      },
    });

    const donorsWithDonations = donors.filter(d => d.donations.length > 0);

    const grouped = new Map<string, { donorIds: Set<string>; totalAmount: number; categoryCount: Map<string, number>; occasionCount: Map<string, number> }>();

    for (const donor of donorsWithDonations) {
      let keys: string[] = [];

      if (groupBy === 'gender') {
        keys = [donor.gender || 'UNKNOWN'];
      } else if (groupBy === 'city') {
        keys = [donor.city || 'Unknown City'];
      } else if (groupBy === 'state') {
        keys = [donor.state || 'Unknown State'];
      } else if (groupBy === 'country') {
        keys = [donor.country || 'India'];
      } else if (groupBy === 'profession') {
        keys = [donor.professionType || 'OTHER'];
      } else if (groupBy === 'category') {
        const cats = [...new Set(donor.donations.map(d => d.donationCategory || 'OTHER'))];
        keys = cats;
      } else if (groupBy === 'occasion') {
        const occ = [...new Set(donor.donations.map(d => d.donationOccasion || 'GENERAL'))];
        keys = occ;
      }

      for (const key of keys) {
        if (!grouped.has(key)) {
          grouped.set(key, { donorIds: new Set(), totalAmount: 0, categoryCount: new Map(), occasionCount: new Map() });
        }
        const group = grouped.get(key)!;
        group.donorIds.add(donor.id);

        for (const donation of donor.donations) {
          let amount = 0;
          if (donation.donationAmount) {
            amount = typeof donation.donationAmount === 'object'
              ? (donation.donationAmount as any).toNumber()
              : Number(donation.donationAmount);
          }
          group.totalAmount += amount;
        }
      }
    }

    const result: SmartReportRow[] = [];
    for (const [groupName, data] of grouped.entries()) {
      result.push({
        groupName,
        donorCount: data.donorIds.size,
        totalAmount: data.totalAmount,
      });
    }

    return result.sort((a, b) => b.totalAmount - a.totalAmount);
  }

  async getDonorList(filters: SmartReportFilters) {
    const donorWhere = this.buildDonorWhere(filters);
    const donationWhere = this.buildDonationWhere(filters);

    const donors = await this.prisma.donor.findMany({
      where: donorWhere,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        primaryPhone: true,
        city: true,
        state: true,
        donations: {
          where: donationWhere,
          select: { donationAmount: true },
        },
      },
      take: 10000,
    });

    return donors
      .filter(d => d.donations.length > 0)
      .map(d => ({
        name: `${d.firstName} ${d.lastName || ''}`.trim(),
        phone: d.primaryPhone || '-',
        city: d.city || '-',
        amount: d.donations.reduce((sum, donation) => {
          const amt = typeof donation.donationAmount === 'object'
            ? (donation.donationAmount as any).toNumber()
            : Number(donation.donationAmount || 0);
          return sum + amt;
        }, 0),
      }))
      .sort((a, b) => b.amount - a.amount);
  }

  async exportExcel(filters: SmartReportFilters, groupBy: GroupByField): Promise<Buffer> {
    const [summary, donorList] = await Promise.all([
      this.getSmartReport(filters, groupBy),
      this.getDonorList(filters),
    ]);

    const workbook = new ExcelJS.Workbook();

    const summarySheet = workbook.addWorksheet('Summary');
    summarySheet.columns = [
      { header: groupBy.charAt(0).toUpperCase() + groupBy.slice(1), key: 'groupName', width: 25 },
      { header: 'Donor Count', key: 'donorCount', width: 15 },
      { header: 'Total Amount (₹)', key: 'totalAmount', width: 20 },
    ];
    summarySheet.getRow(1).font = { bold: true };
    summarySheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4A7C59' } };
    summarySheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    summary.forEach(row => summarySheet.addRow(row));

    const donorSheet = workbook.addWorksheet('Donor List');
    donorSheet.columns = [
      { header: 'Name', key: 'name', width: 28 },
      { header: 'Phone', key: 'phone', width: 18 },
      { header: 'City', key: 'city', width: 18 },
      { header: 'Total Amount (₹)', key: 'amount', width: 20 },
    ];
    donorSheet.getRow(1).font = { bold: true };
    donorSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4A7C59' } };
    donorSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    donorList.forEach(row => donorSheet.addRow(row));

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  async exportPdf(filters: SmartReportFilters, groupBy: GroupByField): Promise<Buffer> {
    const summary = await this.getSmartReport(filters, groupBy);

    return new Promise((resolve) => {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const chunks: Buffer[] = [];
      doc.on('data', (c: Buffer) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      doc.fontSize(16).font('Helvetica-Bold').text('Smart Report', { align: 'center' });
      doc.fontSize(12).font('Helvetica').text(`Grouped by: ${groupBy}`, { align: 'center' });
      doc.fontSize(9).text(`Generated: ${new Date().toLocaleDateString('en-IN')}`, { align: 'center' });
      doc.moveDown();

      const tableTop = doc.y;
      const colWidths = [200, 120, 160];
      const headers = [groupBy.charAt(0).toUpperCase() + groupBy.slice(1), 'Donor Count', 'Total Amount (₹)'];

      let x = 40;
      doc.font('Helvetica-Bold').fontSize(9);
      doc.rect(40, tableTop - 3, 480, 16).fill('#4A7C59');
      doc.fill('#FFFFFF');
      headers.forEach((h, i) => {
        doc.text(h, x + 2, tableTop, { width: colWidths[i] - 4 });
        x += colWidths[i];
      });

      let y = tableTop + 18;
      doc.fill('#000000').font('Helvetica').fontSize(9);

      summary.forEach((row, idx) => {
        if (y > 750) { doc.addPage(); y = 50; }
        if (idx % 2 === 0) { doc.rect(40, y - 2, 480, 14).fill('#F5F5F5'); doc.fill('#000000'); }
        x = 40;
        [row.groupName, row.donorCount.toString(), `₹${row.totalAmount.toLocaleString('en-IN')}`].forEach((cell, i) => {
          doc.text(cell, x + 2, y, { width: colWidths[i] - 4 });
          x += colWidths[i];
        });
        y += 14;
      });

      doc.end();
    });
  }

  async saveReport(name: string, filters: SmartReportFilters, groupBy: string) {
    return this.prisma.reportHistory.create({
      data: { name, filters: filters as any, groupBy },
    });
  }

  async getReportHistory() {
    return this.prisma.reportHistory.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async getAnalytics() {
    const now = new Date();
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

    const [
      allDonations,
      donorWithProfession,
      repeatDonors,
      topDonorsRaw,
    ] = await Promise.all([
      this.prisma.donation.findMany({
        where: { deletedAt: null, donationDate: { gte: twelveMonthsAgo } },
        select: {
          donationAmount: true,
          donationDate: true,
          donationCategory: true,
          donationOccasion: true,
          scheduleType: true,
          donor: { select: { id: true, city: true, state: true, country: true, professionType: true } },
        },
      }),
      this.prisma.donor.findMany({
        where: { deletedAt: null },
        select: { id: true, professionType: true },
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

    const toNum = (v: any) => typeof v === 'object' ? v.toNumber() : Number(v || 0);

    // 1. Monthly donations (last 12 months)
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
    const monthlyDonations = Array.from(monthlyMap.entries()).map(([month, v]) => ({
      month,
      amount: v.amount,
      count: v.count,
    }));

    // 2. Profession stats
    const profMap = new Map<string, number>();
    for (const d of donorWithProfession) {
      const key = d.professionType || 'OTHER';
      profMap.set(key, (profMap.get(key) || 0) + 1);
    }
    const professionStats = Array.from(profMap.entries()).map(([profession, count]) => ({ profession, count }))
      .sort((a, b) => b.count - a.count);

    // 3. Category stats
    const catMap = new Map<string, { amount: number; count: number }>();
    for (const d of allDonations) {
      const key = d.donationCategory || 'OTHER';
      if (!catMap.has(key)) catMap.set(key, { amount: 0, count: 0 });
      const e = catMap.get(key)!;
      e.amount += toNum(d.donationAmount);
      e.count += 1;
    }
    const categoryStats = Array.from(catMap.entries()).map(([category, v]) => ({ category, ...v }))
      .sort((a, b) => b.amount - a.amount);

    // 4. Occasion stats
    const occMap = new Map<string, { amount: number; count: number }>();
    for (const d of allDonations) {
      const key = d.donationOccasion || 'GENERAL';
      if (!occMap.has(key)) occMap.set(key, { amount: 0, count: 0 });
      const e = occMap.get(key)!;
      e.amount += toNum(d.donationAmount);
      e.count += 1;
    }
    const occasionStats = Array.from(occMap.entries()).map(([occasion, v]) => ({ occasion, ...v }))
      .sort((a, b) => b.amount - a.amount);

    // 5. Geo stats
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
      if (country !== 'india') {
        international++;
      } else if (city.includes('hyderabad') || city.includes('secunderabad')) {
        hyderabad++;
      } else if (state.includes('telangana')) {
        telanganaOther++;
      } else {
        otherStates++;
      }
    }
    const geoStats = { hyderabad, telanganaOther, otherStates, international };

    // 6. Repeat vs one-time
    let repeat = 0, oneTime = 0;
    for (const d of repeatDonors) {
      if (d.donations.length > 1) repeat++;
      else oneTime++;
    }
    const repeatVsOneTime = { repeat, oneTime };

    // 7. Top donors
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

    // 8. Donation trend (all time monthly)
    const trendMap = new Map<string, number>();
    for (const d of allDonations) {
      const key = `${d.donationDate.getFullYear()}-${String(d.donationDate.getMonth() + 1).padStart(2, '0')}`;
      trendMap.set(key, (trendMap.get(key) || 0) + toNum(d.donationAmount));
    }
    const donationTrend = Array.from(trendMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, amount]) => ({ month, amount }));

    return {
      monthlyDonations,
      professionStats,
      categoryStats,
      occasionStats,
      geoStats,
      repeatVsOneTime,
      topDonors,
      donationTrend,
    };
  }
}
