import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { OrganizationProfileService } from "../organization-profile/organization-profile.service";
import * as ExcelJS from "exceljs";
import PDFDocument from "pdfkit";

@Injectable()
export class AnalyticsService {
  constructor(
    private prisma: PrismaService,
    private orgProfileService: OrganizationProfileService,
  ) {}

  private getCurrentFY() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const fyStart =
      month >= 3 ? new Date(year, 3, 1) : new Date(year - 1, 3, 1);
    const fyEnd =
      month >= 3
        ? new Date(year + 1, 2, 31, 23, 59, 59)
        : new Date(year, 2, 31, 23, 59, 59);
    return { fyStart, fyEnd };
  }

  private getMonthRange(offset = 0) {
    const now = new Date();
    const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    const start = new Date(d.getFullYear(), d.getMonth(), 1);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
    return { start, end };
  }

  private getTrailing12MonthsRange() {
    const now = new Date();
    const start = new Date(
      now.getFullYear() - 1,
      now.getMonth(),
      now.getDate(),
    );
    const end = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59,
    );
    return { start, end };
  }

  async getSummary() {
    const { fyStart, fyEnd } = this.getCurrentFY();
    const { start: monthStart, end: monthEnd } = this.getMonthRange();
    const { start: prevMonthStart, end: prevMonthEnd } = this.getMonthRange(-1);
    const { start: t12Start, end: t12End } = this.getTrailing12MonthsRange();

    const now = new Date();
    const in30Days = new Date(now);
    in30Days.setDate(now.getDate() + 30);
    const currentMonth = now.getMonth() + 1;
    const currentDay = now.getDate();

    const [
      totalDonors,
      donationsThisMonth,
      donationsPrevMonth,
      donationsT12,
      donationCountThisMonth,
      donationCountPrevMonth,
      activeSponsors,
      pendingPledges,
      donorsWithSpecialDays,
    ] = await Promise.all([
      this.prisma.donor.count({ where: { deletedAt: null } }),

      this.prisma.donation.aggregate({
        _sum: { donationAmount: true },
        where: {
          deletedAt: null,
          donationDate: { gte: monthStart, lte: monthEnd },
        },
      }),
      this.prisma.donation.aggregate({
        _sum: { donationAmount: true },
        where: {
          deletedAt: null,
          donationDate: { gte: prevMonthStart, lte: prevMonthEnd },
        },
      }),

      this.prisma.donation.aggregate({
        _sum: { donationAmount: true },
        where: {
          deletedAt: null,
          donationDate: { gte: t12Start, lte: t12End },
        },
      }),

      this.prisma.donation.count({
        where: {
          deletedAt: null,
          donationDate: { gte: monthStart, lte: monthEnd },
        },
      }),
      this.prisma.donation.count({
        where: {
          deletedAt: null,
          donationDate: { gte: prevMonthStart, lte: prevMonthEnd },
        },
      }),

      this.prisma.sponsorship.findMany({
        where: { isActive: true, status: "ACTIVE" },
        select: { amount: true, dueDayOfMonth: true, frequency: true },
      }),

      this.prisma.pledge.aggregate({
        _sum: { amount: true },
        _count: { id: true },
        where: { isDeleted: false, status: { in: ["PENDING", "POSTPONED"] } },
      }),

      this.prisma.donorSpecialOccasion.findMany({
        where: {
          donor: { deletedAt: null },
          OR: this.getNext30DaysMonthDayFilter(currentMonth, currentDay),
        },
        select: { donorId: true },
        distinct: ["donorId"],
      }),
    ]);

    const atRiskDonors = await this.computeAtRiskDonors();

    const overdueSponsorships = activeSponsors.filter(
      (s) =>
        s.frequency === "MONTHLY" &&
        s.dueDayOfMonth != null &&
        s.dueDayOfMonth < currentDay,
    );

    const thisMonthAmt =
      donationsThisMonth._sum.donationAmount?.toNumber() || 0;
    const prevMonthAmt =
      donationsPrevMonth._sum.donationAmount?.toNumber() || 0;
    const monthTrend =
      prevMonthAmt > 0
        ? ((thisMonthAmt - prevMonthAmt) / prevMonthAmt) * 100
        : null;
    const countTrend =
      donationCountPrevMonth > 0
        ? ((donationCountThisMonth - donationCountPrevMonth) /
            donationCountPrevMonth) *
          100
        : null;

    const activeCount = activeSponsors.length;
    const activeTotalMonthly = activeSponsors.reduce(
      (sum, s) => sum + (s.amount?.toNumber() || 0),
      0,
    );

    return {
      totalDonors,
      donationsThisMonth: thisMonthAmt,
      donationsThisMonthTrend: monthTrend,
      donationsT12: donationsT12._sum.donationAmount?.toNumber() || 0,
      donationCountThisMonth,
      donationCountTrend: countTrend,
      activeSponsorships: activeCount,
      activeSponsorshipsMonthlyTotal: activeTotalMonthly,
      overdueSponsorships: overdueSponsorships.length,
      pledgesPendingCount: pendingPledges._count.id || 0,
      pledgesPendingAmount: pendingPledges._sum.amount?.toNumber() || 0,
      donorsWithSpecialDaysNext30: donorsWithSpecialDays.length,
      donorsAtRisk: atRiskDonors.length,
    };
  }

  async getCharts() {
    const [
      monthlyDonations,
      donationsByType,
      donationsByHome,
      sponsorshipsDue,
    ] = await Promise.all([
      this.getMonthlyDonationSeries(),
      this.getDonationsByType(),
      this.getDonationsByHome(),
      this.getSponsorshipsDueSeries(),
    ]);
    return {
      monthlyDonations,
      donationsByType,
      donationsByHome,
      sponsorshipsDue,
    };
  }

  private async getMonthlyDonationSeries() {
    const months: { month: string; amount: number; count: number }[] = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const start = new Date(date.getFullYear(), date.getMonth(), 1);
      const end = new Date(
        date.getFullYear(),
        date.getMonth() + 1,
        0,
        23,
        59,
        59,
      );
      const result = await this.prisma.donation.aggregate({
        _sum: { donationAmount: true },
        _count: { id: true },
        where: { deletedAt: null, donationDate: { gte: start, lte: end } },
      });
      const monthName = date.toLocaleDateString("en-IN", {
        month: "short",
        year: "2-digit",
      });
      months.push({
        month: monthName,
        amount: result._sum.donationAmount?.toNumber() || 0,
        count: result._count.id || 0,
      });
    }
    return months;
  }

  private async getDonationsByType() {
    const { fyStart, fyEnd } = this.getCurrentFY();
    const groups = await this.prisma.donation.groupBy({
      by: ["donationType"],
      _sum: { donationAmount: true },
      _count: { id: true },
      where: { deletedAt: null, donationDate: { gte: fyStart, lte: fyEnd } },
    });
    return groups.map((g) => ({
      type: g.donationType,
      amount: g._sum.donationAmount?.toNumber() || 0,
      count: g._count.id || 0,
    }));
  }

  private async getDonationsByHome() {
    const { fyStart, fyEnd } = this.getCurrentFY();
    const groups = await this.prisma.donation.groupBy({
      by: ["donationHomeType"],
      _sum: { donationAmount: true },
      _count: { id: true },
      where: { deletedAt: null, donationDate: { gte: fyStart, lte: fyEnd } },
    });
    return groups.map((g) => ({
      home: g.donationHomeType || "UNSPECIFIED",
      amount: g._sum.donationAmount?.toNumber() || 0,
      count: g._count.id || 0,
    }));
  }

  private async getSponsorshipsDueSeries() {
    const now = new Date();
    const currentDay = now.getDate();
    const result: { month: string; activeDue: number; overdue: number }[] = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthLabel = d.toLocaleDateString("en-IN", {
        month: "short",
        year: "2-digit",
      });
      const daysInMonth = new Date(
        d.getFullYear(),
        d.getMonth() + 1,
        0,
      ).getDate();

      const activeMonthly = await this.prisma.sponsorship.findMany({
        where: {
          isActive: true,
          status: "ACTIVE",
          frequency: "MONTHLY",
          dueDayOfMonth: { not: null },
        },
        select: { dueDayOfMonth: true, startDate: true },
      });

      const isPast = i > 0;
      let activeDue = 0;
      let overdue = 0;

      if (isPast) {
        activeDue = activeMonthly.length;
      } else {
        for (const s of activeMonthly) {
          const dueDay = Math.min(s.dueDayOfMonth!, daysInMonth);
          if (dueDay <= currentDay + 7 && dueDay >= currentDay) {
            activeDue++;
          } else if (dueDay < currentDay) {
            overdue++;
          }
        }
      }

      result.push({ month: monthLabel, activeDue, overdue });
    }

    return result;
  }

  async getSegment(segment: string) {
    switch (segment) {
      case "top":
        return this.getTopDonorsSegment();
      case "risk":
        return this.computeAtRiskDonors();
      case "pledges":
        return this.getPledgesDueSegment();
      case "sponsorships":
        return this.getSponsorshipsDueSegment();
      case "specialdays":
        return this.getSpecialDaysSegment();
      default:
        return [];
    }
  }

  private async getTopDonorsSegment() {
    const { fyStart, fyEnd } = this.getCurrentFY();
    const topDonors = await this.prisma.donation.groupBy({
      by: ["donorId"],
      _sum: { donationAmount: true },
      _count: { id: true },
      where: { deletedAt: null, donationDate: { gte: fyStart, lte: fyEnd } },
      orderBy: { _sum: { donationAmount: "desc" } },
      take: 20,
    });

    const donorIds = topDonors.map((d) => d.donorId);
    const [donors, lastDonations] = await Promise.all([
      this.prisma.donor.findMany({
        where: { id: { in: donorIds } },
        select: { id: true, firstName: true, lastName: true, donorCode: true },
      }),
      this.prisma.donation.findMany({
        where: { donorId: { in: donorIds }, deletedAt: null },
        orderBy: { donationDate: "desc" },
        distinct: ["donorId"],
        select: { donorId: true, donationDate: true },
      }),
    ]);

    const donorMap = new Map(donors.map((d) => [d.id, d]));
    const lastDonMap = new Map(
      lastDonations.map((d) => [d.donorId, d.donationDate]),
    );

    return topDonors.map((td) => {
      const donor = donorMap.get(td.donorId);
      return {
        donorId: td.donorId,
        donorCode: donor?.donorCode || "",
        donorName: donor
          ? `${donor.firstName} ${donor.lastName || ""}`.trim()
          : "Unknown",
        totalAmount: td._sum.donationAmount?.toNumber() || 0,
        count: td._count.id || 0,
        lastDonationDate: lastDonMap.get(td.donorId) || null,
      };
    });
  }

  async computeAtRiskDonors(): Promise<any[]> {
    const now = new Date();
    const GRACE_DAYS = 7;

    const donors = await this.prisma.donor.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        donorCode: true,
        personalEmail: true,
        whatsappPhone: true,
        donationFrequency: true,
        donations: {
          where: { deletedAt: null },
          orderBy: { donationDate: "desc" },
          take: 4,
          select: { donationDate: true },
        },
      },
    });

    const frequencyDays: Record<string, number> = {
      MONTHLY: 30,
      QUARTERLY: 90,
      YEARLY: 365,
      OCCASIONAL: 180,
    };

    const atRisk: any[] = [];

    for (const donor of donors) {
      if (donor.donations.length < 2) continue;

      let expectedGapDays: number;
      if (donor.donationFrequency && frequencyDays[donor.donationFrequency]) {
        expectedGapDays = frequencyDays[donor.donationFrequency];
      } else {
        const gaps: number[] = [];
        for (let i = 0; i < Math.min(donor.donations.length - 1, 3); i++) {
          const d1 = new Date(donor.donations[i].donationDate).getTime();
          const d2 = new Date(donor.donations[i + 1].donationDate).getTime();
          gaps.push((d1 - d2) / (1000 * 60 * 60 * 24));
        }
        gaps.sort((a, b) => a - b);
        expectedGapDays = gaps[Math.floor(gaps.length / 2)];
      }

      const lastDonDate = new Date(donor.donations[0].donationDate);
      const daysSinceLast =
        (now.getTime() - lastDonDate.getTime()) / (1000 * 60 * 60 * 24);
      const threshold = expectedGapDays + GRACE_DAYS;

      if (daysSinceLast > threshold) {
        const overdueDays = Math.round(daysSinceLast - threshold);
        let riskLevel: string;
        if (overdueDays > expectedGapDays) riskLevel = "High";
        else if (overdueDays > expectedGapDays * 0.5) riskLevel = "Medium";
        else riskLevel = "Low";

        const expectedNextDate = new Date(lastDonDate);
        expectedNextDate.setDate(expectedNextDate.getDate() + expectedGapDays);

        atRisk.push({
          donorId: donor.id,
          donorCode: donor.donorCode,
          donorName: `${donor.firstName} ${donor.lastName || ""}`.trim(),
          lastDonationDate: lastDonDate,
          expectedNextDate,
          riskLevel,
          overdueDays,
          hasEmail: !!donor.personalEmail,
          hasWhatsApp: !!donor.whatsappPhone,
        });
      }
    }

    atRisk.sort((a, b) => {
      const order: Record<string, number> = { High: 0, Medium: 1, Low: 2 };
      return (order[a.riskLevel] ?? 3) - (order[b.riskLevel] ?? 3);
    });

    return atRisk;
  }

  private async getPledgesDueSegment() {
    const pledges = await this.prisma.pledge.findMany({
      where: {
        isDeleted: false,
        status: { in: ["PENDING", "POSTPONED"] },
      },
      include: {
        donor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            donorCode: true,
            whatsappPhone: true,
            personalEmail: true,
          },
        },
      },
      orderBy: { expectedFulfillmentDate: "asc" },
    });

    return pledges.map((p) => ({
      id: p.id,
      donorId: p.donorId,
      donorCode: p.donor.donorCode,
      donorName: `${p.donor.firstName} ${p.donor.lastName || ""}`.trim(),
      pledgeType: p.pledgeType,
      amount: p.amount?.toNumber() || null,
      quantity: p.quantity,
      expectedDate: p.expectedFulfillmentDate,
      status: p.status,
      notes: p.notes,
      hasEmail: !!p.donor.personalEmail,
      hasWhatsApp: !!p.donor.whatsappPhone,
    }));
  }

  private async getSponsorshipsDueSegment() {
    const now = new Date();
    const currentDay = now.getDate();
    const daysInMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
    ).getDate();

    const sponsorships = await this.prisma.sponsorship.findMany({
      where: {
        isActive: true,
        status: "ACTIVE",
        frequency: "MONTHLY",
        dueDayOfMonth: { not: null },
      },
      include: {
        donor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            donorCode: true,
            whatsappPhone: true,
            personalEmail: true,
          },
        },
        beneficiary: {
          select: { id: true, fullName: true, homeType: true, code: true },
        },
      },
    });

    return sponsorships
      .map((s) => {
        const dueDay = Math.min(s.dueDayOfMonth!, daysInMonth);
        const isOverdue = dueDay < currentDay;
        const isDueSoon = dueDay >= currentDay && dueDay <= currentDay + 7;
        return {
          id: s.id,
          donorId: s.donorId,
          donorCode: s.donor.donorCode,
          donorName: `${s.donor.firstName} ${s.donor.lastName || ""}`.trim(),
          beneficiaryId: s.beneficiaryId,
          beneficiaryName: s.beneficiary.fullName,
          beneficiaryCode: s.beneficiary.code,
          homeType: s.beneficiary.homeType,
          amount: s.amount?.toNumber() || 0,
          dueDay: dueDay,
          isOverdue,
          isDueSoon,
          status: isOverdue ? "OVERDUE" : isDueSoon ? "DUE_SOON" : "UPCOMING",
          hasEmail: !!s.donor.personalEmail,
          hasWhatsApp: !!s.donor.whatsappPhone,
        };
      })
      .filter((s) => s.isOverdue || s.isDueSoon)
      .sort((a, b) => a.dueDay - b.dueDay);
  }

  private async getSpecialDaysSegment() {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentDay = now.getDate();

    const occasions = await this.prisma.donorSpecialOccasion.findMany({
      where: {
        donor: { deletedAt: null },
        OR: this.getNext30DaysMonthDayFilter(currentMonth, currentDay),
      },
      include: {
        donor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            donorCode: true,
            whatsappPhone: true,
            personalEmail: true,
            assignedToUserId: true,
          },
        },
      },
      orderBy: [{ month: "asc" }, { day: "asc" }],
    });

    const assignedUserIds = occasions
      .filter((o) => o.donor.assignedToUserId)
      .map((o) => o.donor.assignedToUserId!);

    const users =
      assignedUserIds.length > 0
        ? await this.prisma.user.findMany({
            where: { id: { in: [...new Set(assignedUserIds)] } },
            select: { id: true, name: true },
          })
        : [];
    const userMap = new Map(users.map((u) => [u.id, u.name]));

    return occasions.map((o) => {
      const eventDate = new Date(now.getFullYear(), o.month - 1, o.day);
      if (eventDate < now) {
        eventDate.setFullYear(eventDate.getFullYear() + 1);
      }
      return {
        id: o.id,
        donorId: o.donorId,
        donorCode: o.donor.donorCode,
        donorName: `${o.donor.firstName} ${o.donor.lastName || ""}`.trim(),
        type: o.type,
        relatedPersonName: o.relatedPersonName,
        date: eventDate,
        month: o.month,
        day: o.day,
        assignedStaff: o.donor.assignedToUserId
          ? userMap.get(o.donor.assignedToUserId) || null
          : null,
        hasEmail: !!o.donor.personalEmail,
        hasWhatsApp: !!o.donor.whatsappPhone,
      };
    });
  }

  private getNext30DaysMonthDayFilter(
    currentMonth: number,
    currentDay: number,
  ) {
    const filters: any[] = [];
    const now = new Date();
    for (let i = 0; i <= 30; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() + i);
      const m = d.getMonth() + 1;
      const day = d.getDate();
      filters.push({ month: m, day });
    }
    return filters;
  }

  async exportSummaryPdf(): Promise<Buffer> {
    const [summary, charts, topDonors, orgProfile] = await Promise.all([
      this.getSummary(),
      this.getCharts(),
      this.getTopDonorsSegment(),
      this.orgProfileService.getProfile(),
    ]);
    const orgName = orgProfile.name;

    return new Promise((resolve) => {
      const doc = new PDFDocument({ margin: 40, size: "A4" });
      const chunks: Buffer[] = [];
      doc.on("data", (chunk: Buffer) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));

      doc
        .fontSize(18)
        .font("Helvetica-Bold")
        .text(orgName, { align: "center" });
      doc.fontSize(14).text("Analytics Summary Report", { align: "center" });
      doc
        .fontSize(9)
        .font("Helvetica")
        .text(
          `Generated: ${new Date().toLocaleDateString("en-IN", { dateStyle: "long" })}`,
          { align: "center" },
        );
      doc.moveDown(1);

      doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .text("Key Performance Indicators");
      doc.moveDown(0.3);
      doc.fontSize(10).font("Helvetica");

      const fmt = (n: number) =>
        new Intl.NumberFormat("en-IN", {
          style: "currency",
          currency: "INR",
          maximumFractionDigits: 0,
        }).format(n);

      const kpis = [
        ["Total Donors", String(summary.totalDonors)],
        ["Donations This Month", fmt(summary.donationsThisMonth)],
        ["Donations (Trailing 12 Months)", fmt(summary.donationsT12)],
        ["Donation Count This Month", String(summary.donationCountThisMonth)],
        [
          "Active Sponsorships",
          `${summary.activeSponsorships} (${fmt(summary.activeSponsorshipsMonthlyTotal)}/mo)`,
        ],
        [
          "Pledges Pending",
          `${summary.pledgesPendingCount} (${fmt(summary.pledgesPendingAmount)})`,
        ],
        [
          "Donors With Special Days (Next 30d)",
          String(summary.donorsWithSpecialDaysNext30),
        ],
        ["Donors At Risk", String(summary.donorsAtRisk)],
      ];

      const colWidth = 250;
      const rowHeight = 18;
      const startX = doc.x;
      kpis.forEach(([label, value], i) => {
        const x = startX + (i % 2) * colWidth;
        const y = doc.y;
        doc
          .font("Helvetica")
          .text(label + ": ", x, i % 2 === 0 ? y : y - rowHeight, {
            continued: true,
            width: colWidth - 10,
          });
        doc.font("Helvetica-Bold").text(value, { width: colWidth - 10 });
        if (i % 2 === 1) doc.moveDown(0.1);
      });
      if (kpis.length % 2 !== 0) doc.moveDown(0.5);

      doc.moveDown(0.8);
      doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .text("Monthly Donation Trend (Last 12 Months)");
      doc.moveDown(0.3);
      doc.fontSize(9).font("Helvetica");

      const trendData = charts.monthlyDonations;
      const maxAmt = Math.max(...trendData.map((m) => m.amount), 1);
      const barMaxWidth = 300;
      const barH = 12;
      trendData.forEach((m) => {
        const barW = Math.max((m.amount / maxAmt) * barMaxWidth, 1);
        const y = doc.y;
        doc.text(m.month, startX, y, { width: 60 });
        doc.rect(startX + 65, y, barW, barH).fill("#4f46e5");
        doc
          .fillColor("black")
          .text(fmt(m.amount), startX + 70 + barW, y, { width: 100 });
        doc.y = y + barH + 4;
      });

      doc.moveDown(0.8);
      doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .text("Donations by Home Type (This FY)");
      doc.moveDown(0.3);
      doc.fontSize(9).font("Helvetica");
      const homeLabels: Record<string, string> = {
        GIRLS_HOME: "Girls Home",
        BLIND_BOYS_HOME: "Blind Boys Home",
        OLD_AGE_HOME: "Old Age Home",
        GENERAL: "General",
        UNSPECIFIED: "Not Specified",
      };
      charts.donationsByHome.forEach((h) => {
        doc.text(
          `${homeLabels[h.home] || h.home}: ${fmt(h.amount)} (${h.count} donations)`,
        );
      });

      doc.moveDown(0.8);
      doc.fontSize(12).font("Helvetica-Bold").text("Top 5 Donors (This FY)");
      doc.moveDown(0.3);
      doc.fontSize(9).font("Helvetica");
      topDonors.slice(0, 5).forEach((d, i) => {
        doc.text(
          `${i + 1}. ${d.donorName} (${d.donorCode}) - ${fmt(d.totalAmount)} (${d.count} donations)`,
        );
      });

      doc.end();
    });
  }

  async exportDonationsDetailXlsx(filters: {
    from?: string;
    to?: string;
    home?: string;
    type?: string;
  }): Promise<Buffer> {
    const where: any = { isDeleted: false };

    const now = new Date();
    const defaultFrom = new Date(
      now.getFullYear() - 1,
      now.getMonth(),
      now.getDate(),
    );
    where.donationDate = {
      gte: filters.from ? new Date(filters.from) : defaultFrom,
      ...(filters.to ? { lte: new Date(filters.to + "T23:59:59") } : {}),
    };

    if (filters.home && filters.home !== "all") {
      where.donationHomeType = filters.home;
    }
    if (filters.type && filters.type !== "all") {
      where.donationType = filters.type;
    }

    const donations = await this.prisma.donation.findMany({
      where,
      include: {
        donor: {
          select: {
            donorCode: true,
            firstName: true,
            middleName: true,
            lastName: true,
            primaryPhone: true,
            personalEmail: true,
          },
        },
        createdBy: { select: { name: true, email: true } },
      },
      orderBy: { donationDate: "desc" },
    });

    const homeLabels: Record<string, string> = {
      GIRLS_HOME: "Girls Home",
      BLIND_BOYS_HOME: "Blind Boys Home",
      OLD_AGE_HOME: "Old Age Home",
      GENERAL: "General",
    };

    const typeLabels: Record<string, string> = {
      CASH: "Cash",
      ANNADANAM: "Annadanam",
      GROCERIES: "Groceries",
      GROCERY: "Grocery",
      MEDICINES: "Medicines",
      RICE_BAGS: "Rice Bags",
      STATIONERY: "Stationery",
      SPORTS_KITS: "Sports Kits",
      USED_ITEMS: "Used Items",
      PREPARED_FOOD: "Prepared Food",
      KIND: "In-Kind",
      OTHER: "Other",
    };

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Donations");

    sheet.columns = [
      { header: "Receipt No", key: "receiptNumber", width: 16 },
      { header: "Donation Date", key: "donationDate", width: 15 },
      { header: "Donor Code", key: "donorCode", width: 14 },
      { header: "Donor Name", key: "donorName", width: 25 },
      { header: "Donor Phone", key: "donorPhone", width: 16 },
      { header: "Donor Email", key: "donorEmail", width: 28 },
      { header: "Donation Type", key: "donationType", width: 16 },
      { header: "Payment Mode", key: "paymentMode", width: 16 },
      { header: "Amount (₹)", key: "amount", width: 14 },
      { header: "Quantity", key: "quantity", width: 10 },
      { header: "Unit", key: "unit", width: 12 },
      { header: "Estimated Value (₹)", key: "estimatedValue", width: 18 },
      { header: "Designated Home", key: "home", width: 18 },
      { header: "Notes", key: "notes", width: 30 },
      { header: "Created By", key: "createdBy", width: 22 },
      { header: "Created At", key: "createdAt", width: 18 },
    ];

    for (const d of donations) {
      const isCash = d.donationType === "CASH";
      const amt = d.donationAmount ? Number(d.donationAmount) : 0;
      const donorName = [
        d.donor?.firstName,
        d.donor?.middleName,
        d.donor?.lastName,
      ]
        .filter(Boolean)
        .join(" ");
      sheet.addRow({
        receiptNumber: d.receiptNumber || "",
        donationDate: d.donationDate.toLocaleDateString("en-IN"),
        donorCode: d.donor?.donorCode || "",
        donorName,
        donorPhone: d.donor?.primaryPhone || "",
        donorEmail: d.donor?.personalEmail || "",
        donationType: typeLabels[d.donationType] || d.donationType,
        paymentMode: isCash ? d.donationMode || "Cash" : "IN_KIND",
        amount: isCash ? amt : "",
        quantity: d.quantity != null ? Number(d.quantity) : "",
        unit: d.unit || "",
        estimatedValue: !isCash && amt > 0 ? amt : "",
        home: d.donationHomeType
          ? homeLabels[d.donationHomeType] || d.donationHomeType
          : "Not Specified",
        notes: d.remarks || "",
        createdBy: d.createdBy?.name || d.createdBy?.email || "",
        createdAt: d.createdAt.toLocaleDateString("en-IN"),
      });
    }

    this.styleSheet(sheet);
    sheet.getColumn("amount").numFmt = "#,##0.00";
    sheet.getColumn("estimatedValue").numFmt = "#,##0.00";

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  async exportDonationsXlsx(): Promise<Buffer> {
    const now = new Date();
    const workbook = new ExcelJS.Workbook();

    const sheet1 = workbook.addWorksheet("Monthly Summary");
    sheet1.columns = [
      { header: "Month", key: "month", width: 15 },
      { header: "Amount (INR)", key: "amount", width: 18 },
      { header: "Count", key: "count", width: 10 },
    ];
    const monthly = await this.getMonthlyDonationSeries();
    monthly.forEach((m) => sheet1.addRow(m));
    this.styleSheet(sheet1);

    const sheet2 = workbook.addWorksheet("By Type");
    sheet2.columns = [
      { header: "Type", key: "type", width: 20 },
      { header: "Amount (INR)", key: "amount", width: 18 },
      { header: "Count", key: "count", width: 10 },
    ];
    const byType = await this.getDonationsByType();
    byType.forEach((t) => sheet2.addRow(t));
    this.styleSheet(sheet2);

    const sheet3 = workbook.addWorksheet("By Home");
    sheet3.columns = [
      { header: "Home", key: "home", width: 20 },
      { header: "Amount (INR)", key: "amount", width: 18 },
      { header: "Count", key: "count", width: 10 },
    ];
    const byHome = await this.getDonationsByHome();
    byHome.forEach((h) => sheet3.addRow(h));
    this.styleSheet(sheet3);

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  async exportRiskXlsx(): Promise<Buffer> {
    const atRisk = await this.computeAtRiskDonors();
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Donors At Risk");
    sheet.columns = [
      { header: "Donor Code", key: "donorCode", width: 18 },
      { header: "Donor Name", key: "donorName", width: 25 },
      { header: "Last Donation", key: "lastDonationDate", width: 15 },
      { header: "Expected Next", key: "expectedNextDate", width: 15 },
      { header: "Overdue Days", key: "overdueDays", width: 12 },
      { header: "Risk Level", key: "riskLevel", width: 12 },
    ];
    atRisk.forEach((d) => {
      sheet.addRow({
        ...d,
        lastDonationDate: new Date(d.lastDonationDate).toLocaleDateString(
          "en-IN",
        ),
        expectedNextDate: new Date(d.expectedNextDate).toLocaleDateString(
          "en-IN",
        ),
      });
    });
    this.styleSheet(sheet);

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  async getManagementDashboard() {
    const { fyStart, fyEnd } = this.getCurrentFY();
    const { start: monthStart, end: monthEnd } = this.getMonthRange();
    const { start: t12Start, end: t12End } = this.getTrailing12MonthsRange();

    const now = new Date();
    const ninetyDaysAgo = new Date(now);
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const currentDay = now.getDate();

    const [
      totalDonors,
      donationsThisMonth,
      donationsT12,
      activeSponsors,
      pendingPledges,
      monthlyDonations,
      donationsByType,
      donationsByHome,
      topDonorsFY,
    ] = await Promise.all([
      this.prisma.donor.count({ where: { deletedAt: null } }),
      this.prisma.donation.aggregate({
        _sum: { donationAmount: true },
        _count: { id: true },
        where: {
          deletedAt: null,
          donationDate: { gte: monthStart, lte: monthEnd },
        },
      }),
      this.prisma.donation.aggregate({
        _sum: { donationAmount: true },
        where: {
          deletedAt: null,
          donationDate: { gte: t12Start, lte: t12End },
        },
      }),
      this.prisma.sponsorship.findMany({
        where: { isActive: true, status: "ACTIVE" },
        select: { amount: true, dueDayOfMonth: true, frequency: true },
      }),
      this.prisma.pledge.aggregate({
        _count: { id: true },
        where: { isDeleted: false, status: { in: ["PENDING", "POSTPONED"] } },
      }),
      this.getMonthlyDonationSeries(),
      this.getDonationsByType(),
      this.getDonationsByHome(),
      this.getTopDonorsSegment(),
    ]);

    const overdueSponsorships = activeSponsors.filter(
      (s) =>
        s.frequency === "MONTHLY" &&
        s.dueDayOfMonth != null &&
        s.dueDayOfMonth < currentDay,
    );

    const inactiveDonors = await this.getInactiveDonors90Days();

    return {
      kpis: {
        totalDonors,
        donationsThisMonth:
          donationsThisMonth._sum.donationAmount?.toNumber() || 0,
        donationsThisMonthCount: donationsThisMonth._count.id || 0,
        donationsT12: donationsT12._sum.donationAmount?.toNumber() || 0,
        activeSponsorships: activeSponsors.length,
        overdueSponsorships: overdueSponsorships.length,
        pledgesPending: pendingPledges._count.id || 0,
      },
      charts: {
        monthlyDonations,
        donationsByType,
        donationsByHome,
      },
      topDonors: topDonorsFY.slice(0, 10),
      inactiveDonors,
    };
  }

  private async getInactiveDonors90Days() {
    const now = new Date();
    const ninetyDaysAgo = new Date(now);
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const donors = await this.prisma.donor.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        donorCode: true,
        personalEmail: true,
        primaryPhone: true,
        donations: {
          where: { deletedAt: null },
          orderBy: { donationDate: "desc" },
          take: 1,
          select: { donationDate: true, donationAmount: true },
        },
      },
    });

    const inactive: any[] = [];
    for (const donor of donors) {
      if (donor.donations.length === 0) continue;
      const lastDonDate = new Date(donor.donations[0].donationDate);
      if (lastDonDate < ninetyDaysAgo) {
        const daysSince = Math.round(
          (now.getTime() - lastDonDate.getTime()) / (1000 * 60 * 60 * 24),
        );
        inactive.push({
          donorId: donor.id,
          donorCode: donor.donorCode,
          donorName: `${donor.firstName} ${donor.lastName || ""}`.trim(),
          lastDonationDate: lastDonDate,
          lastDonationAmount:
            donor.donations[0].donationAmount?.toNumber() || 0,
          daysSinceLastDonation: daysSince,
          hasEmail: !!donor.personalEmail,
          hasPhone: !!donor.primaryPhone,
        });
      }
    }

    inactive.sort((a, b) => b.daysSinceLastDonation - a.daysSinceLastDonation);
    return inactive;
  }

  async exportBoardSummaryPdf(): Promise<Buffer> {
    const [data, orgProfile] = await Promise.all([
      this.getManagementDashboard(),
      this.orgProfileService.getProfile(),
    ]);
    const orgName = orgProfile.name;
    const primaryColor = orgProfile.brandingPrimaryColor || "#2E7D32";
    const { fyStart } = this.getCurrentFY();
    const fyYear = fyStart.getFullYear();
    const fyLabel = `FY ${fyYear}-${(fyYear + 1).toString().slice(-2)}`;
    const fmt = (n: number) =>
      new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }).format(n);

    return new Promise((resolve) => {
      const doc = new PDFDocument({ margin: 30, size: "A4" });
      const chunks: Buffer[] = [];
      doc.on("data", (chunk: Buffer) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));

      doc.rect(0, 0, 595, 50).fill(primaryColor);
      doc.fill("#FFFFFF").fontSize(15).font("Helvetica-Bold");
      doc.text(`${orgName} — Management Dashboard`, 30, 12, {
        align: "center",
        width: 535,
      });
      doc.fontSize(9).font("Helvetica");
      doc.text(
        `${fyLabel} | Generated: ${new Date().toLocaleDateString("en-IN", { dateStyle: "long" })}`,
        30,
        32,
        { align: "center", width: 535 },
      );

      let y = 60;

      doc
        .fill(primaryColor)
        .fontSize(11)
        .font("Helvetica-Bold")
        .text("KEY PERFORMANCE INDICATORS", 30, y);
      y += 16;

      const kpiItems = [
        ["Total Donors", String(data.kpis.totalDonors)],
        ["Donations This Month", fmt(data.kpis.donationsThisMonth)],
        ["Donations (Trailing 12 Mo)", fmt(data.kpis.donationsT12)],
        ["Active Sponsors", String(data.kpis.activeSponsorships)],
        ["Overdue Sponsors", String(data.kpis.overdueSponsorships)],
        ["Pledges Pending", String(data.kpis.pledgesPending)],
      ];

      doc.fontSize(9).font("Helvetica");
      const colW = 260;
      kpiItems.forEach(([label, value], i) => {
        const col = i % 2;
        const x = 30 + col * colW;
        if (i % 2 === 0 && i > 0) y += 14;
        doc
          .font("Helvetica")
          .fillColor("black")
          .text(`${label}: `, x, y, { continued: true, width: colW - 10 });
        doc.font("Helvetica-Bold").text(value, { width: colW - 10 });
      });
      y += 22;

      doc
        .fill(primaryColor)
        .fontSize(11)
        .font("Helvetica-Bold")
        .text("MONTHLY DONATION TREND (12 MONTHS)", 30, y);
      y += 14;
      doc.fontSize(8).font("Helvetica");
      const maxAmt = Math.max(
        ...data.charts.monthlyDonations.map((m: any) => m.amount),
        1,
      );
      const barMax = 300;
      data.charts.monthlyDonations.forEach((m: any) => {
        const barW = Math.max((m.amount / maxAmt) * barMax, 1);
        doc.fillColor("black").text(m.month, 30, y, { width: 55 });
        doc.rect(88, y, barW, 10).fill("#4f46e5");
        doc.fillColor("black").text(fmt(m.amount), 95 + barW, y, { width: 90 });
        y += 13;
      });
      y += 6;

      const homeLabels: Record<string, string> = {
        GIRLS_HOME: "Girls Home",
        BLIND_BOYS_HOME: "Blind Boys Home",
        OLD_AGE_HOME: "Old Age Home",
        GENERAL: "General",
        UNSPECIFIED: "Not Specified",
        ORPHAN_GIRLS: "Girls Home",
        BLIND_BOYS: "Blind Boys Home",
        OLD_AGE: "Old Age Home",
      };

      doc
        .fill(primaryColor)
        .fontSize(11)
        .font("Helvetica-Bold")
        .text("DONATIONS BY HOME (THIS FY)", 30, y);
      y += 14;
      doc.fontSize(9).font("Helvetica").fillColor("black");
      data.charts.donationsByHome.forEach((h: any) => {
        doc.text(
          `${homeLabels[h.home] || h.home}: ${fmt(h.amount)} (${h.count} donations)`,
          30,
          y,
        );
        y += 13;
      });
      y += 6;

      const typeLabels: Record<string, string> = {
        CASH: "Cash",
        KIND: "In-Kind",
        ANNADANAM: "Annadanam",
        GROCERIES: "Groceries",
        MEDICINES: "Medicines",
        OTHER: "Other",
      };
      doc
        .fill(primaryColor)
        .fontSize(11)
        .font("Helvetica-Bold")
        .text("DONATIONS BY TYPE (THIS FY)", 30, y);
      y += 14;
      doc.fontSize(9).font("Helvetica").fillColor("black");
      data.charts.donationsByType.forEach((t: any) => {
        doc.text(
          `${typeLabels[t.type] || t.type}: ${fmt(t.amount)} (${t.count} donations)`,
          30,
          y,
        );
        y += 13;
      });
      y += 6;

      if (y > 650) {
        doc.addPage();
        y = 30;
      }

      doc
        .fill(primaryColor)
        .fontSize(11)
        .font("Helvetica-Bold")
        .text("TOP 10 DONORS (THIS FY)", 30, y);
      y += 14;
      doc.fontSize(8).font("Helvetica").fillColor("black");
      const headerY = y;
      doc.font("Helvetica-Bold");
      doc.text("#", 30, headerY, { width: 18 });
      doc.text("Donor", 48, headerY, { width: 180 });
      doc.text("Amount", 228, headerY, { width: 100 });
      doc.text("Count", 328, headerY, { width: 50 });
      doc.text("Last Donation", 378, headerY, { width: 100 });
      y += 12;
      doc.font("Helvetica");
      data.topDonors.forEach((d: any, i: number) => {
        doc.text(String(i + 1), 30, y, { width: 18 });
        doc.text(`${d.donorName} (${d.donorCode})`, 48, y, { width: 180 });
        doc.text(fmt(d.totalAmount), 228, y, { width: 100 });
        doc.text(String(d.count), 328, y, { width: 50 });
        doc.text(
          d.lastDonationDate
            ? new Date(d.lastDonationDate).toLocaleDateString("en-IN")
            : "-",
          378,
          y,
          { width: 100 },
        );
        y += 12;
      });
      y += 6;

      if (y > 650) {
        doc.addPage();
        y = 30;
      }

      doc
        .fill(primaryColor)
        .fontSize(11)
        .font("Helvetica-Bold")
        .text(
          `DONORS AT RISK (NO DONATION >90 DAYS) — ${data.inactiveDonors.length} donors`,
          30,
          y,
        );
      y += 14;
      doc.fontSize(8).font("Helvetica").fillColor("black");
      doc.font("Helvetica-Bold");
      doc.text("#", 30, y, { width: 18 });
      doc.text("Donor", 48, y, { width: 180 });
      doc.text("Last Donation", 228, y, { width: 100 });
      doc.text("Days Inactive", 328, y, { width: 70 });
      y += 12;
      doc.font("Helvetica");
      const riskSlice = data.inactiveDonors.slice(0, 15);
      riskSlice.forEach((d: any, i: number) => {
        if (y > 780) {
          doc.addPage();
          y = 30;
        }
        doc.text(String(i + 1), 30, y, { width: 18 });
        doc.text(`${d.donorName} (${d.donorCode})`, 48, y, { width: 180 });
        doc.text(
          new Date(d.lastDonationDate).toLocaleDateString("en-IN"),
          228,
          y,
          { width: 100 },
        );
        doc.text(String(d.daysSinceLastDonation), 328, y, { width: 70 });
        y += 12;
      });
      if (data.inactiveDonors.length > 15) {
        doc.text(
          `... and ${data.inactiveDonors.length - 15} more donors`,
          30,
          y,
        );
      }

      doc.end();
    });
  }

  async exportHomeTotalsXlsx(): Promise<Buffer> {
    const { fyStart, fyEnd } = this.getCurrentFY();
    const fyYear = fyStart.getFullYear();
    const fyLabel = `FY ${fyYear}-${(fyYear + 1).toString().slice(-2)}`;

    const homeLabels: Record<string, string> = {
      GIRLS_HOME: "Girls Home",
      BLIND_BOYS_HOME: "Blind Boys Home",
      OLD_AGE_HOME: "Old Age Home",
      GENERAL: "General",
      ORPHAN_GIRLS: "Girls Home",
      BLIND_BOYS: "Blind Boys Home",
      OLD_AGE: "Old Age Home",
    };

    const byHome = await this.getDonationsByHome();

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Home-wise Totals");
    sheet.columns = [
      { header: "Home", key: "home", width: 25 },
      { header: `Amount (INR) - ${fyLabel}`, key: "amount", width: 22 },
      { header: "Donation Count", key: "count", width: 16 },
    ];
    byHome.forEach((h) => {
      sheet.addRow({
        home: homeLabels[h.home] || h.home,
        amount: h.amount,
        count: h.count,
      });
    });
    const totalAmt = byHome.reduce((s, h) => s + h.amount, 0);
    const totalCnt = byHome.reduce((s, h) => s + h.count, 0);
    const totalRow = sheet.addRow({
      home: "TOTAL",
      amount: totalAmt,
      count: totalCnt,
    });
    totalRow.font = { bold: true };
    sheet.getColumn("amount").numFmt = "#,##0.00";
    this.styleSheet(sheet);

    const sheet2 = workbook.addWorksheet("Donors At Risk (90 Days)");
    sheet2.columns = [
      { header: "Donor Code", key: "donorCode", width: 16 },
      { header: "Donor Name", key: "donorName", width: 28 },
      { header: "Last Donation Date", key: "lastDonationDate", width: 18 },
      { header: "Last Amount (INR)", key: "lastDonationAmount", width: 18 },
      { header: "Days Inactive", key: "daysSinceLastDonation", width: 14 },
      { header: "Email", key: "hasEmail", width: 8 },
      { header: "Phone", key: "hasPhone", width: 8 },
    ];
    const inactiveDonors = await this.getInactiveDonors90Days();
    inactiveDonors.forEach((d) => {
      sheet2.addRow({
        donorCode: d.donorCode,
        donorName: d.donorName,
        lastDonationDate: new Date(d.lastDonationDate).toLocaleDateString(
          "en-IN",
        ),
        lastDonationAmount: d.lastDonationAmount,
        daysSinceLastDonation: d.daysSinceLastDonation,
        hasEmail: d.hasEmail ? "Yes" : "No",
        hasPhone: d.hasPhone ? "Yes" : "No",
      });
    });
    sheet2.getColumn("lastDonationAmount").numFmt = "#,##0.00";
    this.styleSheet(sheet2);

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  private styleSheet(sheet: ExcelJS.Worksheet) {
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE8E8E8" },
    };
  }
}
