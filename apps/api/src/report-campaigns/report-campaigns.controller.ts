import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { createClient } from '@supabase/supabase-js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role, ReportCampaignType } from '@prisma/client';
import { ReportCampaignsService } from './report-campaigns.service';

@Controller('report-campaigns')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class ReportCampaignsController {
  constructor(private readonly service: ReportCampaignsService) {}

  @Get()
  async findAll() {
    return this.service.findAll();
  }

  @Get('search-donors')
  async searchDonors(@Query('q') query: string) {
    return this.service.searchDonors(query || '');
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Get(':id/donors')
  async getCampaignDonors(@Param('id') id: string) {
    return this.service.getCampaignDonors(id);
  }

  @Post()
  async create(
    @Body() body: {
      name: string;
      type: 'QUARTERLY' | 'ANNUAL' | 'AUDIT' | 'EVENT';
      periodStart: string;
      periodEnd: string;
      target: string;
      customDonorIds?: string[];
      notes?: string;
    },
    @CurrentUser() user: any,
  ) {
    if (!body.name || !body.periodStart || !body.periodEnd) {
      throw new BadRequestException('Name, period start, and period end are required');
    }
    return this.service.create(
      {
        name: body.name,
        type: body.type || 'QUARTERLY',
        periodStart: body.periodStart,
        periodEnd: body.periodEnd,
        target: (body.target as any) || 'ALL_DONORS',
        customDonorIds: body.customDonorIds,
        notes: body.notes,
      },
      user,
    );
  }

  @Post(':id/attach-document')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 25 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
          cb(null, true);
        } else {
          cb(new BadRequestException('Only PDF files are allowed'), false);
        }
      },
    }),
  )
  async attachDocument(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { title?: string },
    @CurrentUser() user: any,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new BadRequestException('Storage not configured. Please configure Supabase storage settings.');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const fileName = `documents/reports/${id}/${Date.now()}-${file.originalname}`;

    const { error } = await supabase.storage
      .from('uploads')
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
      });

    if (error) {
      console.error('Supabase upload error:', error);
      throw new BadRequestException('Failed to upload file');
    }

    const { data: publicUrl } = supabase.storage
      .from('uploads')
      .getPublicUrl(fileName);

    return this.service.attachDocument(
      id,
      {
        title: body.title || file.originalname,
        storagePath: publicUrl.publicUrl,
        storageBucket: 'uploads',
        mimeType: file.mimetype,
        sizeBytes: file.size,
      },
      user,
    );
  }

  @Post(':id/send')
  async send(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.send(id, user);
  }

  @Get(':id/whatsapp-text')
  async getWhatsAppText(@Param('id') id: string) {
    return this.service.getWhatsAppText(id);
  }

  @Post(':id/whatsapp-sent/:donorId')
  async markWhatsAppSent(
    @Param('id') id: string,
    @Param('donorId') donorId: string,
    @CurrentUser() user: any,
  ) {
    return this.service.markWhatsAppSent(id, donorId, user);
  }
}
