import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { Role, DonorCategory } from "@prisma/client";
import { maskDonorData } from "../common/utils/masking.util";
import { DonorsEngagementService } from "./donors.engagement.service";
import {
  UserContext,
  DonorQueryOptions,
  HealthStatus,
  EngagementResult,
} from "./donors.types";
import { StorageService } from "../storage/storage.service";
import * as XLSX from "xlsx";
import * as ExcelJS from "exceljs";

@Injectable()
export class DonorsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
    private storageService: StorageService,
    private engagementService: DonorsEngagementService
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

```ts
async findAll(user: UserContext, options: DonorQueryOptions = {}) {
  const {
    page = 1,
    limit = 20,
    search,
    sortBy = "createdAt",
    sortOrder = "desc",
    category,
    city,
    country,
    religion,
    assignedToUserId,
    donationFrequency,
    healthStatus,
    supportPreferences,
  } = options;

  const accessFilter = this.getAccessFilter(user);

  const where: any = {
    isDeleted: false,
    ...accessFilter,
  };

  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: "insensitive" } },
      { lastName: { contains: search, mode: "insensitive" } },
      { donorCode: { contains: search, mode: "insensitive" } },
      { primaryPhone: { contains: search, mode: "insensitive" } },
      { personalEmail: { contains: search, mode: "insensitive" } },
      { city: { contains: search, mode: "insensitive" } },
    ];
  }

  if (category) where.category = category;
  if (city) where.city = { contains: city, mode: "insensitive" };
  if (country) where.country = { contains: country, mode: "insensitive" };
  if (religion) where.religion = { contains: religion, mode: "insensitive" };
  if (assignedToUserId) where.assignedToUserId = assignedToUserId;
  if (donationFrequency) where.donationFrequency = donationFrequency;

  if (supportPreferences) {
    const prefs = supportPreferences
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);

    if (prefs.length > 0) {
      where.supportPreferences = { hasSome: prefs };
    }
  }

  if (healthStatus && !["GREEN", "YELLOW", "RED"].includes(healthStatus)) {
    // ignore invalid filter
  } else if (healthStatus) {
    where.healthStatus = healthStatus;
  }

  const [donors, total] = await Promise.all([
    this.prisma.donor.findMany({
      where,
      include: {
        assignedToUser: {
          select: { id: true, name: true, email: true },
        },
        createdBy: {
          select: { id: true, name: true },
        },
        _count: {
          select: { donations: true, pledges: true },
        },
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    }),
    this.prisma.donor.count({ where }),
  ]);

  const donorIds = donors.map((d) => d.id);

  const engagementMap =
    await this.engagementService.computeEngagementScores(donorIds);

  const donorsWithHealth = donors.map((donor) => ({
    ...donor,
    healthScore: engagementMap[donor.id]?.score ?? 100,
    healthStatus: engagementMap[donor.id]?.status ?? donor.healthStatus,
    healthReasons: engagementMap[donor.id]?.reasons ?? [],
  }));

  const maskedDonors = this.shouldMaskData(user)
    ? donorsWithHealth.map((donor) => maskDonorData(donor))
    : donorsWithHealth;

  return {
    items: maskedDonors,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}
```

  async findOne(user: UserContext, id: string) {
    const accessFilter = this.getAccessFilter(user);

    const donor = await this.prisma.donor.findFirst({
      where: {
        id,
        isDeleted: false,
        ...accessFilter,
      },
      include: {
        assignedToUser: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true } },
        specialOccasions: true,
        familyMembers: true,
        donations: {
          where: { isDeleted: false },
          orderBy: { donationDate: "desc" },
          take: 5,
        },
        pledges: {
          where: { isDeleted: false },
          orderBy: { createdAt: "desc" },
          take: 5,
        },
        sponsorships: true,
      },
    });

    if (!donor) {
      if (user.role === Role.TELECALLER) {
        throw new ForbiddenException("You do not have access to this donor");
      }
      throw new NotFoundException("Donor not found");
    }

    return this.shouldMaskData(user) ? maskDonorData(donor) : donor;
  }

  async lookupByPhone(phone: string): Promise<{ found: boolean; donor?: any }> {
    const cleaned = phone.replace(/[\s\-\(\)\+\.]/g, "");
    const normalizedPhone = cleaned.length >= 10 ? cleaned.slice(-10) : cleaned;

    if (normalizedPhone.length < 10) {
      return { found: false };
    }

    const donor = await this.prisma.donor.findFirst({
      where: {
        isDeleted: false,
        OR: [
          { primaryPhone: { endsWith: normalizedPhone } },
          { whatsappPhone: { endsWith: normalizedPhone } },
        ],
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        donorCode: true,
        primaryPhone: true,
        personalEmail: true,
      },
    });

    if (!donor) {
      return { found: false };
    }

    return {
      found: true,
      donor: {
        id: donor.id,
        firstName: donor.firstName,
        lastName: donor.lastName,
        donorCode: donor.donorCode,
        primaryPhone: donor.primaryPhone,
        personalEmail: donor.personalEmail,
      },
    };
  }
  async create(
    user: UserContext,
    data: any,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const donor = await this.createDonorWithRetry(data, user.id);

    await this.auditService.logDonorCreate(
      user.id,
      donor.id,
      {
        donorCode: donor.donorCode,
        firstName: data.firstName,
        lastName: data.lastName,
      },
      ipAddress,
      userAgent,
    );

    return donor;
  }

  async update(
    user: UserContext,
    id: string,
    data: any,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const existing = await this.prisma.donor.findFirst({
      where: { id, isDeleted: false },
    });

    if (!existing) {
      throw new NotFoundException("Donor not found");
    }

    if (
      user.role === Role.TELECALLER &&
      existing.assignedToUserId !== user.id
    ) {
      throw new ForbiddenException(
        "You do not have permission to update this donor",
      );
    }

    const oldAssignee = existing.assignedToUserId;
    const newAssignee = data.assignedToUserId;

    const updated = await this.prisma.donor.update({
      where: { id },
      data,
    });

    await this.auditService.logDonorUpdate(
      user.id,
      id,
      { firstName: existing.firstName, lastName: existing.lastName },
      { firstName: updated.firstName, lastName: updated.lastName, ...data },
      ipAddress,
      userAgent,
    );

    if (oldAssignee !== newAssignee && newAssignee !== undefined) {
      await this.auditService.logDonorAssignmentChange(
        user.id,
        id,
        oldAssignee,
        newAssignee,
        ipAddress,
        userAgent,
      );
    }

    return updated;
  }

  async softDelete(
    user: UserContext,
    id: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    if (user.role !== Role.ADMIN) {
      throw new ForbiddenException("Only administrators can delete donors");
    }

    const existing = await this.prisma.donor.findFirst({
      where: { id, isDeleted: false },
    });

    if (!existing) {
      throw new NotFoundException("Donor not found");
    }

    const deleted = await this.prisma.donor.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });

    await this.auditService.logDonorDelete(
      user.id,
      id,
      { donorCode: existing.donorCode, firstName: existing.firstName },
      ipAddress,
      userAgent,
    );

    return deleted;
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

    const { path, url } = await this.storageService.uploadDonorPhoto(
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

  async parseImportFile(file: Express.Multer.File) {
    try {
      const workbook = XLSX.read(file.buffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

      if (data.length < 2) {
        throw new BadRequestException(
          "File must have at least a header row and one data row",
        );
      }

      const headers = data[0].map((h: any) => String(h || "").trim());
      const rows = data
        .slice(1)
        .filter((row) =>
          row.some(
            (cell) => cell !== undefined && cell !== null && cell !== "",
          ),
        );

      const suggestedMapping = this.suggestColumnMapping(headers);

      return {
        headers,
        rows: rows.slice(0, 100),
        totalRows: rows.length,
        suggestedMapping,
        availableFields: this.getImportableFields(),
      };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException(
        "Failed to parse file. Please ensure it is a valid Excel or CSV file.",
      );
    }
  }

  private getImportableFields() {
    return [
      { key: "firstName", label: "First Name", required: false },
      { key: "middleName", label: "Middle Name", required: false },
      { key: "lastName", label: "Last Name", required: false },
      { key: "primaryPhone", label: "Primary Phone", required: false },
      { key: "whatsappPhone", label: "WhatsApp Phone", required: false },
      { key: "personalEmail", label: "Personal Email", required: false },
      { key: "officialEmail", label: "Official Email", required: false },
      { key: "address", label: "Address", required: false },
      { key: "city", label: "City", required: false },
      { key: "state", label: "State", required: false },
      { key: "country", label: "Country", required: false },
      { key: "pincode", label: "Pincode", required: false },
      { key: "profession", label: "Profession", required: false },
      { key: "approximateAge", label: "Age", required: false },
      { key: "gender", label: "Gender", required: false },
      { key: "religion", label: "Religion", required: false },
      { key: "category", label: "Category", required: false },
      { key: "pan", label: "PAN", required: false },
      { key: "notes", label: "Notes", required: false },
    ];
  }

  private suggestColumnMapping(headers: string[]): Record<string, string> {
    const mapping: Record<string, string> = {};
    const fieldMap: Record<string, string[]> = {
      firstName: [
        "first name",
        "firstname",
        "first_name",
        "name",
        "donor name",
      ],
      middleName: ["middle name", "middlename", "middle_name"],
      lastName: [
        "last name",
        "lastname",
        "last_name",
        "surname",
        "family name",
      ],
      primaryPhone: [
        "phone",
        "mobile",
        "primary phone",
        "phone number",
        "contact",
        "cell",
        "telephone",
      ],
      whatsappPhone: ["whatsapp", "whatsapp phone", "whatsapp number"],
      personalEmail: ["email", "personal email", "email address", "mail"],
      officialEmail: ["official email", "work email", "office email"],
      address: ["address", "street", "street address"],
      city: ["city", "town"],
      state: ["state", "province", "region"],
      country: ["country", "nation"],
      pincode: ["pincode", "zip", "zip code", "postal code", "pin"],
      profession: ["profession", "occupation", "job", "work"],
      approximateAge: ["age", "approximate age"],
      gender: ["gender", "sex"],
      religion: ["religion", "faith"],
      category: ["category", "type", "donor category", "donor type"],
      pan: ["pan", "pan number", "pan card"],
      notes: ["notes", "remarks", "comments"],
    };

    headers.forEach((header, index) => {
      const normalizedHeader = header.toLowerCase().trim();
      for (const [field, aliases] of Object.entries(fieldMap)) {
        if (aliases.includes(normalizedHeader)) {
          mapping[index.toString()] = field;
          break;
        }
      }
    });

    return mapping;
  }

  private normalizePhone(phone: string | undefined): string | null {
    if (!phone) return null;
    const cleaned = String(phone).replace(/[\s\-\(\)\+\.]/g, "");
    if (cleaned.length >= 10) {
      return cleaned.slice(-10);
    }
    return cleaned || null;
  }

  private normalizeEmail(email: string | undefined): string | null {
    if (!email) return null;
    const trimmed = String(email).trim().toLowerCase();
    if (trimmed.includes("@") && trimmed.includes(".")) {
      return trimmed;
    }
    return null;
  }

  async detectDuplicatesInBatch(
    rows: any[],
    columnMapping: Record<string, string>,
  ) {
    // Batch process to avoid overwhelming the database
    const BATCH_SIZE = 50;
    const allResults: Array<{
      rowIndex: number;
      duplicate: boolean;
      existingDonor?: {
        id: string;
        donorCode: string;
        firstName: string;
        lastName?: string | null;
        primaryPhone?: string | null;
        personalEmail?: string | null;
      };
      matchedOn?: string[];
    }> = [];

    for (let batchStart = 0; batchStart < rows.length; batchStart += BATCH_SIZE) {
      const batchRows = rows.slice(batchStart, batchStart + BATCH_SIZE);
      const batchResults = await this.detectDuplicatesBatch(batchRows, columnMapping, batchStart);
      allResults.push(...batchResults);
    }

    return { results: allResults };
  }

  private async detectDuplicatesBatch(
    rows: any[],
    columnMapping: Record<string, string>,
    startIndex: number,
  ) {
    // Collect all phones and emails first
    const phonesToCheck = new Set<string>();
    const emailsToCheck = new Set<string>();
    const rowData: Array<{ phone: string | null; email: string | null; mappedData: any }> = [];

    for (const row of rows) {
      const mappedData = this.mapRowToFields(row, columnMapping);
      const phone = this.normalizePhone(mappedData.primaryPhone);
      const email =
        this.normalizeEmail(mappedData.personalEmail) ||
        this.normalizeEmail(mappedData.officialEmail);

      rowData.push({ phone, email, mappedData });
      
      if (phone) phonesToCheck.add(phone);
      if (email) emailsToCheck.add(email);
    }

    // Single query to fetch all potential duplicates
    const conditions: any[] = [];
    if (phonesToCheck.size > 0) {
      conditions.push({ primaryPhone: { in: Array.from(phonesToCheck) } });
      conditions.push({ whatsappPhone: { in: Array.from(phonesToCheck) } });
    }
    if (emailsToCheck.size > 0) {
      conditions.push({ personalEmail: { in: Array.from(emailsToCheck), mode: "insensitive" } });
      conditions.push({ officialEmail: { in: Array.from(emailsToCheck), mode: "insensitive" } });
    }

    const existingDonors = conditions.length > 0 ? await this.prisma.donor.findMany({
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
        whatsappPhone: true,
        personalEmail: true,
        officialEmail: true,
      },
    }) : [];

    // Build lookup maps
    const phoneMap = new Map<string, typeof existingDonors[0]>();
    const emailMap = new Map<string, typeof existingDonors[0]>();
    
    for (const donor of existingDonors) {
      if (donor.primaryPhone) phoneMap.set(donor.primaryPhone, donor);
      if (donor.whatsappPhone) phoneMap.set(donor.whatsappPhone, donor);
      if (donor.personalEmail) emailMap.set(donor.personalEmail.toLowerCase(), donor);
      if (donor.officialEmail) emailMap.set(donor.officialEmail.toLowerCase(), donor);
    }

    // Match rows against existing donors
    const results: Array<{
      rowIndex: number;
      duplicate: boolean;
      existingDonor?: any;
      matchedOn?: string[];
    }> = [];

    for (let i = 0; i < rowData.length; i++) {
      const { phone, email } = rowData[i];
      const rowIndex = startIndex + i;

      if (!phone && !email) {
        results.push({ rowIndex, duplicate: false });
        continue;
      }

      let existing = null;
      const matchedOn: string[] = [];

      if (phone && phoneMap.has(phone)) {
        existing = phoneMap.get(phone);
        matchedOn.push("phone");
      }
      
      if (email && emailMap.has(email)) {
        const emailMatch = emailMap.get(email);
        if (!existing) {
          existing = emailMatch;
        }
        matchedOn.push("email");
      }

      if (existing) {
        results.push({
          rowIndex,
          duplicate: true,
          existingDonor: {
            id: existing.id,
            donorCode: existing.donorCode,
            firstName: existing.firstName,
            lastName: existing.lastName,
            primaryPhone: existing.primaryPhone,
            personalEmail: existing.personalEmail,
          },
          matchedOn,
        });
      } else {
        results.push({ rowIndex, duplicate: false });
      }
    }

    return results;
  }

  private mapRowToFields(
    row: any[],
    columnMapping: Record<string, string>,
  ): Record<string, any> {
    const data: Record<string, any> = {};
    for (const [colIndex, field] of Object.entries(columnMapping)) {
      const value = row[parseInt(colIndex)];
      if (value !== undefined && value !== null && value !== "") {
        data[field] = value;
      }
    }
    return data;
  }

  private async generateDonorCode(): Promise<string> {
    const lastDonor = await this.prisma.donor.findFirst({
      where: {
        donorCode: { startsWith: 'AKF-DNR-' },
      },
      orderBy: { donorCode: 'desc' },
      select: { donorCode: true },
    });

    let maxNumber = 0;
    if (lastDonor?.donorCode) {
      const match = lastDonor.donorCode.match(/AKF-DNR-(\d+)/);
      if (match) {
        maxNumber = parseInt(match[1], 10);
      }
    }

    return `AKF-DNR-${String(maxNumber + 1).padStart(6, "0")}`;
  }

  private async createDonorWithRetry(
    data: any,
    userId: string,
    maxRetries: number = 3,
  ): Promise<any> {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const donorCode = await this.generateDonorCode();
      try {
        return await this.prisma.donor.create({
          data: {
            ...data,
            donorCode,
            createdById: userId,
          },
          include: {
            assignedToUser: { select: { id: true, name: true, email: true } },
            createdBy: { select: { id: true, name: true } },
          },
        });
      } catch (error: any) {
        if (
          error.code === "P2002" &&
          error.meta?.target?.includes("donorCode")
        ) {
          if (attempt === maxRetries - 1) {
            throw new Error(
              "Failed to generate unique donor code after multiple attempts",
            );
          }
          continue;
        }
        throw error;
      }
    }
  }

  async executeBulkImport(
    user: UserContext,
    rows: any[],
    columnMapping: Record<string, string>,
    actions: Record<number, "skip" | "update" | "create">,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const results = {
      total: rows.length,
      imported: 0,
      updated: 0,
      skipped: 0,
      failed: 0,
      errors: [] as Array<{ rowIndex: number; error: string; rowData: any }>,
    };

    const duplicateInfo = await this.detectDuplicatesInBatch(
      rows,
      columnMapping,
    );

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const action = actions[i] || "skip";
      const duplicateResult = duplicateInfo.results.find(
        (r) => r.rowIndex === i,
      );

      if (action === "skip") {
        results.skipped++;
        continue;
      }

      try {
        const mappedData = this.mapRowToFields(row, columnMapping);

        if (mappedData.primaryPhone) {
          mappedData.primaryPhone = this.normalizePhone(
            mappedData.primaryPhone,
          );
        }
        if (mappedData.whatsappPhone) {
          mappedData.whatsappPhone = this.normalizePhone(
            mappedData.whatsappPhone,
          );
        }
        if (mappedData.personalEmail) {
          mappedData.personalEmail = this.normalizeEmail(
            mappedData.personalEmail,
          );
        }
        if (mappedData.officialEmail) {
          mappedData.officialEmail = this.normalizeEmail(
            mappedData.officialEmail,
          );
        }
        if (mappedData.approximateAge) {
          mappedData.approximateAge =
            parseInt(String(mappedData.approximateAge)) || null;
        }
        if (mappedData.gender) {
          const genderMap: Record<string, string> = {
            m: "MALE",
            male: "MALE",
            f: "FEMALE",
            female: "FEMALE",
            o: "OTHER",
            other: "OTHER",
          };
          mappedData.gender =
            genderMap[String(mappedData.gender).toLowerCase()] || null;
        }
        if (mappedData.category) {
          const categoryUpper = String(mappedData.category)
            .toUpperCase()
            .replace(/\s+/g, "_");
          if (
            Object.values(DonorCategory).includes(
              categoryUpper as DonorCategory,
            )
          ) {
            mappedData.category = categoryUpper;
          } else {
            delete mappedData.category;
          }
        }

        const hasMinimumData =
          mappedData.firstName ||
          mappedData.primaryPhone ||
          mappedData.personalEmail ||
          mappedData.officialEmail;
        if (!hasMinimumData) {
          results.errors.push({
            rowIndex: i,
            error: "Row must have at least a name, phone, or email",
            rowData: row,
          });
          results.failed++;
          continue;
        }

        if (action === "update" && duplicateResult?.existingDonor) {
          await this.prisma.donor.update({
            where: { id: duplicateResult.existingDonor.id },
            data: mappedData,
          });
          results.updated++;
        } else if (action === "create") {
          await this.createDonorWithRetry(
            {
              ...mappedData,
              firstName: mappedData.firstName || "Unknown",
            },
            user.id,
          );
          results.imported++;
        }
      } catch (error: any) {
        results.errors.push({
          rowIndex: i,
          error: error.message || "Unknown error",
          rowData: row,
        });
        results.failed++;
      }
    }

    await this.auditService.logDataExport(
      user.id,
      "Bulk Import",
      {
        totalRows: results.total,
        imported: results.imported,
        updated: results.updated,
        skipped: results.skipped,
        failed: results.failed,
      },
      results.imported + results.updated,
      ipAddress,
      userAgent,
    );

    return results;
  }

 async generateBulkTemplate(): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'NGO DMS';

  const donors = workbook.addWorksheet('Donors');
  const instructions = workbook.addWorksheet('Instructions'); // ADD THIS LINE

  const templateColumns = [
    { header: 'First Name *', key: 'firstName', width: 18 },
    { header: 'Middle Name', key: 'middleName', width: 14 },
    { header: 'Last Name', key: 'lastName', width: 16 },
    { header: 'Primary Phone', key: 'primaryPhone', width: 18 },
    { header: 'WhatsApp Phone', key: 'whatsappPhone', width: 18 },
    { header: 'Personal Email', key: 'personalEmail', width: 26 },
    { header: 'Official Email', key: 'officialEmail', width: 26 },
    { header: 'Gender', key: 'gender', width: 10 },
    { header: 'Approximate Age', key: 'approximateAge', width: 14 },
    { header: 'Category', key: 'category', width: 20 },
    { header: 'Address', key: 'address', width: 30 },
    { header: 'City', key: 'city', width: 14 },
    { header: 'State', key: 'state', width: 14 },
    { header: 'Country', key: 'country', width: 12 },
    { header: 'Pincode', key: 'pincode', width: 10 },
    { header: 'Profession', key: 'profession', width: 16 },
    { header: 'Religion', key: 'religion', width: 12 },
    { header: 'PAN', key: 'pan', width: 14 },
    { header: 'Source', key: 'sourceOfDonor', width: 16 },
    { header: 'Donation Frequency', key: 'donationFrequency', width: 18 },
    { header: 'Notes', key: 'notes', width: 30 },
  ];
    donors.columns = templateColumns;

    const headerRow = donors.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2E7D32' } };
    headerRow.alignment = { horizontal: 'center' };

    donors.addRow({
      firstName: 'Rajesh',
      middleName: '',
      lastName: 'Kumar',
      primaryPhone: '+919876543210',
      whatsappPhone: '+919876543210',
      personalEmail: 'rajesh.kumar@email.com',
      officialEmail: '',
      gender: 'MALE',
      approximateAge: 45,
      category: 'INDIVIDUAL',
      address: '42, MG Road',
      city: 'Hyderabad',
      state: 'Telangana',
      country: 'India',
      pincode: '500001',
      profession: 'Engineer',
      religion: 'Hindu',
      pan: 'ABCPK1234F',
      sourceOfDonor: 'REFERRAL',
      donationFrequency: 'MONTHLY',
      notes: 'Regular donor since 2023',
    });
    donors.addRow({
      firstName: 'Priya',
      lastName: 'Sharma',
      primaryPhone: '9123456789',
      personalEmail: 'priya@example.com',
      gender: 'FEMALE',
      approximateAge: 32,
      category: 'INDIVIDUAL',
      city: 'Bangalore',
      state: 'Karnataka',
      country: 'India',
      pincode: '560001',
      profession: 'Doctor',
      sourceOfDonor: 'SOCIAL_MEDIA',
      donationFrequency: 'OCCASIONAL',
    });

    const instructions = workbook.addWorksheet('Instructions');
    instructions.columns = [
      { header: 'Column', key: 'column', width: 22 },
      { header: 'Required?', key: 'required', width: 12 },
      { header: 'Description', key: 'description', width: 50 },
      { header: 'Example', key: 'example', width: 25 },
      { header: 'Valid Values', key: 'validValues', width: 50 },
    ];

    const instHeaderRow = instructions.getRow(1);
    instHeaderRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    instHeaderRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1565C0' } };

    const fieldInstructions = [
      { column: 'First Name *', required: 'YES', description: 'Donor first name', example: 'Rajesh', validValues: 'Any text' },
      { column: 'Middle Name', required: 'No', description: 'Donor middle name', example: '', validValues: 'Any text' },
      { column: 'Last Name', required: 'No', description: 'Donor last name / surname', example: 'Kumar', validValues: 'Any text' },
      { column: 'Primary Phone', required: 'Recommended', description: 'Phone in E.164 or 10-digit format. Used for duplicate detection.', example: '+919876543210 or 9876543210', validValues: 'E.164 format or 10-digit Indian number' },
      { column: 'WhatsApp Phone', required: 'No', description: 'WhatsApp number. If blank, primary phone is used.', example: '+919876543210', validValues: 'E.164 format or 10-digit' },
      { column: 'Personal Email', required: 'Recommended', description: 'Personal email. Used for duplicate detection + receipts.', example: 'rajesh@email.com', validValues: 'Valid email address' },
      { column: 'Official Email', required: 'No', description: 'Work / official email address', example: 'rajesh@company.com', validValues: 'Valid email address' },
      { column: 'Gender', required: 'No', description: 'Donor gender', example: 'MALE', validValues: 'MALE, FEMALE, OTHER, PREFER_NOT_TO_SAY' },
      { column: 'Approximate Age', required: 'No', description: 'Donor age (number)', example: '45', validValues: 'Integer number' },
      { column: 'Category', required: 'No', description: 'Donor category. Defaults to INDIVIDUAL.', example: 'INDIVIDUAL', validValues: 'INDIVIDUAL, NGO, CSR_REP, WHATSAPP_GROUP, SOCIAL_MEDIA_PERSON, CROWD_PULLER, VISITOR_ENQUIRY' },
      { column: 'Address', required: 'No', description: 'Street address', example: '42, MG Road', validValues: 'Any text' },
      { column: 'City', required: 'No', description: 'City name', example: 'Hyderabad', validValues: 'Any text' },
      { column: 'State', required: 'No', description: 'State / Province', example: 'Telangana', validValues: 'Any text' },
      { column: 'Country', required: 'No', description: 'Country. Defaults to India.', example: 'India', validValues: 'Any text' },
      { column: 'Pincode', required: 'No', description: 'ZIP / Postal code', example: '500001', validValues: 'Any text/number' },
      { column: 'Profession', required: 'No', description: 'Donor occupation', example: 'Engineer', validValues: 'Any text' },
      { column: 'Religion', required: 'No', description: 'Donor religion', example: 'Hindu', validValues: 'Any text' },
      { column: 'PAN', required: 'No', description: 'PAN card number for 80G receipts', example: 'ABCPK1234F', validValues: '10-character alphanumeric' },
      { column: 'Source', required: 'No', description: 'How the donor was referred', example: 'REFERRAL', validValues: 'SOCIAL_MEDIA, JUSTDIAL, FRIEND, SPONSOR, WEBSITE, WALK_IN, REFERRAL, OTHER' },
      { column: 'Donation Frequency', required: 'No', description: 'Typical donation pattern', example: 'MONTHLY', validValues: 'ONE_TIME, WEEKLY, MONTHLY, QUARTERLY, HALF_YEARLY, YEARLY, OCCASIONAL' },
      { column: 'Notes', required: 'No', description: 'Any additional notes', example: 'Regular donor since 2023', validValues: 'Any text' },
    ];

    fieldInstructions.forEach(row => instructions.addRow(row));

    instructions.addRow({});
    instructions.addRow({ column: 'IMPORTANT NOTES', description: '' });
    instructions.addRow({ column: '1.', description: 'At least one of: First Name, Phone, or Email is required per row.' });
    instructions.addRow({ column: '2.', description: 'Duplicates are detected by phone (normalized to 10 digits) or email (case-insensitive).' });
    instructions.addRow({ column: '3.', description: 'Default mode is UPSERT: existing donors matched by phone/email will be updated, new ones created.' });
    instructions.addRow({ column: '4.', description: 'Phone numbers can be 10-digit (9876543210) or E.164 (+919876543210). Country code +91 is assumed if omitted.' });
    instructions.addRow({ column: '5.', description: 'Empty rows are automatically skipped.' });
    instructions.addRow({ column: '6.', description: 'Delete the 2 sample rows in the Donors sheet before uploading your actual data.' });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

    async bulkUpload(
    file: Express.Multer.File,
    user: UserContext,
    mode: 'upsert' | 'insert_only' = 'upsert',
    ipAddress?: string,
    userAgent?: string,
  ) {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(
      Buffer.isBuffer(file.buffer)
        ? file.buffer
        : Buffer.from(file.buffer as any) as any
    );
    let sheet = workbook.getWorksheet('Donors') || workbook.worksheets[0];
    if (!sheet) {
      throw new BadRequestException('No worksheet found in the uploaded file.');
    }

    const headerRow = sheet.getRow(1);
    const headers: string[] = [];
    headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      headers[colNumber - 1] = String(cell.value || '').trim().toLowerCase();
    });

    const fieldMapping: Record<string, string> = {
      'first name': 'firstName', 'first name *': 'firstName', 'firstname': 'firstName', 'name': 'firstName', 'donor name': 'firstName',
      'middle name': 'middleName', 'middlename': 'middleName',
      'last name': 'lastName', 'lastname': 'lastName', 'surname': 'lastName',
      'primary phone': 'primaryPhone', 'phone': 'primaryPhone', 'mobile': 'primaryPhone', 'phone number': 'primaryPhone', 'contact': 'primaryPhone',
      'whatsapp phone': 'whatsappPhone', 'whatsapp': 'whatsappPhone', 'whatsapp number': 'whatsappPhone',
      'personal email': 'personalEmail', 'email': 'personalEmail', 'email address': 'personalEmail',
      'official email': 'officialEmail', 'work email': 'officialEmail',
      'gender': 'gender', 'sex': 'gender',
      'approximate age': 'approximateAge', 'age': 'approximateAge',
      'category': 'category', 'donor category': 'category', 'type': 'category',
      'address': 'address', 'street': 'address',
      'city': 'city', 'town': 'city',
      'state': 'state', 'province': 'state',
      'country': 'country',
      'pincode': 'pincode', 'zip': 'pincode', 'zip code': 'pincode', 'postal code': 'pincode', 'pin': 'pincode',
      'profession': 'profession', 'occupation': 'profession',
      'religion': 'religion',
      'pan': 'pan', 'pan number': 'pan',
      'source': 'sourceOfDonor', 'source of donor': 'sourceOfDonor',
      'donation frequency': 'donationFrequency', 'frequency': 'donationFrequency',
      'notes': 'notes', 'remarks': 'notes',
    };

    const colFieldMap: Record<number, string> = {};
    headers.forEach((h, idx) => {
      const field = fieldMapping[h];
      if (field) colFieldMap[idx] = field;
    });

    if (Object.keys(colFieldMap).length === 0) {
      throw new BadRequestException('No recognizable column headers found. Please use the template.');
    }

    const genderMap: Record<string, string> = {
      m: 'MALE', male: 'MALE', f: 'FEMALE', female: 'FEMALE',
      o: 'OTHER', other: 'OTHER', 'prefer not to say': 'PREFER_NOT_TO_SAY',
    };
    const validCategories = new Set(['INDIVIDUAL', 'NGO', 'CSR_REP', 'WHATSAPP_GROUP', 'SOCIAL_MEDIA_PERSON', 'CROWD_PULLER', 'VISITOR_ENQUIRY']);
    const validSources = new Set(['SOCIAL_MEDIA', 'JUSTDIAL', 'FRIEND', 'SPONSOR', 'WEBSITE', 'WALK_IN', 'REFERRAL', 'OTHER']);
    const validFrequencies = new Set(['ONE_TIME', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'HALF_YEARLY', 'YEARLY', 'OCCASIONAL']);

    const results = {
      totalRows: 0,
      importedCount: 0,
      updatedCount: 0,
      skippedCount: 0,
      failedCount: 0,
      errors: [] as Array<{ rowNumber: number; reason: string; rowData: Record<string, any> }>,
    };

    const dataRows: Array<{ rowNumber: number; data: Record<string, any> }> = [];

    sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber === 1) return;
      const rowData: Record<string, any> = {};
      let hasAnyValue = false;

      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        const field = colFieldMap[colNumber - 1];
        if (field) {
          const val = cell.value;
          if (val !== undefined && val !== null && val !== '') {
            rowData[field] = String(val).trim();
            hasAnyValue = true;
          }
        }
      });

      if (hasAnyValue) {
        dataRows.push({ rowNumber, data: rowData });
      }
    });

    results.totalRows = dataRows.length;

    for (const { rowNumber, data } of dataRows) {
      try {
        if (data.primaryPhone) {
          data.primaryPhone = this.normalizePhone(data.primaryPhone);
        }
        if (data.whatsappPhone) {
          data.whatsappPhone = this.normalizePhone(data.whatsappPhone);
        }
        if (data.personalEmail) {
          data.personalEmail = this.normalizeEmail(data.personalEmail);
        }
        if (data.officialEmail) {
          data.officialEmail = this.normalizeEmail(data.officialEmail);
        }
        if (data.approximateAge) {
          const age = parseInt(String(data.approximateAge));
          data.approximateAge = isNaN(age) ? null : age;
          if (data.approximateAge === null) delete data.approximateAge;
        }
        if (data.gender) {
          data.gender = genderMap[String(data.gender).toLowerCase()] || null;
          if (!data.gender) delete data.gender;
        }
        if (data.category) {
          const cat = String(data.category).toUpperCase().replace(/\s+/g, '_');
          data.category = validCategories.has(cat) ? cat : undefined;
          if (!data.category) delete data.category;
        }
        if (data.sourceOfDonor) {
          const src = String(data.sourceOfDonor).toUpperCase().replace(/\s+/g, '_');
          data.sourceOfDonor = validSources.has(src) ? src : undefined;
          if (!data.sourceOfDonor) delete data.sourceOfDonor;
        }
        if (data.donationFrequency) {
          const freq = String(data.donationFrequency).toUpperCase().replace(/\s+/g, '_');
          data.donationFrequency = validFrequencies.has(freq) ? freq : undefined;
          if (!data.donationFrequency) delete data.donationFrequency;
        }

        const hasMinimum = data.firstName || data.primaryPhone || data.personalEmail || data.officialEmail;
        if (!hasMinimum) {
          results.errors.push({ rowNumber, reason: 'Missing required data: need at least First Name, Phone, or Email', rowData: data });
          results.failedCount++;
          continue;
        }

        if (data.personalEmail && !data.personalEmail.includes('@')) {
          results.errors.push({ rowNumber, reason: `Invalid email format: ${data.personalEmail}`, rowData: data });
          results.failedCount++;
          continue;
        }

        const phone = data.primaryPhone;
        const email = data.personalEmail || data.officialEmail;
        let existingDonor: any = null;

        if (mode === 'upsert' && (phone || email)) {
          const conditions: any[] = [];
          if (phone) {
            conditions.push({ primaryPhone: phone });
            conditions.push({ whatsappPhone: phone });
          }
          if (email) {
            conditions.push({ personalEmail: { equals: email, mode: 'insensitive' } });
            conditions.push({ officialEmail: { equals: email, mode: 'insensitive' } });
          }

          existingDonor = await this.prisma.donor.findFirst({
            where: { isDeleted: false, OR: conditions },
            select: { id: true },
          });
        }

        if (existingDonor) {
          await this.prisma.donor.update({
            where: { id: existingDonor.id },
            data,
          });
          results.updatedCount++;
        } else {
          await this.createDonorWithRetry(
            { ...data, firstName: data.firstName || 'Unknown' },
            user.id,
          );
          results.importedCount++;
        }
      } catch (error: any) {
        results.errors.push({
          rowNumber,
          reason: error.message || 'Unknown error',
          rowData: data,
        });
        results.failedCount++;
      }
    }

    results.skippedCount = results.totalRows - results.importedCount - results.updatedCount - results.failedCount;

    await this.auditService.logDataExport(
      user.id,
      'Bulk Upload',
      {
        totalRows: results.totalRows,
        imported: results.importedCount,
        updated: results.updatedCount,
        skipped: results.skippedCount,
        failed: results.failedCount,
        mode,
      },
      results.importedCount + results.updatedCount,
      ipAddress,
      userAgent,
    );

    return results;
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
    headerRow.font = { bold: true, size: 10 };
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
        } else if (
          !isBirthdayWish &&
          activeTypes.includes("COMMUNICATION")
        ) {
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
  
async assignDonor(id: string, assignedToUserId: string | null) {
  const donor = await this.prisma.donor.findFirst({
    where: { id, isDeleted: false },
  });

  if (!donor) {
    throw new NotFoundException("Donor not found");
  }

  return this.prisma.donor.update({
    where: { id },
    data: { assignedToUserId },
  });
}

async bulkReassignDonors(fromUserId: string, toUserId: string) {
  const result = await this.prisma.donor.updateMany({
    where: {
      assignedToUserId: fromUserId,
      isDeleted: false,
    },
    data: {
      assignedToUserId: toUserId,
    },
  });

  return { count: result.count };
}

async countDonorsByAssignee(userId: string) {
  return this.prisma.donor.count({
    where: {
      assignedToUserId: userId,
      isDeleted: false,
    },
  });
}
}

