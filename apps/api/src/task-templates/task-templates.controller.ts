import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, UseGuards, Request, HttpCode,
} from '@nestjs/common';
import { TaskTemplatesService } from './task-templates.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('task-templates')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TaskTemplatesController {
  constructor(private readonly service: TaskTemplatesService) {}

  @Get()
  @Roles(Role.FOUNDER, Role.ADMIN, Role.STAFF)
  findAll(@Query('includeInactive') includeInactive?: string) {
    return this.service.findAll(includeInactive === 'true');
  }

  @Get('performance-all')
  @Roles(Role.FOUNDER, Role.ADMIN, Role.STAFF)
  getPerformanceAll(
    @Query('days') days?: string,
    @Request() req?: any,
  ) {
    return this.service.getPerformanceAll(days ? parseInt(days) : 30);
  }

  @Get('accountability/:userId')
  @Roles(Role.FOUNDER, Role.ADMIN, Role.STAFF)
  getAccountabilityScore(
    @Param('userId') userId: string,
    @Query('days') days?: string,
  ) {
    return this.service.getAccountabilityScore(userId, days ? parseInt(days) : 30);
  }

  @Get(':id')
  @Roles(Role.FOUNDER, Role.ADMIN, Role.STAFF)
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @Roles(Role.FOUNDER, Role.ADMIN)
  create(@Body() body: any, @Request() req: any) {
    return this.service.create(body, req.user.id);
  }

  @Post(':id/generate')
  @Roles(Role.FOUNDER, Role.ADMIN)
  generateTasks(
    @Param('id') id: string,
    @Body() body: { forDate?: string; targetUserIds?: string[] },
    @Request() req: any,
  ) {
    return this.service.generateTasks(id, { ...body, createdById: req.user.id });
  }

  @Post('mark-missed')
  @Roles(Role.FOUNDER, Role.ADMIN)
  markOverdueMissed() {
    return this.service.markOverdueMissed();
  }

  @Patch(':id')
  @Roles(Role.FOUNDER, Role.ADMIN)
  update(@Param('id') id: string, @Body() body: any) {
    return this.service.update(id, body);
  }

  @Delete(':id')
  @Roles(Role.FOUNDER, Role.ADMIN)
  delete(@Param('id') id: string) {
    return this.service.delete(id);
  }

  // ─── Template checklist items ────────────────────────────────────────────

  @Post(':id/items')
  @Roles(Role.FOUNDER, Role.ADMIN)
  addItem(
    @Param('id') id: string,
    @Body() body: { itemText: string; orderIndex?: number },
  ) {
    return this.service.addItem(id, body.itemText, body.orderIndex);
  }

  @Patch(':id/items/:itemId')
  @Roles(Role.FOUNDER, Role.ADMIN)
  updateItem(
    @Param('id') _id: string,
    @Param('itemId') itemId: string,
    @Body() body: { itemText?: string; orderIndex?: number },
  ) {
    return this.service.updateItem(itemId, body);
  }

  @Delete(':id/items/:itemId')
  @HttpCode(204)
  @Roles(Role.FOUNDER, Role.ADMIN)
  deleteItem(
    @Param('id') _id: string,
    @Param('itemId') itemId: string,
  ) {
    return this.service.deleteItem(itemId);
  }
}
