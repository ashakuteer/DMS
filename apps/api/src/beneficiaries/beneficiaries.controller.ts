import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  Res,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import type { Response, Express } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { 
  BeneficiariesService, 
  UserContext,
  CreateBeneficiaryDto,
  UpdateBeneficiaryDto,
  CreateSponsorshipDto,
  UpdateSponsorshipDto,
  CreateBeneficiaryUpdateDto,
  CreateTimelineEventDto,
  CreateMetricDto,
  CreateProgressCardDto,
  CreateHealthEventDto,
  CreateDocumentDto,
  CreateReportCampaignDto,
} from '.from './types';
import { Role, HomeType, BeneficiaryStatus } from '@prisma/client';
import { StorageService } from '../storage/storage.service';

@Controller('beneficiaries')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BeneficiariesController {
  constructor(
    private readonly beneficiariesService: BeneficiariesService,
    private readonly storageService: StorageService,
  ) {}

  @Get()
  @Roles(Role.ADMIN, Role.STAFF)
  async findAll(
    @CurrentUser() user: UserContext,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('homeType') homeType?: string,
    @Query('status') status?: string,
    @Query('sponsored') sponsored?: string,
    @Query('classGrade') classGrade?: string,
    @Query('school') school?: string,
    @Query('academicYear') academicYear?: string,
  ) {
    return this.beneficiariesService.findAll(user, {
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      search,
      homeType: homeType as HomeType | undefined,
      status: status as BeneficiaryStatus | undefined,
      sponsored: sponsored === 'true' ? true : sponsored === 'false' ? false : undefined,
      classGrade: classGrade || undefined,
      school: school || undefined,
      academicYear: academicYear || undefined,
    });
  }

  @Get('export/excel')
  @Roles(Role.ADMIN)
  async exportExcel(@CurrentUser() user: UserContext) {
    return this.beneficiariesService.exportToExcel(user);
  }

 @Get("bulk-template")
@Roles(Role.ADMIN, Role.STAFF)
async downloadBulkTemplate() {
  // Beneficiary bulk import is disabled for now
  throw new BadRequestException("Beneficiary bulk template download is disabled.");
}

@Post("bulk-upload")
@Roles(Role.ADMIN)
@UseInterceptors(
  FileInterceptor("file", {
    storage: memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      if (
        file.mimetype.includes("spreadsheet") ||
        file.mimetype.includes("excel") ||
        file.originalname.endsWith(".xlsx")
      ) {
        cb(null, true);
      } else {
        cb(new BadRequestException("Only .xlsx files are allowed"), false);
      }
    },
  }),
)
async bulkUpload(
  @CurrentUser() user: UserContext,
  @UploadedFile() file: Express.Multer.File,
  @Query("mode") mode?: string,
) {
  // Beneficiary bulk import is disabled for now
  throw new BadRequestException("Beneficiary bulk upload is disabled.");
}

  @Get(':id')
  @Roles(Role.ADMIN, Role.STAFF)
  async findById(@Param('id') id: string) {
    return this.beneficiariesService.findById(id);
  }

  @Post()
  @Roles(Role.ADMIN, Role.STAFF)
  async create(
    @CurrentUser() user: UserContext,
    @Body() dto: CreateBeneficiaryDto,
  ) {
    return this.beneficiariesService.create(user, dto);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.STAFF)
  async update(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
    @Body() dto: UpdateBeneficiaryDto,
  ) {
    return this.beneficiariesService.update(user, id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  async delete(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
  ) {
    return this.beneficiariesService.delete(user, id);
  }

  @Post(':id/photo')
  @Roles(Role.ADMIN, Role.STAFF)
  @UseInterceptors(
    FileInterceptor('photo', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (req, file, callback) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) {
          return callback(new BadRequestException('Only image files are allowed'), false);
        }
        callback(null, true);
      },
    }),
  )
  async uploadPhoto(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const existing = await this.beneficiariesService.findById(id);
    if ((existing as any)?.photoPath) {
      await this.storageService.deletePhoto((existing as any).photoPath);
    }

    const { path, url } = await this.storageService.uploadPhoto(
      id,
      file.buffer,
      file.mimetype,
      file.originalname,
    );

    await this.beneficiariesService.updatePhoto(id, url, path);

    return { photoUrl: url, photoPath: path };
  }

  @Delete(':id/photo')
  @Roles(Role.ADMIN, Role.STAFF)
  async deletePhoto(
    @Param('id') id: string,
  ) {
    const beneficiary = await this.beneficiariesService.findById(id);
    if ((beneficiary as any)?.photoPath) {
      await this.storageService.deletePhoto((beneficiary as any).photoPath);
    }
    await this.beneficiariesService.updatePhoto(id, null, null);
    return { success: true };
  }

  @Post(':id/photo/link')
  @Roles(Role.ADMIN)
  async linkExistingPhoto(
    @Param('id') id: string,
    @Body() body: { photoUrl: string; photoPath?: string },
  ) {
    if (!body.photoUrl || typeof body.photoUrl !== 'string') {
      throw new BadRequestException('Photo URL is required');
    }

    const url = body.photoUrl.trim();
    try {
      const parsed = new URL(url);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        throw new Error('Invalid protocol');
      }
    } catch {
      throw new BadRequestException('Invalid URL format. Must be a valid https URL.');
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    if (supabaseUrl) {
      const supabaseDomain = new URL(supabaseUrl).hostname;
      const urlDomain = new URL(url).hostname;
      if (urlDomain !== supabaseDomain) {
        throw new BadRequestException(
          `Photo URL must be from your Supabase storage (${supabaseDomain}). External URLs are not allowed.`,
        );
      }
    }

    let photoPath: string | null = body.photoPath || null;
    if (!photoPath && url.includes('/beneficiary-photos/')) {
      const pathMatch = url.split('/beneficiary-photos/')[1];
      if (pathMatch) {
        photoPath = decodeURIComponent(pathMatch);
      }
    }

    await this.beneficiariesService.updatePhoto(id, url, photoPath);
    return { photoUrl: url, photoPath };
  }

  @Get(':id/sponsors')
  @Roles(Role.ADMIN, Role.STAFF)
  async getSponsors(@Param('id') id: string) {
    return this.beneficiariesService.getSponsors(id);
  }

  @Post(':id/sponsors')
  @Roles(Role.ADMIN, Role.STAFF)
  async addSponsor(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
    @Body() dto: CreateSponsorshipDto,
  ) {
    return this.beneficiariesService.addSponsor(user, id, dto);
  }

  @Get(':id/updates')
  @Roles(Role.ADMIN, Role.STAFF)
  async getUpdates(@Param('id') id: string) {
    return this.beneficiariesService.getUpdates(id);
  }

  @Post(':id/updates')
  @Roles(Role.ADMIN, Role.STAFF)
  async addUpdate(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
    @Body() dto: CreateBeneficiaryUpdateDto,
  ) {
    return this.beneficiariesService.addUpdate(user, id, dto);
  }

  @Get(':id/timeline')
  @Roles(Role.ADMIN, Role.STAFF)
  async getTimelineEvents(@Param('id') id: string) {
    return this.beneficiariesService.getTimelineEvents(id);
  }

  @Post(':id/timeline')
  @Roles(Role.ADMIN, Role.STAFF)
  async addTimelineEvent(
    @Param('id') id: string,
    @Body() dto: CreateTimelineEventDto,
  ) {
    return this.beneficiariesService.addTimelineEvent(id, dto);
  }

  @Get(':id/metrics')
  @Roles(Role.ADMIN, Role.STAFF)
  async getMetrics(@Param('id') id: string) {
    return this.beneficiariesService.getMetrics(id);
  }

  @Post(':id/metrics')
  @Roles(Role.ADMIN, Role.STAFF)
  async addMetric(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
    @Body() dto: CreateMetricDto,
  ) {
    return this.beneficiariesService.addMetric(user, id, dto);
  }

  @Get(':id/progress-cards')
  @Roles(Role.ADMIN, Role.STAFF)
  async getProgressCards(@Param('id') id: string) {
    return this.beneficiariesService.getProgressCards(id);
  }

  @Post(':id/progress-cards')
  @Roles(Role.ADMIN, Role.STAFF)
  async addProgressCard(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
    @Body() dto: CreateProgressCardDto,
  ) {
    return this.beneficiariesService.addProgressCard(user, id, dto);
  }

  @Get(':id/education-timeline')
  @Roles(Role.ADMIN, Role.STAFF)
  async getEducationTimeline(@Param('id') id: string) {
    return this.beneficiariesService.getEducationTimeline(id);
  }

  @Get(':id/education-summary/export')
  @Roles(Role.ADMIN, Role.STAFF)
  async exportEducationSummary(@Param('id') id: string, @Res() res: any) {
    const pdfBuffer = await this.beneficiariesService.exportEducationSummaryPdf(id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="education-summary-${id}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });
    res.end(pdfBuffer);
  }

  @Get(':id/health-events')
  @Roles(Role.ADMIN, Role.STAFF)
  async getHealthEvents(@Param('id') id: string) {
    return this.beneficiariesService.getHealthEvents(id);
  }

  @Post(':id/health-events')
  @Roles(Role.ADMIN, Role.STAFF)
  async addHealthEvent(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
    @Body() dto: CreateHealthEventDto,
  ) {
    return this.beneficiariesService.addHealthEvent(user, id, dto);
  }

  @Post('health-events/:eventId/notify-sponsors')
  @Roles(Role.ADMIN, Role.STAFF)
  async notifySponsorsOfHealthEvent(
    @CurrentUser() user: UserContext,
    @Param('eventId') eventId: string,
  ) {
    return this.beneficiariesService.sendHealthEventToSponsors(user, eventId);
  }

  @Get(':id/health-timeline')
  @Roles(Role.ADMIN, Role.STAFF)
  async getHealthTimeline(@Param('id') id: string) {
    return this.beneficiariesService.getHealthTimeline(id);
  }

  @Get(':id/health-history/export')
  @Roles(Role.ADMIN, Role.STAFF)
  async exportHealthHistoryPdf(
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const pdfBuffer = await this.beneficiariesService.exportHealthHistoryPdf(id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="health-history-${id}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });
    res.end(pdfBuffer);
  }

  @Get(':id/documents')
  @Roles(Role.ADMIN, Role.STAFF)
  async getDocuments(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
  ) {
    return this.beneficiariesService.getDocuments(user, 'BENEFICIARY', id);
  }

  @Post(':id/documents')
  @Roles(Role.ADMIN, Role.STAFF)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  async createDocument(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: any,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const { path: storagePath, url: publicUrl } = await this.storageService.uploadDocument(
      `documents/beneficiaries/${id}`,
      file.buffer,
      file.mimetype,
      file.originalname,
    );

    const dto: CreateDocumentDto = {
      ownerType: 'BENEFICIARY' as any,
      ownerId: id,
      docType: body.docType || 'OTHER',
      title: body.title || file.originalname,
      description: body.description,
      storageBucket: 'uploads',
      storagePath: publicUrl,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      isSensitive: body.isSensitive === 'true' || body.isSensitive === true,
      shareWithDonor: body.shareWithDonor === 'true' || body.shareWithDonor === true,
    };

    return this.beneficiariesService.createDocument(user, dto);
  }

  @Get('documents/:docId')
  @Roles(Role.ADMIN, Role.STAFF)
  async getDocument(
    @CurrentUser() user: UserContext,
    @Param('docId') docId: string,
  ) {
    return this.beneficiariesService.getDocumentById(user, docId);
  }
}

@Controller('report-campaigns')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportCampaignsController {
  constructor(
    private readonly beneficiariesService: BeneficiariesService,
  ) {}

  @Get()
  @Roles(Role.ADMIN)
  async findAll() {
    return this.beneficiariesService.getReportCampaigns();
  }

  @Post()
  @Roles(Role.ADMIN)
  async create(
    @CurrentUser() user: UserContext,
    @Body() dto: CreateReportCampaignDto,
  ) {
    return this.beneficiariesService.createReportCampaign(user, dto);
  }

  @Post(':id/send')
  @Roles(Role.ADMIN)
  async sendEmails(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
  ) {
    return this.beneficiariesService.queueReportCampaignEmails(user, id);
  }
}

@Controller('sponsorships')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SponsorshipsController {
  constructor(
    private readonly beneficiariesService: BeneficiariesService,
  ) {}

  @Get('due')
  @Roles(Role.ADMIN, Role.STAFF)
  async getDue(@Query('window') window?: string) {
    const windowDays = parseInt(window || '7', 10);
    return this.beneficiariesService.getDueSponsorships(windowDays);
  }

  @Get('summary')
  @Roles(Role.ADMIN, Role.STAFF)
  async getSummary() {
    return this.beneficiariesService.getSponsorshipSummary();
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.STAFF)
  async update(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
    @Body() dto: UpdateSponsorshipDto,
  ) {
    return this.beneficiariesService.updateSponsorship(user, id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  async delete(@Param('id') id: string) {
    return this.beneficiariesService.deleteSponsorship(id);
  }

  @Post(':id/mark-paid')
  @Roles(Role.ADMIN, Role.STAFF)
  async markPaid(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
    @Body() body: { paymentMode?: string; notes?: string },
  ) {
    return this.beneficiariesService.markSponsorshipPaid(user, id, body);
  }

  @Post(':id/send-email')
  @Roles(Role.ADMIN, Role.STAFF)
  async sendEmail(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
  ) {
    return this.beneficiariesService.sendSponsorshipReminderEmail(id);
  }

  @Post(':id/queue-email')
  @Roles(Role.ADMIN, Role.STAFF)
  async queueEmail(
    @Param('id') id: string,
  ) {
    return this.beneficiariesService.queueSponsorshipReminderEmail(id);
  }

  @Post(':id/skip')
  @Roles(Role.ADMIN, Role.STAFF)
  async skip(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
  ) {
    return this.beneficiariesService.skipSponsorshipMonth(user, id);
  }

  @Get(':id/history')
  @Roles(Role.ADMIN, Role.STAFF)
  async getHistory(@Param('id') id: string) {
    return this.beneficiariesService.getSponsorshipHistory(id);
  }
}

@Controller('beneficiary-updates')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BeneficiaryUpdatesController {
  constructor(
    private readonly beneficiariesService: BeneficiariesService,
  ) {}

  @Delete(':id')
  @Roles(Role.ADMIN)
  async delete(@Param('id') id: string) {
    return this.beneficiariesService.deleteUpdate(id);
  }

  @Get(':id/sponsors')
  @Roles(Role.ADMIN, Role.STAFF)
  async getSponsorsForUpdate(@Param('id') id: string) {
    const update = await this.beneficiariesService.getUpdateWithBeneficiary(id);
    const sponsors = await this.beneficiariesService.getSponsorsForUpdate(update.beneficiaryId);
    return {
      update: {
        id: update.id,
        title: update.title,
        content: update.content,
        updateType: update.updateType,
        isPrivate: update.isPrivate,
      },
      sponsors,
    };
  }

  @Post(':id/send')
  @Roles(Role.ADMIN, Role.STAFF)
  async sendToSponsors(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
    @Body() body: { donorIds?: string[]; channel: 'EMAIL' | 'WHATSAPP' },
  ) {
    return this.beneficiariesService.sendUpdateToSponsors(
      user,
      id,
      body.donorIds,
      body.channel,
    );
  }
}

@Controller('sponsor-dispatches')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SponsorDispatchesController {
  constructor(
    private readonly beneficiariesService: BeneficiariesService,
  ) {}

  @Patch(':id/copied')
  @Roles(Role.ADMIN, Role.STAFF)
  async markCopied(@Param('id') id: string) {
    return this.beneficiariesService.markDispatchCopied(id);
  }
}
