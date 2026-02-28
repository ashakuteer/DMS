import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { FollowUpsService } from './follow-ups.service';

@Controller('follow-ups')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FollowUpsController {
  constructor(private followUpsService: FollowUpsService) {}

  @Get()
  @Roles(Role.ADMIN, Role.STAFF, Role.TELECALLER)
  async findAll(
    @Query('status') status: string,
    @Query('assignedToId') assignedToId: string,
    @Query('donorId') donorId: string,
    @Query('priority') priority: string,
    @Query('dueBefore') dueBefore: string,
    @Query('dueAfter') dueAfter: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Req() req: any,
  ) {
    return this.followUpsService.findAll({
      status,
      assignedToId,
      donorId,
      priority,
      dueBefore,
      dueAfter,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 50,
      userId: req.user.id,
      userRole: req.user.role,
    });
  }

  @Get('stats')
  @Roles(Role.ADMIN, Role.STAFF, Role.TELECALLER)
  async getStats(@Req() req: any) {
    return this.followUpsService.getDashboardStats(req.user.id, req.user.role);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.STAFF, Role.TELECALLER)
  async findOne(@Param('id') id: string, @Req() req: any) {
    return this.followUpsService.findOne(id, req.user.id, req.user.role);
  }

  @Post()
  @Roles(Role.ADMIN, Role.STAFF)
  async create(@Body() body: any, @Req() req: any) {
    return this.followUpsService.create({
      donorId: body.donorId,
      assignedToId: body.assignedToId || req.user.id,
      note: body.note,
      dueDate: body.dueDate,
      priority: body.priority,
      createdById: req.user.id,
    });
  }

  @Put(':id')
  @Roles(Role.ADMIN, Role.STAFF)
  async update(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    return this.followUpsService.update(id, body, req.user.id, req.user.role);
  }

  @Patch(':id/complete')
  @Roles(Role.ADMIN, Role.STAFF, Role.TELECALLER)
  async markComplete(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    return this.followUpsService.markComplete(id, body.completedNote || null, req.user.id, req.user.role);
  }

  @Patch(':id/reopen')
  @Roles(Role.ADMIN, Role.STAFF)
  async reopen(@Param('id') id: string, @Req() req: any) {
    return this.followUpsService.reopen(id, req.user.id, req.user.role);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  async remove(@Param('id') id: string, @Req() req: any) {
    return this.followUpsService.remove(id, req.user.id, req.user.role);
  }
}
