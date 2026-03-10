import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  Req,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Inject,
  forwardRef,
  Res,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { RequirePermission } from "../auth/decorators/permissions.decorator";
import { DonorsService } from "./donors.service";
import { UserContext } from "./donors.types";
import { DuplicatesService } from "./donor-duplicates.service";
import { BeneficiariesService } from "../beneficiaries/beneficiaries.service";
import { Role } from "@prisma/client";
import { Request, Response } from "express";

@Controller("donors")
@UseGuards(JwtAuthGuard, RolesGuard)
export class DonorsController {
  constructor(
    private readonly donorsService: DonorsService,
    private readonly donorDuplicatesService: DuplicatesService,
    @Inject(forwardRef(() => BeneficiariesService))
    private readonly beneficiariesService: BeneficiariesService,
  ) {}

  private getClientInfo(req: Request) {
    const ipAddress =
      (req.headers["x-forwarded-for"] as string)?.split(",")[0] ||
      req.socket?.remoteAddress ||
      "unknown";
    const userAgent = req.headers["user-agent"] || "unknown";
    return { ipAddress, userAgent };
  }

  @Get()
  @Roles(Role.ADMIN, Role.STAFF, Role.TELECALLER)
  async findAll(
    @CurrentUser() user: UserContext,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("search") search?: string,
    @Query("sortBy") sortBy?: string,
    @Query("sortOrder") sortOrder?: "asc" | "desc",
    @Query("category") category?: string,
    @Query("city") city?: string,
    @Query("country") country?: string,
    @Query("religion") religion?: string,
    @Query("assignedToUserId") assignedToUserId?: string,
    @Query("donationFrequency") donationFrequency?: string,
    @Query("healthStatus") healthStatus?: string,
    @Query("supportPreferences") supportPreferences?: string,
  ) {
    return this.donorsService.findAll(user, {
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      search,
      sortBy,
      sortOrder,
      category,
      city,
      country,
      religion,
      assignedToUserId,
      donationFrequency,
      healthStatus,
      supportPreferences,
    });
  }

  @Get("check-duplicate")
  @Roles(Role.ADMIN, Role.STAFF)
  async checkDuplicate(
    @Query("phone") phone?: string,
    @Query("email") email?: string,
  ) {
    return this.donorsService.checkDuplicate(phone, email);
  }

  @Get("lookup")
  @Roles(Role.ADMIN, Role.STAFF, Role.TELECALLER)
  async lookupByPhone(@Query("phone") phone: string) {
    if (!phone) {
      throw new BadRequestException("Phone number is required");
    }
    return this.donorsService.lookupByPhone(phone);
  }

