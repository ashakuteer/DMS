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
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { StaffTasksService } from './staff-tasks.service';

@Controller('staff-tasks')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StaffTasksController {
  constructor(private staffTasksService: StaffTasksService) {}

  private isAdminOrManager(role: string): boolean {
    return role === Role.ADMIN || role === Role.MANAGER;
  }

  @Get()
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF, Role.TELECALLER)
  async findAll(
    @Query('status') status: string,
    @Query('priority') priority: string,
    @Query('assignedToId') assignedToId: string,
    @Query('category') category: string,
    @Query('search') search: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Req() req: any,
  ) {
    const filters: any = {
      status,
      priority,
      category,
      search,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 50,
    };

    if (this.isAdminOrManager(req.user.role)) {
      filters.assignedToId = assignedToId || undefined;
    } else {
      filters.assignedToId = req.user.id;
    }

    return this.staffTasksService.findAll(filters);
  }

  @Get('stats')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF, Role.TELECALLER)
  async getStats(@Query('userId') userId: string, @Req() req: any) {
    if (this.isAdminOrManager(req.user.role)) {
      return this.staffTasksService.getStats(userId || undefined);
    }
    return this.staffTasksService.getStats(req.user.id);
  }

  @Get('staff-list')
  @Roles(Role.ADMIN, Role.MANAGER)
  async getStaffList() {
    return this.staffTasksService.getStaffList();
  }

  @Get('staff/:userId/performance')
  @Roles(Role.ADMIN, Role.MANAGER)
  async getStaffPerformance(
    @Param('userId') userId: string,
    @Query('year') year: string,
  ) {
    return this.staffTasksService.getStaffPerformance(userId, year ? parseInt(year) : undefined);
  }

  @Get('kanban')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF, Role.TELECALLER)
  async getKanbanBoard(@Query('assignedToId') assignedToId: string, @Req() req: any) {
    if (this.isAdminOrManager(req.user.role)) {
      return this.staffTasksService.getKanbanBoard(assignedToId || undefined);
    }
    return this.staffTasksService.getKanbanBoard(req.user.id);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF, Role.TELECALLER)
  async findOne(@Param('id') id: string, @Req() req: any) {
    const task = await this.staffTasksService.findOne(id);
    if (!this.isAdminOrManager(req.user.role) && task.assignedToId !== req.user.id) {
      throw new ForbiddenException('You can only view tasks assigned to you');
    }
    return task;
  }

  @Post()
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF, Role.TELECALLER)
  async create(@Body() body: any, @Req() req: any) {
    const assignedToId = this.isAdminOrManager(req.user.role)
      ? body.assignedToId || req.user.id
      : req.user.id;

    return this.staffTasksService.create(
      {
        title: body.title,
        description: body.description,
        status: body.status,
        priority: body.priority,
        category: body.category,
        assignedToId,
        linkedDonorId: body.linkedDonorId,
        dueDate: body.dueDate,
        notes: body.notes,
      },
      req.user.id,
    );
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF, Role.TELECALLER)
  async update(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    if (!this.isAdminOrManager(req.user.role)) {
      const task = await this.staffTasksService.findOne(id);
      if (task.assignedToId !== req.user.id) {
        throw new ForbiddenException('You can only update tasks assigned to you');
      }
    }
    return this.staffTasksService.update(id, body, req.user.id);
  }

  @Patch(':id/status')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF, Role.TELECALLER)
  async updateStatus(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    if (!this.isAdminOrManager(req.user.role)) {
      const task = await this.staffTasksService.findOne(id);
      if (task.assignedToId !== req.user.id) {
        throw new ForbiddenException('You can only update tasks assigned to you');
      }
    }
    return this.staffTasksService.updateTaskStatus(id, body.status, req.user.id);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.MANAGER)
  async remove(@Param('id') id: string) {
    return this.staffTasksService.delete(id);
  }

  @Post('calculate-performance')
  @Roles(Role.ADMIN, Role.MANAGER)
  async calculatePerformance(@Body() body: any) {
    return this.staffTasksService.calculatePerformance(body.userId, body.month, body.year);
  }
}
