import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CampaignsService } from './campaigns.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@Controller('campaigns')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  @Get()
  @Roles(Role.ADMIN, Role.STAFF)
  async findAll(@Query('status') status?: string) {
    return this.campaignsService.findAll(status);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.STAFF)
  async findOne(@Param('id') id: string) {
    return this.campaignsService.findOne(id);
  }

  @Get(':id/timeline')
  @Roles(Role.ADMIN, Role.STAFF)
  async getTimeline(@Param('id') id: string) {
    return this.campaignsService.getTimeline(id);
  }

  @Get(':id/whatsapp-appeal')
  @Roles(Role.ADMIN, Role.STAFF)
  async getWhatsAppAppeal(@Param('id') id: string) {
    return this.campaignsService.getWhatsAppAppeal(id);
  }

  @Get(':id/beneficiaries')
  @Roles(Role.ADMIN, Role.STAFF)
  async getBeneficiaries(@Param('id') id: string) {
    return this.campaignsService.getBeneficiaries(id);
  }

  @Get(':id/updates')
  @Roles(Role.ADMIN, Role.STAFF)
  async getUpdates(@Param('id') id: string) {
    return this.campaignsService.getUpdates(id);
  }

  @Get(':id/donors')
  @Roles(Role.ADMIN, Role.STAFF)
  async getDonors(@Param('id') id: string) {
    return this.campaignsService.getDonors(id);
  }

  @Get(':id/analytics')
  @Roles(Role.ADMIN, Role.STAFF)
  async getAnalytics(@Param('id') id: string) {
    return this.campaignsService.getAnalytics(id);
  }

  @Post()
  @Roles(Role.ADMIN, Role.STAFF)
  async create(
    @Body()
    body: {
      name: string;
      description?: string;
      goalAmount?: number;
      startDate?: string;
      endDate?: string;
      status?: string;
      homeTypes?: string[];
    },
    @CurrentUser() user: any,
  ) {
    return this.campaignsService.create(body as any, user);
  }

  @Put(':id')
  @Roles(Role.ADMIN, Role.STAFF)
  async update(
    @Param('id') id: string,
    @Body()
    body: {
      name?: string;
      description?: string;
      goalAmount?: number;
      startDate?: string;
      endDate?: string;
      status?: string;
      homeTypes?: string[];
    },
  ) {
    return this.campaignsService.update(id, body as any);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  async remove(@Param('id') id: string) {
    return this.campaignsService.remove(id);
  }

  @Post(':id/beneficiaries')
  @Roles(Role.ADMIN, Role.STAFF)
  async addBeneficiaries(
    @Param('id') id: string,
    @Body() body: { beneficiaryIds: string[]; notes?: string },
  ) {
    return this.campaignsService.addBeneficiaries(id, body.beneficiaryIds, body.notes);
  }

  @Delete(':id/beneficiaries/:beneficiaryId')
  @Roles(Role.ADMIN, Role.STAFF)
  async removeBeneficiary(
    @Param('id') id: string,
    @Param('beneficiaryId') beneficiaryId: string,
  ) {
    return this.campaignsService.removeBeneficiary(id, beneficiaryId);
  }

  @Post(':id/updates')
  @Roles(Role.ADMIN, Role.STAFF)
  async createUpdate(
    @Param('id') id: string,
    @Body() body: { title: string; content: string; photoUrls?: string[] },
    @CurrentUser() user: any,
  ) {
    return this.campaignsService.createUpdate(id, body, user);
  }

  @Delete(':id/updates/:updateId')
  @Roles(Role.ADMIN)
  async deleteUpdate(
    @Param('id') id: string,
    @Param('updateId') updateId: string,
  ) {
    return this.campaignsService.deleteUpdate(id, updateId);
  }

  @Post(':id/send-email-appeal')
  @Roles(Role.ADMIN, Role.STAFF)
  async sendEmailAppeal(
    @Param('id') id: string,
    @Body() body: { donorIds: string[] },
    @CurrentUser() user: any,
  ) {
    return this.campaignsService.sendEmailAppeal(id, body.donorIds, user);
  }

  @Post(':id/updates/:updateId/broadcast')
  @Roles(Role.ADMIN, Role.STAFF)
  async broadcastUpdate(
    @Param('id') id: string,
    @Param('updateId') updateId: string,
    @Body() body: { donorIds: string[] },
    @CurrentUser() user: any,
  ) {
    return this.campaignsService.broadcastUpdate(id, updateId, body.donorIds, user);
  }

  @Get(':id/updates/:updateId/whatsapp-text')
  @Roles(Role.ADMIN, Role.STAFF)
  async getUpdateWhatsAppText(
    @Param('id') id: string,
    @Param('updateId') updateId: string,
  ) {
    return this.campaignsService.getUpdateWhatsAppText(id, updateId);
  }

  @Post(':id/updates/:updateId/whatsapp-log')
  @Roles(Role.ADMIN, Role.STAFF)
  async logWhatsAppBroadcast(
    @Param('id') id: string,
    @Param('updateId') updateId: string,
    @Body() body: { donorId: string },
    @CurrentUser() user: any,
  ) {
    return this.campaignsService.logWhatsAppBroadcast(id, updateId, body.donorId, user);
  }

  @Get(':id/updates/:updateId/dispatches')
  @Roles(Role.ADMIN, Role.STAFF)
  async getUpdateDispatches(
    @Param('id') id: string,
    @Param('updateId') updateId: string,
  ) {
    return this.campaignsService.getUpdateDispatches(id, updateId);
  }
}
