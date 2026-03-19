import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { DonorRelationsService, UserContext } from './donor-relations.service';
import { Role } from '@prisma/client';
import { Request } from 'express';

@Controller('donor-relations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DonorRelationsController {
  constructor(private readonly donorRelationsService: DonorRelationsService) {}

  private getClientInfo(req: Request) {
    const ipAddress =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
      req.socket?.remoteAddress ||
      'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    return { ipAddress, userAgent };
  }

  @Get('donors/:donorId/family-members')
  @Roles(Role.FOUNDER, Role.ADMIN, Role.STAFF)
  async getFamilyMembers(
    @CurrentUser() user: UserContext,
    @Param('donorId') donorId: string,
  ) {
    return this.donorRelationsService.getFamilyMembers(user, donorId);
  }

  @Post('donors/:donorId/family-members')
  @Roles(Role.FOUNDER, Role.ADMIN, Role.STAFF)
  async createFamilyMember(
    @CurrentUser() user: UserContext,
    @Param('donorId') donorId: string,
    @Body() data: any,
    @Req() req: Request,
  ) {
    const { ipAddress, userAgent } = this.getClientInfo(req);
    return this.donorRelationsService.createFamilyMember(user, donorId, data, ipAddress, userAgent);
  }

  @Patch('family-members/:id')
  @Roles(Role.FOUNDER, Role.ADMIN, Role.STAFF)
  async updateFamilyMember(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
    @Body() data: any,
    @Req() req: Request,
  ) {
    const { ipAddress, userAgent } = this.getClientInfo(req);
    return this.donorRelationsService.updateFamilyMember(user, id, data, ipAddress, userAgent);
  }

  @Delete('family-members/:id')
  @Roles(Role.FOUNDER, Role.ADMIN, Role.STAFF)
  async deleteFamilyMember(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    const { ipAddress, userAgent } = this.getClientInfo(req);
    return this.donorRelationsService.deleteFamilyMember(user, id, ipAddress, userAgent);
  }

  @Get('donors/:donorId/special-occasions')
  @Roles(Role.FOUNDER, Role.ADMIN, Role.STAFF)
  async getSpecialOccasions(
    @CurrentUser() user: UserContext,
    @Param('donorId') donorId: string,
  ) {
    return this.donorRelationsService.getSpecialOccasions(user, donorId);
  }

  @Get('donors/:donorId/special-occasions/upcoming')
  @Roles(Role.FOUNDER, Role.ADMIN, Role.STAFF)
  async getUpcomingSpecialOccasions(
    @CurrentUser() user: UserContext,
    @Param('donorId') donorId: string,
    @Query('days') days?: string,
  ) {
    return this.donorRelationsService.getUpcomingSpecialOccasions(
      user,
      donorId,
      days ? parseInt(days, 10) : 30,
    );
  }

  @Post('donors/:donorId/special-occasions')
  @Roles(Role.FOUNDER, Role.ADMIN, Role.STAFF)
  async createSpecialOccasion(
    @CurrentUser() user: UserContext,
    @Param('donorId') donorId: string,
    @Body() data: any,
    @Req() req: Request,
  ) {
    const { ipAddress, userAgent } = this.getClientInfo(req);
    return this.donorRelationsService.createSpecialOccasion(user, donorId, data, ipAddress, userAgent);
  }

  @Patch('special-occasions/:id')
  @Roles(Role.FOUNDER, Role.ADMIN, Role.STAFF)
  async updateSpecialOccasion(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
    @Body() data: any,
    @Req() req: Request,
  ) {
    const { ipAddress, userAgent } = this.getClientInfo(req);
    return this.donorRelationsService.updateSpecialOccasion(user, id, data, ipAddress, userAgent);
  }

  @Delete('special-occasions/:id')
  @Roles(Role.FOUNDER, Role.ADMIN, Role.STAFF)
  async deleteSpecialOccasion(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    const { ipAddress, userAgent } = this.getClientInfo(req);
    return this.donorRelationsService.deleteSpecialOccasion(user, id, ipAddress, userAgent);
  }
}