  @Get("bulk-template")
  @Roles(Role.ADMIN, Role.STAFF)
  async downloadBulkTemplate(@Res() res: Response) {
    const buffer = await this.donorsService.generateBulkTemplate();
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="donor-import-template.xlsx"',
    );
    res.send(buffer);
  }

  @Post("bulk-upload")
  @Roles(Role.ADMIN)
  @UseInterceptors(
    FileInterceptor("file", {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        if (
          file.mimetype ===
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
          file.originalname.match(/\.xlsx$/i)
        ) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException("Only Excel (.xlsx) files are allowed"),
            false,
          );
        }
      },
    }),
  )
  async bulkUpload(
    @CurrentUser() user: UserContext,
    @UploadedFile() file: Express.Multer.File,
    @Query("mode") mode?: string,
    @Req() req?: Request,
  ) {
    if (!file) {
      throw new BadRequestException("No file uploaded");
    }
    const { ipAddress, userAgent } = this.getClientInfo(req!);
    const uploadMode = mode === "insert_only" ? "insert_only" : "upsert";
    return this.donorsService.bulkUpload(
      file,
      user,
      uploadMode,
      ipAddress,
      userAgent,
    );
  }

  @Get("export")
  @Roles(Role.ADMIN)
  async exportDonors(
    @CurrentUser() user: UserContext,
    @Query("search") search?: string,
    @Req() req?: Request,
  ) {
    const { ipAddress, userAgent } = this.getClientInfo(req!);
    return this.donorsService.exportDonors(
      user,
      { search },
      ipAddress,
      userAgent,
    );
  }

  @Get("export/master-excel")
  @Roles(Role.ADMIN)
  async exportMasterDonorExcel(
    @CurrentUser() user: UserContext,
    @Query("home") home?: string,
    @Query("donorType") donorType?: string,
    @Query("activity") activity?: string,
    @Req() req?: Request,
    @Res() res?: Response,
  ) {
    const { ipAddress, userAgent } = this.getClientInfo(req!);
    const buffer = await this.donorsService.exportMasterDonorExcel(
      user,
      { home, donorType, activity },
      ipAddress,
      userAgent,
    );
    const filename = `master-donor-export-${new Date().toISOString().split("T")[0]}.xlsx`;
    res!.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res!.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res!.send(buffer);
  }

   @Get("duplicates")
  @Roles(Role.ADMIN)
  async findDuplicates(@CurrentUser() user: UserContext) {
    return this.donorDuplicatesService.getDuplicates(user as any);
  }

  @Post("duplicates/merge")
  @Roles(Role.ADMIN)
  async mergeDuplicates(
    @CurrentUser() user: UserContext,
    @Body() data: { primaryDonorId: string; mergeFromDonorIds: string[] },
  ) {
    return this.donorDuplicatesService.merge(
      data.primaryDonorId,
      data.mergeFromDonorIds,
      user as any,
    );
  }

  @Post("bulk-reassign")
  @Roles(Role.ADMIN)
  async bulkReassignDonors(
    @Body() body: { fromUserId: string; toUserId: string },
  ) {
    if (!body.fromUserId || !body.toUserId) {
      throw new BadRequestException("fromUserId and toUserId are required");
    }
    if (body.fromUserId === body.toUserId) {
      throw new BadRequestException("Source and target staff cannot be the same");
    }
    return this.donorsService.bulkReassignDonors(body.fromUserId, body.toUserId);
  }

  @Get("count-by-assignee/:userId")
  @Roles(Role.ADMIN)
  async countDonorsByAssignee(@Param("userId") userId: string) {
    const count = await this.donorsService.countDonorsByAssignee(userId);
    return { count };
  }

  @Get(":id")
  @Roles(Role.ADMIN, Role.STAFF, Role.TELECALLER)
  async findOne(@CurrentUser() user: UserContext, @Param("id") id: string) {
    return this.donorsService.findOne(user, id);
  }

  @Post()
  @Roles(Role.ADMIN, Role.STAFF)
  async create(
    @CurrentUser() user: UserContext,
    @Body() data: Record<string, unknown>,
    @Req() req: Request,
  ) {
    const { ipAddress, userAgent } = this.getClientInfo(req);
    return this.donorsService.create(user, data, ipAddress, userAgent);
  }

  @Patch(":id")
  @Roles(Role.ADMIN, Role.STAFF)
  async update(
    @CurrentUser() user: UserContext,
    @Param("id") id: string,
    @Body() data: Record<string, unknown>,
    @Req() req: Request,
  ) {
    const { ipAddress, userAgent } = this.getClientInfo(req);
    return this.donorsService.update(user, id, data, ipAddress, userAgent);
  }

  @Delete(":id")
  @Roles(Role.ADMIN)
  async remove(
    @CurrentUser() user: UserContext,
    @Param("id") id: string,
    @Req() req: Request,
  ) {
    const { ipAddress, userAgent } = this.getClientInfo(req);
    return this.donorsService.softDelete(user, id, ipAddress, userAgent);
  }

  @Post(":id/request-access")
  @Roles(Role.STAFF, Role.TELECALLER)
  async requestFullAccess(
    @CurrentUser() user: UserContext,
    @Param("id") id: string,
    @Body("reason") reason?: string,
    @Req() req?: Request,
  ) {
    const { ipAddress, userAgent } = this.getClientInfo(req!);
    return this.donorsService.requestFullAccess(
      user,
      id,
      reason,
      ipAddress,
      userAgent,
    );
  }

  @Post("bulk-import/parse")
  @Roles(Role.ADMIN)
  @UseInterceptors(
    FileInterceptor("file", {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        const allowedMimes = [
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "application/vnd.ms-excel",
          "text/csv",
        ];
        if (
          allowedMimes.includes(file.mimetype) ||
          file.originalname.match(/\.(xlsx|xls|csv)$/i)
        ) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException(
              "Only Excel (.xlsx, .xls) and CSV files are allowed",
            ),
            false,
          );
        }
      },
    }),
  )
  async parseImportFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException("No file uploaded");
    }
    return this.donorsService.parseImportFile(file);
  }

  @Post("bulk-import/detect-duplicates")
  @Roles(Role.ADMIN)
  async detectDuplicates(
    @Body() data: { rows: any[]; columnMapping: Record<string, string> },
  ) {
    return this.donorsService.detectDuplicatesInBatch(
      data.rows,
      data.columnMapping,
    );
  }

  @Post("bulk-import/execute")
  @Roles(Role.ADMIN)
  async executeBulkImport(
    @CurrentUser() user: UserContext,
    @Body()
    data: {
      rows: any[];
      columnMapping: Record<string, string>;
      actions: Record<number, "skip" | "update" | "create">;
    },
    @Req() req: Request,
  ) {
    const { ipAddress, userAgent } = this.getClientInfo(req);
    return this.donorsService.executeBulkImport(
      user,
      data.rows,
      data.columnMapping,
      data.actions,
      ipAddress,
      userAgent,
    );
  }

  @Get(":id/sponsorships")
  @Roles(Role.ADMIN, Role.STAFF, Role.TELECALLER)
  async getDonorSponsorships(@Param("id") id: string) {
    return this.beneficiariesService.getDonorSponsorships(id);
  }

  @Get(":id/timeline")
  @Roles(Role.ADMIN, Role.STAFF, Role.TELECALLER)
  async getTimeline(
    @CurrentUser() user: UserContext,
    @Param("id") id: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
    @Query("types") types?: string,
  ) {
    return this.donorsService.getTimeline(user, id, {
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      startDate,
      endDate,
      types: types ? types.split(",") : undefined,
    });
  }

  @Patch(":id/assign-telecaller")
  @Roles(Role.ADMIN, Role.MANAGER)
  async assignTelecaller(
    @CurrentUser() user: UserContext,
    @Param("id") donorId: string,
    @Body("assignedToUserId") assignedToUserId: string,
    @Req() req: Request,
  ) {
    const ipAddress =
      (req.headers["x-forwarded-for"] as string)?.split(",")[0] ||
      req.socket?.remoteAddress ||
      "unknown";
    const userAgent = (req.headers["user-agent"] as string) || "unknown";

    return this.donorsService.assignTelecaller(
      user,
      donorId,
      assignedToUserId,
      ipAddress,
      userAgent,
    );
  }

  @Patch(":id/assign")
  @RequirePermission("donors", "assign")
  async assignDonor(
    @Param("id") id: string,
    @Body() body: { assignedToUserId: string | null },
  ) {
    return this.donorsService.assignDonor(id, body.assignedToUserId);
  }

  @Post(":id/upload-photo")
  @Roles(Role.ADMIN, Role.STAFF)
  @UseInterceptors(
    FileInterceptor("photo", {
      storage: memoryStorage(),
      limits: { fileSize: 3 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        if (file.mimetype.match(/^image\/(jpeg|jpg|png|webp)$/)) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException(
              "Only jpg, jpeg, png, webp files are allowed",
            ),
            false,
          );
        }
      },
    }),
  )
  async uploadPhoto(
    @CurrentUser() user: UserContext,
    @Param("id") id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException("No photo uploaded");
    }
    return this.donorsService.uploadPhoto(user, id, file);
  }
}
