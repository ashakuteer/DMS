import {
  Controller, Get, Post, Delete, Param, Query, Body, Req, Res,
  UseGuards, HttpStatus, BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { BeneficiaryProgressReportsService } from './beneficiary-progress-reports.service';
import { Response } from 'express';

@Controller('beneficiary-progress-reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BeneficiaryProgressReportsController {
  constructor(private readonly service: BeneficiaryProgressReportsService) {}

  @Post('generate')
  @Roles('ADMIN', 'STAFF')
  async generate(@Body() body: any, @Req() req: any) {
    if (!body.beneficiaryId || !body.periodStart || !body.periodEnd) {
      throw new BadRequestException('beneficiaryId, periodStart, periodEnd are required');
    }
    return this.service.generate(body, req.user);
  }

  @Get()
  @Roles('ADMIN', 'STAFF')
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('beneficiaryId') beneficiaryId?: string,
  ) {
    return this.service.findAll(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
      { beneficiaryId },
    );
  }

  @Get('search-beneficiaries')
  @Roles('ADMIN', 'STAFF')
  async searchBeneficiaries(@Query('q') q: string) {
    return this.service.searchBeneficiaries(q || '');
  }

  @Get(':id')
  @Roles('ADMIN', 'STAFF')
  async findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Get(':id/download/pdf')
  @Roles('ADMIN', 'STAFF')
  async downloadPdf(@Param('id') id: string, @Res() res: Response) {
    const report = await this.service.findOne(id);
    const pdf = await this.service.generatePdf(id);
    const fileName = `progress-report-${report.beneficiary.code}-${Date.now()}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', pdf.length);
    res.status(HttpStatus.OK).end(pdf);
  }

  @Post(':id/share-sponsors')
  @Roles('ADMIN', 'STAFF')
  async shareWithSponsors(@Param('id') id: string, @Req() req: any) {
    return this.service.shareWithSponsors(id, req.user);
  }

  @Post(':id/share')
  @Roles('ADMIN', 'STAFF')
  async shareToDonors(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    if (!body.donorIds?.length) {
      throw new BadRequestException('donorIds array is required');
    }
    return this.service.shareToDonors(id, body.donorIds, req.user);
  }

  @Delete(':id')
  @Roles('ADMIN')
  async delete(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
