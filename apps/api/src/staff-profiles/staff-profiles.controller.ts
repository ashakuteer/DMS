import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { StaffProfilesService } from './staff-profiles.service';

const FILE_LIMIT = { limits: { fileSize: 5 * 1024 * 1024 } };

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class StaffProfilesController {
  constructor(private readonly service: StaffProfilesService) {}

  // ─── Homes ────────────────────────────────────────────────────────────────

  @Get('homes')
  @Roles(Role.ADMIN, Role.STAFF)
  findAllHomes() {
    return this.service.findAllHomes();
  }

  @Post('homes')
  @Roles(Role.ADMIN)
  createHome(@Body() body: { name: string; address?: string }) {
    return this.service.createHome(body);
  }

  // ─── Staff — fixed-path routes first ─────────────────────────────────────

  @Get('staff-profiles')
  @Roles(Role.ADMIN, Role.STAFF)
  findAll(
    @Query('roleType') roleType?: string,
    @Query('homeId') homeId?: string,
    @Query('designation') designation?: string,
    @Query('status') status?: string,
  ) {
    return this.service.findAll({ roleType, homeId, designation, status });
  }

  @Post('staff-profiles')
  @Roles(Role.ADMIN)
  create(@Body() body: any) {
    return this.service.create(body);
  }

  @Post('staff-profiles/upload-photo')
  @Roles(Role.ADMIN, Role.STAFF)
  @UseInterceptors(FileInterceptor('file', FILE_LIMIT))
  uploadPhoto(
    @UploadedFile() file: Express.Multer.File,
    @Body('staffId') staffId: string,
  ) {
    return this.service.uploadPhoto(staffId, file);
  }

  @Post('staff-profiles/upload-document')
  @Roles(Role.ADMIN, Role.STAFF)
  @UseInterceptors(FileInterceptor('file', FILE_LIMIT))
  uploadDocument(
    @UploadedFile() file: Express.Multer.File,
    @Body('staffId') staffId: string,
    @Body('type') type: string,
  ) {
    return this.service.uploadDocument(staffId, file, type);
  }

  // ─── Staff — param routes ─────────────────────────────────────────────────

  @Get('staff-profiles/:id')
  @Roles(Role.ADMIN, Role.STAFF)
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch('staff-profiles/:id')
  @Roles(Role.ADMIN)
  update(@Param('id') id: string, @Body() body: any) {
    return this.service.update(id, body);
  }

  @Delete('staff-profiles/:id')
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Get('staff-profiles/:id/documents')
  @Roles(Role.ADMIN, Role.STAFF)
  getDocuments(@Param('id') id: string) {
    return this.service.getDocuments(id);
  }

  @Delete('staff-profiles/documents/:docId')
  @Roles(Role.ADMIN)
  deleteDocument(@Param('docId') docId: string) {
    return this.service.deleteDocument(docId);
  }

  @Get('staff-profiles/:id/bank-details')
  @Roles(Role.ADMIN, Role.STAFF)
  getBankDetails(@Param('id') id: string) {
    return this.service.getBankDetails(id);
  }

  @Post('staff-profiles/:id/bank-details')
  @Roles(Role.ADMIN)
  upsertBankDetails(@Param('id') id: string, @Body() body: any) {
    return this.service.upsertBankDetails(id, body);
  }
}
