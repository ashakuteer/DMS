import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { MilestonesService } from './milestones.service';
import { CreateMilestoneDto, UpdateMilestoneDto } from './milestones.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators';
import { Role } from '@prisma/client';

@Controller('milestones')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MilestonesController {
  constructor(private readonly milestonesService: MilestonesService) {}

  @Get()
  findAll(@CurrentUser() user: any) {
    const includePrivate = user.role === 'ADMIN' || user.role === 'STAFF';
    return this.milestonesService.findAll(includePrivate);
  }

  @Get('for-communication')
  @Roles(Role.ADMIN)
  getForCommunication() {
    return this.milestonesService.getForCommunication();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.milestonesService.findOne(id);
  }

  @Post()
  @Roles(Role.ADMIN)
  create(@CurrentUser() user: any, @Body() dto: CreateMilestoneDto) {
    return this.milestonesService.create(user, dto);
  }

  @Post('seed')
  @Roles(Role.ADMIN)
  seed(@CurrentUser() user: any) {
    return this.milestonesService.seed(user.id);
  }

  @Put(':id')
  @Roles(Role.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateMilestoneDto) {
    return this.milestonesService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.milestonesService.remove(id);
  }
}
