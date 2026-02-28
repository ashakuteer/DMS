import {
  Controller,
  Get,
  Post,
  UseGuards,
  Req,
  Res,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role, AuditAction } from '@prisma/client';
import { BackupService } from './backup.service';
import { AuditService } from '../audit/audit.service';
import { Request, Response } from 'express';

@Controller('backup')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BackupController {
  constructor(
    private backupService: BackupService,
    private auditService: AuditService,
  ) {}

  @Get('history')
  @Roles(Role.ADMIN)
  async getBackupHistory() {
    return this.backupService.getBackupHistory();
  }

  @Post('create')
  @Roles(Role.ADMIN)
  async createBackup(@Req() req: Request, @Res() res: Response) {
    const user = req.user as any;
    const { stream, filename, backupId } = await this.backupService.createBackup(user.id);

    try {
      await this.auditService.log({
        userId: user.id,
        action: AuditAction.DATA_EXPORT,
        entityType: 'BACKUP',
        entityId: backupId,
        metadata: { filename, type: 'full_backup' },
      });
    } catch {}

    res.set({
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });

    stream.pipe(res);
  }

  @Post('restore')
  @Roles(Role.ADMIN)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 100 * 1024 * 1024 } }))
  async restoreFromBackup(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
  ) {
    if (!file) {
      throw new BadRequestException('No backup file provided');
    }

    if (!file.originalname.endsWith('.zip')) {
      throw new BadRequestException('Backup file must be a ZIP archive');
    }

    const user = req.user as any;
    const result = await this.backupService.restoreFromBackup(file.buffer, user.id);

    try {
      await this.auditService.log({
        userId: user.id,
        action: AuditAction.DATA_EXPORT,
        entityType: 'BACKUP_RESTORE',
        metadata: {
          filename: file.originalname,
          tablesRestored: result.tablesRestored,
          recordCounts: result.recordCounts,
          type: 'restore',
        },
      });
    } catch {}

    return result;
  }
}
