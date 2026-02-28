import { Controller, Get, Post, Patch, Delete, Param, Query, Body, UseGuards } from '@nestjs/common';
import { DonorUpdatesService } from './donor-updates.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role, HomeType } from '@prisma/client';

@Controller('donor-updates')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DonorUpdatesController {
  constructor(private readonly donorUpdatesService: DonorUpdatesService) {}

  @Post()
  @Roles(Role.ADMIN, Role.STAFF)
  async create(
    @Body() body: {
      title: string;
      content: string;
      photos?: string[];
      relatedBeneficiaryIds?: string[];
      relatedHomeTypes?: HomeType[];
      isDraft?: boolean;
    },
    @CurrentUser() user: any,
  ) {
    return this.donorUpdatesService.create(body, user);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.STAFF)
  async update(
    @Param('id') id: string,
    @Body() body: {
      title?: string;
      content?: string;
      photos?: string[];
      relatedBeneficiaryIds?: string[];
      relatedHomeTypes?: HomeType[];
      isDraft?: boolean;
    },
  ) {
    return this.donorUpdatesService.update(id, body);
  }

  @Get()
  @Roles(Role.ADMIN, Role.STAFF)
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('draftsOnly') draftsOnly?: string,
  ) {
    return this.donorUpdatesService.findAll(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
      draftsOnly === 'true' ? true : draftsOnly === 'false' ? false : undefined,
    );
  }

  @Get('search-donors')
  @Roles(Role.ADMIN, Role.STAFF)
  async searchDonors(
    @Query('search') search: string,
    @Query('limit') limit?: string,
  ) {
    return this.donorUpdatesService.searchDonors(search, limit ? parseInt(limit) : 20);
  }

  @Get('donors-by-home')
  @Roles(Role.ADMIN, Role.STAFF)
  async getDonorsByHome(@Query('homeTypes') homeTypes: string) {
    const types = homeTypes.split(',').filter(Boolean) as HomeType[];
    return this.donorUpdatesService.getDonorsByHome(types);
  }

  @Get('donors-by-beneficiaries')
  @Roles(Role.ADMIN, Role.STAFF)
  async getDonorsByBeneficiaries(@Query('ids') ids: string) {
    const beneficiaryIds = ids.split(',').filter(Boolean);
    return this.donorUpdatesService.getDonorsByBeneficiaries(beneficiaryIds);
  }

  @Get('history')
  @Roles(Role.ADMIN, Role.STAFF)
  async getHistory(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.donorUpdatesService.getHistory(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.STAFF)
  async findOne(@Param('id') id: string) {
    return this.donorUpdatesService.findOne(id);
  }

  @Get(':id/preview')
  @Roles(Role.ADMIN, Role.STAFF)
  async preview(@Param('id') id: string) {
    return this.donorUpdatesService.preview(id);
  }

  @Post(':id/send')
  @Roles(Role.ADMIN, Role.STAFF)
  async send(
    @Param('id') id: string,
    @Body() body: { donorIds: string[]; channel: 'EMAIL' | 'WHATSAPP' },
    @CurrentUser() user: any,
  ) {
    return this.donorUpdatesService.send(id, body, user);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  async delete(@Param('id') id: string) {
    return this.donorUpdatesService.delete(id);
  }
}
