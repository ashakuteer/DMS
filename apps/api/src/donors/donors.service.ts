import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { Role } from "@prisma/client";
import { maskDonorData } from "../common/utils/masking.util";
import { DonorsCrudService } from "./donors.crud.service";
import { DonorsImportService } from "./donors.import.service";
import { UserContext, DonorQueryOptions } from "./donors.types";
import { StorageService } from "../storage/storage.service";
import * as ExcelJS from "exceljs";

@Injectable()
export class DonorsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly storageService: StorageService,
    private readonly crud: DonorsCrudService,
    private readonly importService: DonorsImportService,
  ) {}

  private getAccessFilter(user: UserContext): any {
    if (user.role === Role.TELECALLER) {
      return { assignedToUserId: user.id };
    }
    return {};
  }

  private shouldMaskData(user: UserContext): boolean {
    return user.role === Role.TELECALLER || user.role === Role.VIEWER;
  }

  findAll(user: UserContext, options: DonorQueryOptions = {}) {
    return this.crud.findAll(user, options);
  }

  findOne(user: UserContext, id: string) {
    return this.crud.findOne(user, id);
  }

  lookupByPhone(phone: string) {
    return this.crud.lookupByPhone(phone);
  }

  create(
    user: UserContext,
    data: any,
    ipAddress?: string,
    userAgent?: string,
  ) {
    return this.crud.create(user, data, ipAddress, userAgent);
  }

  update(
    user: UserContext,
    id: string,
    data: any,
    ipAddress?: string,
    userAgent?: string,
  ) {
    return this.crud.update(user, id, data, ipAddress, userAgent);
  }

  softDelete(
    user: UserContext,
    id: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    return this.crud.softDelete(user, id, ipAddress, userAgent);
  }

  assignDonor(id: string, assignedToUserId: string | null) {
    return this.crud.assignDonor(id, assignedToUserId);
  }

  bulkReassignDonors(fromUserId: string, toUserId: string) {
    return this.crud.bulkReassignDonors(fromUserId, toUserId);
  }

  countDonorsByAssignee(userId: string) {
    return this.crud.countDonorsByAssignee(userId);
  }

  parseImportFile(file: Express.Multer.File) {
    return this.importService.parseImportFile(file);
  }

  detectDuplicatesInBatch(
    rows: any[],
    columnMapping: Record<string, string>,
  ) {
    return this.importService.detectDuplicatesInBatch(rows, columnMapping);
  }

  executeBulkImport(
    user: UserContext,
    rows: any[],
    columnMapping: Record<string, string>,
    actions: Record<number, "skip" | "update" | "create">,
    ipAddress?: string,
    userAgent?: string,
  ) {
    return this.importService.executeBulkImport(
      user,
      rows,
      columnMapping,
      actions,
      ipAddress,
      userAgent,
    );
  }

  generateBulkTemplate(): Promise<Buffer> {
    return this.importService.generateBulkTemplate();
  }

  bulkUpload(
    file: Express.Multer.File,
    user: UserContext,
    mode: "upsert" | "insert_only" = "upsert",
    ipAddress?: string,
    userAgent?: string,
  ) {
    return this.importService.bulkUpload(
      file,
      user,
      mode,
      ipAddress,
      userAgent,
    );
  }

  async uploadPhoto(user: UserContext, id: string, file: Express.Multer.File) {
    const donor = await this.prisma.donor.findFirst({
      where: { id, isDeleted: false },
    });

    if (!donor) {
      throw new NotFoundException("Donor not found");
    }

    if (donor.profilePicUrl) {
      await this.storageService.deleteDonorPhoto(donor.profilePicUrl);
    }

    const { url } = await this.storageService.uploadDonorPhoto(
      id,
      file.buffer,
      file.mimetype,
      file.originalname,
    );

    await this.prisma.donor.update({
      where: { id },
      data: { profilePicUrl: url },
    });

    return { profilePicUrl: url };
  }

  async requestFullAccess(
    user: UserContext,
    donorId: string,
    reason?: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const donor = await this.prisma.donor.findFirst({
      where: { id: donorId, isDeleted: false },
    });

    if (!donor) {
      throw new NotFoundException("Donor not found");
    }

    await this.auditService.logFullAccessRequest(
      user.id,
      donorId,
      reason,
      ipAddress,
      userAgent,
    );

    return {
      success: true,
      message: "Full access request has been logged for admin review",
    };
  }

  async exportDonors(
    user: UserContext,
    filters: any = {},
    ipAddress?: string,
    userAgent?: string,
  ) {
    if (user.role !== Role.ADMIN) {
      throw new ForbiddenException("Only administrators can export donor data");
    }

    const where: any = { isDeleted: false };

    if (filters.search) {
      where.OR = [
        { firstName: { contains: filters.search, mode: "insensitive" } },
        { lastName: { contains: filters.search, mode: "insensitive" } },
        { donorCode: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    const donors = await this.prisma.donor.findMany({
      where,
      include: {
        assignedToUser: { select: { id: true, name: true } },
        _count: { select: { donations: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    await this.auditService.logDataExport(
      user.id,
      "Donors",
      filters,
      donors.length,
      ipAddress,
      userAgent,
    );

    return donors;
  }

  async checkDuplicate(phone?: string, email?: string) {
    if (!phone && !email) {
      return { duplicates: [] };
    }

    const conditions: any[] = [];

    if (phone) {
      conditions.push({ primaryPhone: phone });
      conditions.push({ alternatePhone: phone });
      conditions.push({ whatsappPhone: phone });
    }

    if (email) {
      conditions.push({
        personalEmail: { equals: email, mode: "insensitive" },
      });
      conditions.push({
        officialEmail: { equals: email, mode: "insensitive" },
      });
    }

    const duplicates = await this.prisma.donor.findMany({
      where: {
        isDeleted: false,
        OR: conditions,
      },
      select: {
        id: true,
        donorCode: true,
        firstName: true,
        lastName: true,
        primaryPhone: true,
        personalEmail: true,
      },
      take: 5,
    });

    return { duplicates };
  }

  async exportMasterDonorExcel(
    user: UserContext,
    filters: {
      home?: string;
      donorType?: string;
      activity?: string;
    } = {},
    ipAddress?: string,
    userAgent?: string,
  ): Promise<Buffer> {
    if (user.role !== Role.ADMIN) {
      throw new ForbiddenException("Only administrators can export donor data");
    }

    const where: any = { isDeleted: false };

    if (filters.donorType && filters.donorType !== "all") {
      where.category = filters.donorType;
    }

    const donors = await this.prisma.donor.findMany({
      where,
      include: {
        assignedToUser: { select: { name: true } },
        createdBy: { select: { name: true } },
        specialOccasions: {
          select: {
            type: true,
            day: true,
            month: true,
            relatedPersonName: true,
          },
        },
        familyMembers: {
          select: { name: true, relationType: true, phone: true },
        },
        sponsorships: {
          where: { isActive: true },
          select: {
            status: true,
            amount: true,
            frequency: true,
            sponsorshipType: true,
            beneficiary: {
              select: { fullName: true, homeType: true, code: true },
            },
          },
        },
        donations: {
          where: { isDeleted: false },
          select: {
            donationAmount: true,
            donationDate: true,
            donationType: true,
            donationHomeType: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    let filtered: typeof donors = donors;

    if (filters.home && filters.home !== "all") {
      filtered = filtered.filter(
        (d) =>
          d.donations.some((don: any) => don.donationHomeType === filters.home) ||
          d.sponsorships.some((s: any) => s.beneficiary?.homeType === filters.home),
      );
    }

    const now = new Date();
    const oneYearAgo = new Date(now);
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    if (filters.activity === "active") {
      filtered = filtered.filter(
        (d) =>
          d.donations.some((don: any) => new Date(don.donationDate) >= oneYearAgo) ||
          d.sponsorships.some((s: any) => s.status === "ACTIVE"),
      );
    } else if (filters.activity === "inactive") {
      filtered = filtered.filter(
        (d) =>
          !d.donations.some(
            (don: any) => new Date(don.donationDate) >= oneYearAgo,
          ) && !d.sponsorships.some((s: any) => s.status === "ACTIVE"),
      );
    }

    const categoryLabels: Record<string, string> = {
      INDIVIDUAL: "Individual",
      NGO: "NGO",
      CSR_REP: "CSR Rep",
      WHATSAPP_GROUP: "WhatsApp Group",
      SOCIAL_MEDIA_PERSON: "Social Media",
      CROWD_PULLER: "Crowd Puller",
      VISITOR_ENQUIRY: "Visitor/Enquiry",
    };

    const occasionLabels: Record<string, string> = {
      DOB_SELF: "Birthday",
      DOB_SPOUSE: "Spouse Birthday",
      DOB_CHILD: "Child Birthday",
      ANNIVERSARY: "Anniversary",
      DEATH_ANNIVERSARY: "Death Anniversary",
      OTHER: "Other",
    };

    const homeLabels: Record<string, string> = {
      ORPHAN_GIRLS: "Girls Home",
      BLIND_BOYS: "Blind Boys Home",
      OLD_AGE: "Old Age Home",
      GIRLS_HOME: "Girls Home",
      BLIND_BOYS_HOME: "Blind Boys Home",
      OLD_AGE_HOME: "Old Age Home",
      GENERAL: "General",
    };

    const frequencyLabels: Record<string, string> = {
      MONTHLY: "Monthly",
      QUARTERLY: "Quarterly",
      YEARLY: "Yearly",
      OCCASIONAL: "Occasional",
      ONE_TIME: "One Time",
    };

    const sourceLabels: Record<string, string> = {
      SOCIAL_MEDIA: "Social Media",
      JUSTDIAL: "JustDial",
      FRIEND: "Friend",
      SPONSOR: "Sponsor",
      WEBSITE: "Website",
      WALK_IN: "Walk-In",
      REFERRAL: "Referral",
      OTHER: "Other",
    };

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Master Donor List");

    sheet.columns = [
      { header: "Donor Code", key: "donorCode", width: 14 },
      { header: "First Name", key: "firstName", width: 16 },
      { header: "Middle Name", key: "middleName", width: 14 },
      { header: "Last Name", key: "lastName", width: 16 },
      { header: "Category", key: "category", width: 16 },
      { header: "Gender", key: "gender", width: 10 },
      { header: "Age", key: "age", width: 8 },
      { header: "Profession", key: "profession", width: 18 },
      { header: "Religion", key: "religion", width: 14 },
      { header: "Primary Phone", key: "primaryPhone", width: 16 },
      { header: "WhatsApp Phone", key: "whatsappPhone", width: 16 },
      { header: "Alternate Phone", key: "alternatePhone", width: 16 },
      { header: "Personal Email", key: "personalEmail", width: 26 },
      { header: "Official Email", key: "officialEmail", width: 26 },
      { header: "Address", key: "address", width: 30 },
      { header: "City", key: "city", width: 16 },
      { header: "State", key: "state", width: 14 },
      { header: "Country", key: "country", width: 12 },
      { header: "Pincode", key: "pincode", width: 10 },
      { header: "PAN", key: "pan", width: 14 },
      { header: "Pref: Email", key: "prefEmail", width: 10 },
      { header: "Pref: WhatsApp", key: "prefWhatsapp", width: 12 },
      { header: "Pref: SMS", key: "prefSms", width: 10 },
      { header: "Pref: Reminders", key: "prefReminders", width: 12 },
      { header: "Donation Frequency", key: "donationFrequency", width: 16 },
      { header: "Source", key: "source", width: 16 },
      { header: "Income Spectrum", key: "incomeSpectrum", width: 14 },
      { header: "Special Days", key: "specialDays", width: 40 },
      { header: "Family Members", key: "familyMembers", width: 36 },
      { header: "Active Sponsorships", key: "sponsorships", width: 40 },
      {
        header: "Sponsorship Total (/mo)",
        key: "sponsorshipMonthlyTotal",
        width: 18,
      },
      { header: "Lifetime Donations", key: "lifetimeDonationCount", width: 16 },
      {
        header: "Lifetime Total (INR)",
        key: "lifetimeDonationTotal",
        width: 18,
      },
      { header: "Last Donation Date", key: "lastDonationDate", width: 16 },
      { header: "Homes Donated To", key: "homesDonatedTo", width: 24 },
      { header: "Health Score", key: "healthScore", width: 12 },
      { header: "Health Status", key: "healthStatus", width: 12 },
      { header: "Assigned To", key: "assignedTo", width: 18 },
      { header: "Notes", key: "notes", width: 30 },
      { header: "Created Date", key: "createdAt", width: 14 },
    ];

    for (const d of filtered) {
      const specialDaysStr = d.specialOccasions
        .map((o: any) => {
          const label = occasionLabels[o.type] || o.type;
          const dateStr = `${o.day}/${o.month}`;
          const person = o.relatedPersonName ? ` (${o.relatedPersonName})` : "";
          return `${label}: ${dateStr}${person}`;
        })
        .join("; ");

      const familyStr = d.familyMembers
        .map(
          (f: any) =>
            `${f.name} (${f.relationType})${f.phone ? " - " + f.phone : ""}`,
        )
        .join("; ");

      const sponsorshipsStr = d.sponsorships
        .map((s: any) => {
          const benefName = s.beneficiary?.fullName || "Unknown";
          const home = s.beneficiary?.homeType
            ? homeLabels[s.beneficiary.homeType] || s.beneficiary.homeType
            : "";
          const amt = s.amount ? Number(s.amount) : 0;
          return `${benefName} (${home}) - ₹${amt}/${s.frequency || "Monthly"} [${s.status}]`;
        })
        .join("; ");

      const sponsorshipMonthly = d.sponsorships
        .filter((s: any) => s.status === "ACTIVE")
        .reduce((sum: number, s: any) => sum + (s.amount ? Number(s.amount) : 0), 0);

      const lifetimeTotal = d.donations.reduce(
        (sum: number, don: any) =>
          sum + (don.donationAmount ? Number(don.donationAmount) : 0),
        0,
      );

      const sortedDonations = [...d.donations].sort(
        (a, b) =>
          new Date(b.donationDate).getTime() -
          new Date(a.donationDate).getTime(),
      );
      const lastDonDate = sortedDonations[0]?.donationDate;

      const homes = [
        ...new Set(
          d.donations
            .filter((don: any) => don.donationHomeType)
            .map(
              (don: any) =>
                homeLabels[don.donationHomeType!] || don.donationHomeType,
            ),
        ),
      ].join(", ");

      sheet.addRow({
        donorCode: d.donorCode,
        firstName: d.firstName,
        middleName: d.middleName || "",
        lastName: d.lastName || "",
        category: categoryLabels[d.category] || d.category,
        gender: d.gender || "",
        age: d.approximateAge || "",
        profession: d.profession || "",
        religion: d.religion || "",
        primaryPhone: d.primaryPhone || "",
        whatsappPhone: d.whatsappPhone || "",
        alternatePhone: d.alternatePhone || "",
        personalEmail: d.personalEmail || "",
        officialEmail: d.officialEmail || "",
        address: d.address || "",
        city: d.city || "",
        state: d.state || "",
        country: d.country || "",
        pincode: d.pincode || "",
        pan: d.pan || "",
        prefEmail: d.prefEmail ? "Yes" : "No",
        prefWhatsapp: d.prefWhatsapp ? "Yes" : "No",
        prefSms: d.prefSms ? "Yes" : "No",
        prefReminders: d.prefReminders ? "Yes" : "No",
        donationFrequency: d.donationFrequency
          ? frequencyLabels[d.donationFrequency] || d.donationFrequency
          : "",
        source: d.sourceOfDonor
          ? sourceLabels[d.sourceOfDonor] || d.sourceOfDonor
          : "",
        incomeSpectrum: d.incomeSpectrum || "",
        specialDays: specialDaysStr,
        familyMembers: familyStr,
        sponsorships: sponsorshipsStr,
        sponsorshipMonthlyTotal: sponsorshipMonthly,
        lifetimeDonationCount: d.donations.length,
        lifetimeDonationTotal: lifetimeTotal,
        lastDonationDate: lastDonDate
          ? new Date(lastDonDate).toLocaleDateString("en-IN")
          : "",
        homesDonatedTo: homes,
        healthScore: d.healthScore,
        healthStatus: d.healthStatus,
        assignedTo: (d as any).assignedToUser?.name || "",
        notes: d.notes || "",
        createdAt: d.createdAt.toLocaleDateString("en-IN"),
      });
    }

    const headerRow = sheet.getRow(1);
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF1E4D3A" },
    };
    headerRow.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
    headerRow.alignment = { vertical: "middle", wrapText: true };
    headerRow.height = 28;

    sheet.getColumn("lifetimeDonationTotal").numFmt = "#,##0.00";
    sheet.getColumn("sponsorshipMonthlyTotal").numFmt = "#,##0.00";

    sheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: sheet.columns.length },
    };

    await this.auditService.logDataExport(
      user.id,
      "Master Donor Excel",
      filters,
      filtered.length,
      ipAddress,
      userAgent,
    );

    const buf = await workbook.xlsx.writeBuffer();
    return Buffer.from(buf);
  }

  async getTimeline(
    user: UserContext,
    donorId: string,
    options: {
      page?: number;
      limit?: number;
      startDate?: string;
      endDate?: string;
      types?: string[];
    } = {},
  ) {
    const donor = await this.prisma.donor.findFirst({
      where: { id: donorId, isDeleted: false, ...this.getAccessFilter(user) },
      select: { id: true },
    });

    if (!donor) {
      throw new NotFoundException("Donor not found");
    }

    const { page = 1, limit = 50, startDate, endDate, types } = options;
    const dateFilter: any = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      dateFilter.lte = end;
    }
    const hasDateFilter = Object.keys(dateFilter).length > 0;

    const allTypes = [
      "DONATION",
      "VISIT",
      "COMMUNICATION",
      "BIRTHDAY_WISH",
      "PLEDGE",
      "FOLLOW_UP",
      "SPONSORSHIP",
    ];
    const activeTypes = types && types.length > 0 ? types : allTypes;

    const items: Array<{
      id: string;
      type: string;
      date: string;
      title: string;
      description: string;
      amount?: number;
      currency?: string;
      status?: string;
      metadata?: Record<string, any>;
    }> = [];

    if (activeTypes.includes("DONATION") || activeTypes.includes("VISIT")) {
      const donations = await this.prisma.donation.findMany({
        where: {
          donorId,
          isDeleted: false,
          ...(hasDateFilter ? { donationDate: dateFilter } : {}),
        },
        orderBy: { donationDate: "desc" },
        include: {
          createdBy: { select: { name: true } },
          campaign: { select: { name: true } },
          home: { select: { fullName: true } },
        },
      });

      for (const d of donations) {
        if (activeTypes.includes("DONATION")) {
          items.push({
            id: `donation-${d.id}`,
            type: "DONATION",
            date: d.donationDate.toISOString(),
            title: `Donation - ${d.donationType}`,
            description: `${d.currency} ${Number(d.donationAmount).toLocaleString()} via ${d.donationMode || "N/A"}${d.remarks ? ` - ${d.remarks}` : ""}`,
            amount: Number(d.donationAmount),
            currency: d.currency,
            status: d.receiptNumber ? "RECEIPTED" : "RECORDED",
            metadata: {
              donationType: d.donationType,
              donationMode: d.donationMode,
              receiptNumber: d.receiptNumber,
              campaignName: d.campaign?.name,
              homeName: d.home?.fullName,
              createdBy: d.createdBy?.name,
              visitedHome: d.visitedHome,
              servedFood: d.servedFood,
            },
          });
        }

        if (activeTypes.includes("VISIT") && d.visitedHome) {
          items.push({
            id: `visit-${d.id}`,
            type: "VISIT",
            date: d.donationDate.toISOString(),
            title: "Home Visit",
            description: `Visited${d.home?.fullName ? ` ${d.home.fullName}` : ""}${d.servedFood ? " and served food" : ""}`,
            metadata: {
              homeName: d.home?.fullName,
              servedFood: d.servedFood,
              donationAmount: Number(d.donationAmount),
            },
          });
        }
      }
    }

    if (
      activeTypes.includes("COMMUNICATION") ||
      activeTypes.includes("BIRTHDAY_WISH")
    ) {
      const logs = await this.prisma.communicationLog.findMany({
        where: {
          donorId,
          ...(hasDateFilter ? { createdAt: dateFilter } : {}),
        },
        orderBy: { createdAt: "desc" },
        include: {
          sentBy: { select: { name: true } },
        },
      });

      for (const log of logs) {
        const isBirthdayWish =
          log.type === "GREETING" &&
          (log.subject?.toLowerCase().includes("birthday") ||
            log.subject?.toLowerCase().includes("anniversary") ||
            log.messagePreview?.toLowerCase().includes("birthday"));

        if (isBirthdayWish && activeTypes.includes("BIRTHDAY_WISH")) {
          items.push({
            id: `birthday-${log.id}`,
            type: "BIRTHDAY_WISH",
            date: log.createdAt.toISOString(),
            title: "Birthday/Anniversary Wish",
            description: `${log.channel} ${log.type.toLowerCase()} sent${log.subject ? `: ${log.subject}` : ""}`,
            status: log.status,
            metadata: {
              channel: log.channel,
              sentBy: log.sentBy?.name || "System",
              subject: log.subject,
              messagePreview: log.messagePreview,
            },
          });
        } else if (!isBirthdayWish && activeTypes.includes("COMMUNICATION")) {
          items.push({
            id: `comm-${log.id}`,
            type: "COMMUNICATION",
            date: log.createdAt.toISOString(),
            title: `${log.channel} - ${log.type.replace(/_/g, " ")}`,
            description:
              log.subject ||
              log.messagePreview ||
              `${log.channel} message sent`,
            status: log.status,
            metadata: {
              channel: log.channel,
              communicationType: log.type,
              sentBy: log.sentBy?.name || "System",
              recipient: log.recipient,
              subject: log.subject,
              messagePreview: log.messagePreview,
            },
          });
        }
      }
    }

    if (activeTypes.includes("PLEDGE")) {
      const pledges = await this.prisma.pledge.findMany({
        where: {
          donorId,
          isDeleted: false,
          ...(hasDateFilter ? { expectedFulfillmentDate: dateFilter } : {}),
        },
        orderBy: { createdAt: "desc" },
        include: {
          createdBy: { select: { name: true } },
        },
      });

      for (const p of pledges) {
        items.push({
          id: `pledge-${p.id}`,
          type: "PLEDGE",
          date: p.createdAt.toISOString(),
          title: `Pledge - ${p.pledgeType}`,
          description: `${p.currency} ${Number(p.amount).toLocaleString()}${p.notes ? ` - ${p.notes}` : ""}`,
          amount: Number(p.amount),
          currency: p.currency,
          status: p.status,
          metadata: {
            pledgeType: p.pledgeType,
            expectedDate: p.expectedFulfillmentDate?.toISOString(),
            createdBy: p.createdBy?.name,
          },
        });
      }
    }

    if (activeTypes.includes("FOLLOW_UP")) {
      const followUps = await this.prisma.followUpReminder.findMany({
        where: {
          donorId,
          isDeleted: false,
          ...(hasDateFilter ? { dueDate: dateFilter } : {}),
        },
        orderBy: { createdAt: "desc" },
        include: {
          assignedTo: { select: { name: true } },
          createdBy: { select: { name: true } },
        },
      });

      for (const f of followUps) {
        items.push({
          id: `followup-${f.id}`,
          type: "FOLLOW_UP",
          date: f.createdAt.toISOString(),
          title: `Follow-up${f.status === "COMPLETED" ? " (Completed)" : ""}`,
          description: f.note,
          status: f.status,
          metadata: {
            priority: f.priority,
            dueDate: f.dueDate.toISOString(),
            assignedTo: f.assignedTo?.name,
            createdBy: f.createdBy?.name,
            completedAt: f.completedAt?.toISOString(),
            completedNote: f.completedNote,
          },
        });
      }
    }

    if (activeTypes.includes("SPONSORSHIP")) {
      const sponsorships = await this.prisma.sponsorship.findMany({
        where: {
          donorId,
          ...(hasDateFilter ? { startDate: dateFilter } : {}),
        },
        orderBy: { startDate: "desc" },
        include: {
          beneficiary: { select: { fullName: true } },
        },
      });

      for (const s of sponsorships) {
        items.push({
          id: `sponsorship-${s.id}`,
          type: "SPONSORSHIP",
          date: (s.startDate || s.createdAt).toISOString(),
          title: `Sponsorship - ${s.sponsorshipType}`,
          description: `${s.currency} ${Number(s.amount || 0).toLocaleString()} ${s.frequency}${s.beneficiary?.fullName ? ` for ${s.beneficiary.fullName}` : ""}`,
          amount: Number(s.amount || 0),
          currency: s.currency,
          status: s.isActive ? "ACTIVE" : "INACTIVE",
          metadata: {
            sponsorshipType: s.sponsorshipType,
            frequency: s.frequency,
            beneficiaryName: s.beneficiary?.fullName,
            isActive: s.isActive,
          },
        });
      }
    }

    items.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    const total = items.length;
    const startIdx = (page - 1) * limit;
    const paginated = items.slice(startIdx, startIdx + limit);

    const typeCounts: Record<string, number> = {};
    for (const item of items) {
      typeCounts[item.type] = (typeCounts[item.type] || 0) + 1;
    }

    return {
      items: paginated,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      typeCounts,
    };
  }

  async assignTelecaller(
    user: UserContext,
    donorId: string,
    assignedToUserId: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const donor = await this.prisma.donor.findFirst({
      where: { id: donorId, isDeleted: false },
    });

    if (!donor) {
      throw new NotFoundException("Donor not found");
    }

    const oldAssignee = donor.assignedToUserId;

    const updated = await this.prisma.donor.update({
      where: { id: donorId },
      data: { assignedToUserId },
    });

    if (oldAssignee !== assignedToUserId) {
      await this.auditService.logDonorAssignmentChange(
        user.id,
        donorId,
        oldAssignee,
        assignedToUserId,
        ipAddress,
        userAgent,
      );
    }

    return updated;
  }
}
