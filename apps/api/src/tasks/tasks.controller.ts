import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { Role, TaskStatus } from '@prisma/client';
import { TasksService } from './tasks.service';
import { TaskSchedulerService } from './task-scheduler.service';
import { CreateTaskDto, UpdateTaskStatusDto, UpdateTaskDto } from './tasks.dto';

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
    @Query('dueDate') dueDate: string,
  ) {
    return this.tasksService.findAll({ status, type, dueDate });
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
}
