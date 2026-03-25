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
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { Role, TaskStatus } from '@prisma/client';
import { TasksService } from './tasks.service';
import { TaskSchedulerService } from './task-scheduler.service';
import { CreateTaskDto, UpdateTaskStatusDto, UpdateTaskDto, LogContactDto } from './tasks.dto';

@Controller('tasks')
export class TasksController {
  constructor(
    private tasksService: TasksService,
    private taskSchedulerService: TaskSchedulerService,
  ) {}

  @Post('generate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.FOUNDER, Role.ADMIN)
  async triggerGeneration() {
    await this.taskSchedulerService.runDailyTaskGeneration();
    return { message: 'Task generation triggered successfully' };
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.FOUNDER, Role.ADMIN, Role.STAFF)
  create(@Body() dto: CreateTaskDto) {
    return this.tasksService.create(dto);
  }

  @Public()
  @Get('today')
  getToday() {
    return this.tasksService.getToday();
  }

  @Public()
  @Get('staff')
  getStaffList() {
    return this.tasksService.getStaffList();
  }

  @Public()
  @Get()
  findAll(
    @Query('status') status: string,
    @Query('type') type: string,
    @Query('category') category: string,
    @Query('dueDate') dueDate: string,
    @Query('timeWindow') timeWindow: string,
    @Query('assignedTo') assignedTo: string,
    @Query('priority') priority: string,
    @Query('donorId') donorId: string,
  ) {
    return this.tasksService.findAll({ status, type, category, dueDate, timeWindow, assignedTo, priority, donorId });
  }

  @Public()
  @Get('debug')
  getDebugInfo() {
    return this.tasksService.getDebugInfo();
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tasksService.findOne(id);
  }

  @Post(':id/contact')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.FOUNDER, Role.ADMIN, Role.STAFF)
  logContact(
    @Param('id') id: string,
    @Body() dto: LogContactDto,
    @Request() req: any,
  ) {
    return this.tasksService.logContact(id, dto, req.user?.userId ?? req.user?.id ?? '');
  }

  @Public()
  @Get(':id/contacts')
  getContactLogs(@Param('id') id: string) {
    return this.tasksService.getContactLogs(id);
  }

  @Patch(':id/complete')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.FOUNDER, Role.ADMIN, Role.STAFF)
  completeTask(@Param('id') id: string) {
    return this.tasksService.updateStatus(id, TaskStatus.COMPLETED);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.FOUNDER, Role.ADMIN, Role.STAFF)
  updateStatus(@Param('id') id: string, @Body() dto: UpdateTaskStatusDto) {
    return this.tasksService.updateStatus(id, dto.status as TaskStatus);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.FOUNDER, Role.ADMIN, Role.STAFF)
  updateTask(@Param('id') id: string, @Body() dto: UpdateTaskDto) {
    return this.tasksService.updateTask(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.FOUNDER, Role.ADMIN)
  deleteTask(@Param('id') id: string) {
    return this.tasksService.deleteTask(id);
  }
}
