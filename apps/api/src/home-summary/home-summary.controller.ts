import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { HomeSummaryService } from './home-summary.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('home-summary')
@UseGuards(JwtAuthGuard, RolesGuard)
export class HomeSummaryController {
  constructor(private readonly service: HomeSummaryService) {}

  @Get()
  @Roles(Role.ADMIN, Role.STAFF)
  async getSummary(
    @Query('month') month: string,
    @Query('year') year: string,
  ) {
    const m = parseInt(month) || new Date().getMonth() + 1;
    const y = parseInt(year) || new Date().getFullYear();
    return this.service.getSummary(m, y);
  }

  @Get('download/pdf')
  @Roles(Role.ADMIN, Role.STAFF)
  async downloadPdf(
    @Query('month') month: string,
    @Query('year') year: string,
    @Res() res: Response,
  ) {
    const m = parseInt(month) || new Date().getMonth() + 1;
    const y = parseInt(year) || new Date().getFullYear();
    const buffer = await this.service.generatePdf(m, y);
    const filename = `home-summary-${y}-${String(m).padStart(2, '0')}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }

  @Get('download/excel')
  @Roles(Role.ADMIN, Role.STAFF)
  async downloadExcel(
    @Query('month') month: string,
    @Query('year') year: string,
    @Res() res: Response,
  ) {
    const m = parseInt(month) || new Date().getMonth() + 1;
    const y = parseInt(year) || new Date().getFullYear();
    const buffer = await this.service.generateExcel(m, y);
    const filename = `home-summary-${y}-${String(m).padStart(2, '0')}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }
}
