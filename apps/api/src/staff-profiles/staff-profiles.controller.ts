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

  // ─── Staff ────────────────────────────────────────────────────────────────

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

  @Post('staff-profiles/upload-document')
  @Roles(Role.ADMIN, Role.STAFF)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  uploadDocument(
    @UploadedFile() file: Express.Multer.File,
    @Body('staffId') staffId: string,
    @Body('type') type: string,
  ) {
    return this.service.uploadDocument(staffId, file, type);
  }

  @Get('staff-profiles/:id/documents')
  @Roles(Role.ADMIN, Role.STAFF)
  getDocuments(@Param('id') id: string) {
    return this.service.getDocuments(id);
  }

  @Get('staff-profiles/:id')
  @Roles(Role.ADMIN, Role.STAFF)
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post('staff-profiles')
  @Roles(Role.ADMIN)
  create(@Body() body: any) {
    return this.service.create(body);
  }

  @Patch('staff-profiles/:id')
  @Roles(Role.ADMIN)
  update(@Param('id') id: string, @Body() body: any) {
    return this.service.update(id, body);
  }

  @Delete('staff-profiles/documents/:docId')
  @Roles(Role.ADMIN)
  deleteDocument(@Param('docId') docId: string) {
    return this.service.deleteDocument(docId);
  }

  @Delete('staff-profiles/:id')
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
