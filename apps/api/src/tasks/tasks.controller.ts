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
import { Role, TaskStatus } from '@prisma/client';
import { TasksService } from './tasks.service';
import { CreateTaskDto, UpdateTaskStatusDto } from './tasks.dto';

@Controller('tasks')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TasksController {
  constructor(private tasksService: TasksService) {}

  @Post()
  @Roles(Role.FOUNDER, Role.ADMIN, Role.STAFF)
  create(@Body() dto: CreateTaskDto) {
    return this.tasksService.create(dto);
  }

  @Get('today')
  @Roles(Role.FOUNDER, Role.ADMIN, Role.STAFF)
  getToday() {
    return this.tasksService.getToday();
  }

  @Get()
  @Roles(Role.FOUNDER, Role.ADMIN, Role.STAFF)
  findAll(
    @Query('status') status: string,
    @Query('type') type: string,
    @Query('dueDate') dueDate: string,
  ) {
    return this.tasksService.findAll({ status, type, dueDate });
  }

  @Patch(':id/status')
  @Roles(Role.FOUNDER, Role.ADMIN, Role.STAFF)
  updateStatus(@Param('id') id: string, @Body() dto: UpdateTaskStatusDto) {
    return this.tasksService.updateStatus(id, dto.status as TaskStatus);
  }
}
