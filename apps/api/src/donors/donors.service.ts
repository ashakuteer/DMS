import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { DonorsCrudService } from "./donors.crud.service";
import { DonorsImportService } from "./import/donors-import.service";
import { DonorsExportService } from "./donors.export.service";
import { UserContext, DonorQueryOptions } from "./donors.types";
import { StorageService } from "../storage/storage.service";
import { DonorsTimelineService } from "./donors.timeline.service";

@Injectable()
export class DonorsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly storageService: StorageService,
    private readonly crud: DonorsCrudService,
    private readonly importService: DonorsImportService,
    private readonly exportService: DonorsExportService,
    private readonly timelineService: DonorsTimelineService,
  ) {}

  private async getActiveDonorOrThrow(id: string) {
    const donor = await this.prisma.donor.findFirst({
      where: { id, isDeleted: false },
    });

    if (!donor) {
      throw new NotFoundException("Donor not found");
    }

    return donor;
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

  getTimeline(
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
    return this.timelineService.getTimeline(user, donorId, options);
  }

  parseImportFile(file: Express.Multer.File) {
    return this.importService.parseImportFile(file);
  }

  detectDuplicatesInBatch(
    rows: any[],
    columnMapping: Record<string, string>,
  ) {
    this.importService.detectDuplicates(rows, columnMapping);
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

  exportDonors(
    user: UserContext,
    filters: any = {},
    ipAddress?: string,
    userAgent?: string,
  ) {
    return this.exportService.exportDonors(
      user,
      filters,
      ipAddress,
      userAgent,
    );
  }

  exportMasterDonorExcel(
    user: UserContext,
    filters: {
      home?: string;
      donorType?: string;
      activity?: string;
    } = {},
    ipAddress?: string,
    userAgent?: string,
  ): Promise<Buffer> {
    return this.exportService.exportMasterDonorExcel(
      user,
      filters,
      ipAddress,
      userAgent,
    );
  }

  async uploadPhoto(user: UserContext, id: string, file: Express.Multer.File) {
    const donor = await this.getActiveDonorOrThrow(id);

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
    await this.getActiveDonorOrThrow(donorId);

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

  async assignTelecaller(
    user: UserContext,
    donorId: string,
    assignedToUserId: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const donor = await this.getActiveDonorOrThrow(donorId);
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
