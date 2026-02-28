import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { SearchService } from './search.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('search')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @Roles(Role.ADMIN, Role.STAFF, Role.TELECALLER, Role.ACCOUNTANT, Role.MANAGER)
  async globalSearch(
    @Query('q') query: string,
    @Query('limit') limit?: string,
    @Query('entityType') entityType?: string,
    @Query('donorCategory') donorCategory?: string,
    @Query('donorCity') donorCity?: string,
    @Query('beneficiaryHomeType') beneficiaryHomeType?: string,
    @Query('beneficiaryStatus') beneficiaryStatus?: string,
    @Query('beneficiaryAgeGroup') beneficiaryAgeGroup?: string,
    @Query('beneficiarySponsored') beneficiarySponsored?: string,
    @Query('campaignStatus') campaignStatus?: string,
    @Query('campaignStartFrom') campaignStartFrom?: string,
    @Query('campaignStartTo') campaignStartTo?: string,
  ) {
    const searchLimit = limit ? Math.min(parseInt(limit, 10), 20) : 8;
    return this.searchService.globalSearch(query || '', searchLimit, {
      entityType,
      donorCategory,
      donorCity,
      beneficiaryHomeType,
      beneficiaryStatus,
      beneficiaryAgeGroup,
      beneficiarySponsored,
      campaignStatus,
      campaignStartFrom,
      campaignStartTo,
    });
  }
}
