import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Req,
  Res,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { NgoDocumentsService } from './ngo-documents.service';
import { Response } from 'express';
import * as fs from 'fs';

@Controller('ngo-documents')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NgoDocumentsController {
  constructor(private ngoDocumentsService: NgoDocumentsService) {}

  @Get()
  @Roles(Role.ADMIN, Role.STAFF)
  async findAll(
    @Query('category') category: string,
    @Query('search') search: string,
    @Query('expiryStatus') expiryStatus: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
  ) {
    return this.ngoDocumentsService.findAll({
      category,
      search,
      expiryStatus,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    });
  }

  @Get('stats')
  @Roles(Role.ADMIN, Role.STAFF)
  async getStats() {
    return this.ngoDocumentsService.getStats();
  }

  @Get('expiring')
  @Roles(Role.ADMIN, Role.STAFF)
  async getExpiring(@Query('days') days: string) {
    return this.ngoDocumentsService.getExpiringDocuments(
      days ? parseInt(days) : 30,
    );
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.STAFF)
  async findOne(@Param('id') id: string, @Req() req: any) {
    return this.ngoDocumentsService.findOne(id, req.user.id);
  }

  @Get(':id/download')
  @Roles(Role.ADMIN, Role.STAFF)
  async download(
    @Param('id') id: string,
    @Query('versionId') versionId: string,
    @Req() req: any,
    @Res() res: Response,
  ) {
    const { fullPath, fileName, mimeType } =
      await this.ngoDocumentsService.getFilePath(id, req.user.id, versionId);

    res.setHeader('Content-Type', mimeType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(fileName)}"`,
    );

    const fileStream = fs.createReadStream(fullPath);
    fileStream.pipe(res);
  }

  @Get(':id/access-log')
  @Roles(Role.ADMIN)
  async getAccessLog(@Param('id') id: string) {
    return this.ngoDocumentsService.getAccessLog(id);
  }

  @Post()
  @Roles(Role.ADMIN, Role.STAFF)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 25 * 1024 * 1024 } }))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body('title') title: string,
    @Body('description') description: string,
    @Body('category') category: string,
    @Body('expiryDate') expiryDate: string,
    @Req() req: any,
  ) {
    return this.ngoDocumentsService.upload(file, { title, description, category, expiryDate }, req.user.id);
  }

  @Post(':id/version')
  @Roles(Role.ADMIN, Role.STAFF)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 25 * 1024 * 1024 } }))
  async uploadVersion(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('changeNote') changeNote: string,
    @Req() req: any,
  ) {
    return this.ngoDocumentsService.uploadNewVersion(id, file, changeNote, req.user.id);
  }

  @Put(':id')
  @Roles(Role.ADMIN, Role.STAFF)
  async update(
    @Param('id') id: string,
    @Body() body: { title?: string; description?: string; category?: string; expiryDate?: string | null },
    @Req() req: any,
  ) {
    return this.ngoDocumentsService.update(id, body, req.user.id);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  async remove(@Param('id') id: string, @Req() req: any) {
    return this.ngoDocumentsService.remove(id, req.user.id);
  }
}
