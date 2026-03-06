import { Injectable, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { DonorCategory } from "@prisma/client";
import { UserContext } from "./donors.types";
import * as XLSX from "xlsx";
import * as ExcelJS from "exceljs";

@Injectable()
export class DonorsImportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

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

    for (
      let batchStart = 0;
      batchStart < rows.length;
      batchStart += BATCH_SIZE
    ) {
      const batchRows = rows.slice(batchStart, batchStart + BATCH_SIZE);
      const batchResults = await this.detectDuplicatesBatch(
        batchRows,
        columnMapping,
        batchStart,
      );
      allResults.push(...batchResults);
    }

    return { results: allResults };
  }

  private async detectDuplicatesBatch(
    rows: any[],
    columnMapping: Record<string, string>,
    startIndex: number,
  ) {
    const phonesToCheck = new Set<string>();
    const emailsToCheck = new Set<string>();
    const rowData: Array<{
      phone: string | null;
      email: string | null;
      mappedData: any;
    }> = [];

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

    const conditions: any[] = [];
    if (phonesToCheck.size > 0) {
      conditions.push({ primaryPhone: { in: Array.from(phonesToCheck) } });
      conditions.push({ whatsappPhone: { in: Array.from(phonesToCheck) } });
    }
    if (emailsToCheck.size > 0) {
      conditions.push({
        personalEmail: {
          in: Array.from(emailsToCheck),
          mode: "insensitive",
        },
      });
      conditions.push({
        officialEmail: {
          in: Array.from(emailsToCheck),
          mode: "insensitive",
        },
      });
    }

    const existingDonors =
      conditions.length > 0
        ? await this.prisma.donor.findMany({
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
          })
        : [];

    const phoneMap = new Map<string, (typeof existingDonors)[number]>();
    const emailMap = new Map<string, (typeof existingDonors)[number]>();

    for (const donor of existingDonors) {
      if (donor.primaryPhone) phoneMap.set(donor.primaryPhone, donor);
      if (donor.whatsappPhone) phoneMap.set(donor.whatsappPhone, donor);
      if (donor.personalEmail)
        emailMap.set(donor.personalEmail.toLowerCase(), donor);
      if (donor.officialEmail)
        emailMap.set(donor.officialEmail.toLowerCase(), donor);
    }

    const results: Array<{
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

      if (email && emailMap.has(email.toLowerCase())) {
        const emailMatch = emailMap.get(email.toLowerCase());
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
        donorCode: { startsWith: "AKF-DNR-" },
      },
      orderBy: { donorCode: "desc" },
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

    throw new Error("Failed to create donor");
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
    workbook.creator = "NGO DMS";

    const donors = workbook.addWorksheet("Donors");
    const instructions = workbook.addWorksheet("Instructions");

    const templateColumns = [
      { header: "First Name *", key: "firstName", width: 18 },
      { header: "Middle Name", key: "middleName", width: 14 },
      { header: "Last Name", key: "lastName", width: 16 },
      { header: "Primary Phone", key: "primaryPhone", width: 18 },
      { header: "WhatsApp Phone", key: "whatsappPhone", width: 18 },
      { header: "Personal Email", key: "personalEmail", width: 26 },
      { header: "Official Email", key: "officialEmail", width: 26 },
      { header: "Gender", key: "gender", width: 10 },
      { header: "Approximate Age", key: "approximateAge", width: 14 },
      { header: "Category", key: "category", width: 20 },
      { header: "Address", key: "address", width: 30 },
      { header: "City", key: "city", width: 14 },
      { header: "State", key: "state", width: 14 },
      { header: "Country", key: "country", width: 12 },
      { header: "Pincode", key: "pincode", width: 10 },
      { header: "Profession", key: "profession", width: 16 },
      { header: "Religion", key: "religion", width: 12 },
      { header: "PAN", key: "pan", width: 14 },
      { header: "Source", key: "sourceOfDonor", width: 16 },
      { header: "Donation Frequency", key: "donationFrequency", width: 18 },
      { header: "Notes", key: "notes", width: 30 },
    ];

    donors.columns = templateColumns;

    const headerRow = donors.getRow(1);
    headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF2E7D32" },
    };
    headerRow.alignment = { horizontal: "center" };

    donors.addRow({
      firstName: "Rajesh",
      middleName: "",
      lastName: "Kumar",
      primaryPhone: "+919876543210",
      whatsappPhone: "+919876543210",
      personalEmail: "rajesh.kumar@email.com",
      officialEmail: "",
      gender: "MALE",
      approximateAge: 45,
      category: "INDIVIDUAL",
      address: "42, MG Road",
      city: "Hyderabad",
      state: "Telangana",
      country: "India",
      pincode: "500001",
      profession: "Engineer",
      religion: "Hindu",
      pan: "ABCPK1234F",
      sourceOfDonor: "REFERRAL",
      donationFrequency: "MONTHLY",
      notes: "Regular donor since 2023",
    });

    donors.addRow({
      firstName: "Priya",
      lastName: "Sharma",
      primaryPhone: "9123456789",
      personalEmail: "priya@example.com",
      gender: "FEMALE",
      approximateAge: 32,
      category: "INDIVIDUAL",
      city: "Bangalore",
      state: "Karnataka",
      country: "India",
      pincode: "560001",
      profession: "Doctor",
      sourceOfDonor: "SOCIAL_MEDIA",
      donationFrequency: "OCCASIONAL",
    });

    instructions.columns = [
      { header: "Column", key: "column", width: 22 },
      { header: "Required?", key: "required", width: 12 },
      { header: "Description", key: "description", width: 50 },
      { header: "Example", key: "example", width: 25 },
      { header: "Valid Values", key: "validValues", width: 50 },
    ];

    const instHeaderRow = instructions.getRow(1);
    instHeaderRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
    instHeaderRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF1565C0" },
    };

    const fieldInstructions = [
      {
        column: "First Name *",
        required: "YES",
        description: "Donor first name",
        example: "Rajesh",
        validValues: "Any text",
      },
      {
        column: "Middle Name",
        required: "No",
        description: "Donor middle name",
        example: "",
        validValues: "Any text",
      },
      {
        column: "Last Name",
        required: "No",
        description: "Donor last name / surname",
        example: "Kumar",
        validValues: "Any text",
      },
      {
        column: "Primary Phone",
        required: "Recommended",
        description:
          "Phone in E.164 or 10-digit format. Used for duplicate detection.",
        example: "+919876543210 or 9876543210",
        validValues: "E.164 format or 10-digit Indian number",
      },
      {
        column: "WhatsApp Phone",
        required: "No",
        description: "WhatsApp number. If blank, primary phone is used.",
        example: "+919876543210",
        validValues: "E.164 format or 10-digit",
      },
      {
        column: "Personal Email",
        required: "Recommended",
        description:
          "Personal email. Used for duplicate detection + receipts.",
        example: "rajesh@email.com",
        validValues: "Valid email address",
      },
      {
        column: "Official Email",
        required: "No",
        description: "Work / official email address",
        example: "rajesh@company.com",
        validValues: "Valid email address",
      },
      {
        column: "Gender",
        required: "No",
        description: "Donor gender",
        example: "MALE",
        validValues: "MALE, FEMALE, OTHER, PREFER_NOT_TO_SAY",
      },
      {
        column: "Approximate Age",
        required: "No",
        description: "Donor age (number)",
        example: "45",
        validValues: "Integer number",
      },
      {
        column: "Category",
        required: "No",
        description: "Donor category. Defaults to INDIVIDUAL.",
        example: "INDIVIDUAL",
        validValues:
          "INDIVIDUAL, NGO, CSR_REP, WHATSAPP_GROUP, SOCIAL_MEDIA_PERSON, CROWD_PULLER, VISITOR_ENQUIRY",
      },
      {
        column: "Address",
        required: "No",
        description: "Street address",
        example: "42, MG Road",
        validValues: "Any text",
      },
      {
        column: "City",
        required: "No",
        description: "City name",
        example: "Hyderabad",
        validValues: "Any text",
      },
      {
        column: "State",
        required: "No",
        description: "State / Province",
        example: "Telangana",
        validValues: "Any text",
      },
      {
        column: "Country",
        required: "No",
        description: "Country. Defaults to India.",
        example: "India",
        validValues: "Any text",
      },
      {
        column: "Pincode",
        required: "No",
        description: "ZIP / Postal code",
        example: "500001",
        validValues: "Any text/number",
      },
      {
        column: "Profession",
        required: "No",
        description: "Donor occupation",
        example: "Engineer",
        validValues: "Any text",
      },
      {
        column: "Religion",
        required: "No",
        description: "Donor religion",
        example: "Hindu",
        validValues: "Any text",
      },
      {
        column: "PAN",
        required: "No",
        description: "PAN card number for 80G receipts",
        example: "ABCPK1234F",
        validValues: "10-character alphanumeric",
      },
      {
        column: "Source",
        required: "No",
        description: "How the donor was referred",
        example: "REFERRAL",
        validValues:
          "SOCIAL_MEDIA, JUSTDIAL, FRIEND, SPONSOR, WEBSITE, WALK_IN, REFERRAL, OTHER",
      },
      {
        column: "Donation Frequency",
        required: "No",
        description: "Typical donation pattern",
        example: "MONTHLY",
        validValues:
          "ONE_TIME, WEEKLY, MONTHLY, QUARTERLY, HALF_YEARLY, YEARLY, OCCASIONAL",
      },
      {
        column: "Notes",
        required: "No",
        description: "Any additional notes",
        example: "Regular donor since 2023",
        validValues: "Any text",
      },
    ];

    fieldInstructions.forEach((row) => instructions.addRow(row));

    instructions.addRow({});
    instructions.addRow({ column: "IMPORTANT NOTES", description: "" });
    instructions.addRow({
      column: "1.",
      description:
        "At least one of: First Name, Phone, or Email is required per row.",
    });
    instructions.addRow({
      column: "2.",
      description:
        "Duplicates are detected by phone (normalized to 10 digits) or email (case-insensitive).",
    });
    instructions.addRow({
      column: "3.",
      description:
        "Default mode is UPSERT: existing donors matched by phone/email will be updated, new ones created.",
    });
    instructions.addRow({
      column: "4.",
      description:
        "Phone numbers can be 10-digit (9876543210) or E.164 (+919876543210). Country code +91 is assumed if omitted.",
    });
    instructions.addRow({
      column: "5.",
      description: "Empty rows are automatically skipped.",
    });
    instructions.addRow({
      column: "6.",
      description:
        "Delete the 2 sample rows in the Donors sheet before uploading your actual data.",
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  async bulkUpload(
    file: Express.Multer.File,
    user: UserContext,
    mode: "upsert" | "insert_only" = "upsert",
    ipAddress?: string,
    userAgent?: string,
  ) {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(
      Buffer.isBuffer(file.buffer)
        ? file.buffer
        : (Buffer.from(file.buffer as any) as any),
    );

    const sheet = workbook.getWorksheet("Donors") || workbook.worksheets[0];
    if (!sheet) {
      throw new BadRequestException("No worksheet found in the uploaded file.");
    }

    const headerRow = sheet.getRow(1);
    const headers: string[] = [];
    headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      headers[colNumber - 1] = String(cell.value || "")
        .trim()
        .toLowerCase();
    });

    const fieldMapping: Record<string, string> = {
      "first name": "firstName",
      "first name *": "firstName",
      firstname: "firstName",
      name: "firstName",
      "donor name": "firstName",
      "middle name": "middleName",
      middlename: "middleName",
      "last name": "lastName",
      lastname: "lastName",
      surname: "lastName",
      "primary phone": "primaryPhone",
      phone: "primaryPhone",
      mobile: "primaryPhone",
      "phone number": "primaryPhone",
      contact: "primaryPhone",
      "whatsapp phone": "whatsappPhone",
      whatsapp: "whatsappPhone",
      "whatsapp number": "whatsappPhone",
      "personal email": "personalEmail",
      email: "personalEmail",
      "email address": "personalEmail",
      "official email": "officialEmail",
      "work email": "officialEmail",
      gender: "gender",
      sex: "gender",
      "approximate age": "approximateAge",
      age: "approximateAge",
      category: "category",
      "donor category": "category",
      type: "category",
      address: "address",
      street: "address",
      city: "city",
      town: "city",
      state: "state",
      province: "state",
      country: "country",
      pincode: "pincode",
      zip: "pincode",
      "zip code": "pincode",
      "postal code": "pincode",
      pin: "pincode",
      profession: "profession",
      occupation: "profession",
      religion: "religion",
      pan: "pan",
      "pan number": "pan",
      source: "sourceOfDonor",
      "source of donor": "sourceOfDonor",
      "donation frequency": "donationFrequency",
      frequency: "donationFrequency",
      notes: "notes",
      remarks: "notes",
    };

    const colFieldMap: Record<number, string> = {};
    headers.forEach((h, idx) => {
      const field = fieldMapping[h];
      if (field) colFieldMap[idx] = field;
    });

    if (Object.keys(colFieldMap).length === 0) {
      throw new BadRequestException(
        "No recognizable column headers found. Please use the template.",
      );
    }

    const genderMap: Record<string, string> = {
      m: "MALE",
      male: "MALE",
      f: "FEMALE",
      female: "FEMALE",
      o: "OTHER",
      other: "OTHER",
      "prefer not to say": "PREFER_NOT_TO_SAY",
    };

    const validCategories = new Set([
      "INDIVIDUAL",
      "NGO",
      "CSR_REP",
      "WHATSAPP_GROUP",
      "SOCIAL_MEDIA_PERSON",
      "CROWD_PULLER",
      "VISITOR_ENQUIRY",
    ]);

    const validSources = new Set([
      "SOCIAL_MEDIA",
      "JUSTDIAL",
      "FRIEND",
      "SPONSOR",
      "WEBSITE",
      "WALK_IN",
      "REFERRAL",
      "OTHER",
    ]);

    const validFrequencies = new Set([
      "ONE_TIME",
      "WEEKLY",
      "MONTHLY",
      "QUARTERLY",
      "HALF_YEARLY",
      "YEARLY",
      "OCCASIONAL",
    ]);

    const results = {
      totalRows: 0,
      importedCount: 0,
      updatedCount: 0,
      skippedCount: 0,
      failedCount: 0,
      errors: [] as Array<{
        rowNumber: number;
        reason: string;
        rowData: Record<string, any>;
      }>,
    };

    const dataRows: Array<{ rowNumber: number; data: Record<string, any> }> =
      [];

    sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber === 1) return;

      const rowData: Record<string, any> = {};
      let hasAnyValue = false;

      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        const field = colFieldMap[colNumber - 1];
        if (field) {
          const val = cell.value;
          if (val !== undefined && val !== null && val !== "") {
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
          const cat = String(data.category).toUpperCase().replace(/\s+/g, "_");
          data.category = validCategories.has(cat) ? cat : undefined;
          if (!data.category) delete data.category;
        }
        if (data.sourceOfDonor) {
          const src = String(data.sourceOfDonor)
            .toUpperCase()
            .replace(/\s+/g, "_");
          data.sourceOfDonor = validSources.has(src) ? src : undefined;
          if (!data.sourceOfDonor) delete data.sourceOfDonor;
        }
        if (data.donationFrequency) {
          const freq = String(data.donationFrequency)
            .toUpperCase()
            .replace(/\s+/g, "_");
          data.donationFrequency = validFrequencies.has(freq)
            ? freq
            : undefined;
          if (!data.donationFrequency) delete data.donationFrequency;
        }

        const hasMinimum =
          data.firstName ||
          data.primaryPhone ||
          data.personalEmail ||
          data.officialEmail;

        if (!hasMinimum) {
          results.errors.push({
            rowNumber,
            reason:
              "Missing required data: need at least First Name, Phone, or Email",
            rowData: data,
          });
          results.failedCount++;
          continue;
        }

        if (data.personalEmail && !data.personalEmail.includes("@")) {
          results.errors.push({
            rowNumber,
            reason: `Invalid email format: ${data.personalEmail}`,
            rowData: data,
          });
          results.failedCount++;
          continue;
        }

        const phone = data.primaryPhone;
        const email = data.personalEmail || data.officialEmail;
        let existingDonor: any = null;

        if (mode === "upsert" && (phone || email)) {
          const conditions: any[] = [];
          if (phone) {
            conditions.push({ primaryPhone: phone });
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
            { ...data, firstName: data.firstName || "Unknown" },
            user.id,
          );
          results.importedCount++;
        }
      } catch (error: any) {
        results.errors.push({
          rowNumber,
          reason: error.message || "Unknown error",
          rowData: data,
        });
        results.failedCount++;
      }
    }

    results.skippedCount =
      results.totalRows -
      results.importedCount -
      results.updatedCount -
      results.failedCount;

    await this.auditService.logDataExport(
      user.id,
      "Bulk Upload",
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
}
