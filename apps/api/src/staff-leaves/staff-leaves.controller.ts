import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { StaffLeavesService } from './staff-leaves.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('staff-leaves')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StaffLeavesController {
  constructor(private readonly service: StaffLeavesService) {}

  // All leaves (with filters)
  @Get()
  @Roles(Role.FOUNDER, Role.ADMIN, Role.STAFF)
  findAll(
    @Query('staffId') staffId?: string,
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('year') year?: string,
    @Query('homeId') homeId?: string,
  ) {
    return this.service.findAll({
      staffId,
      status,
      type,
      year: year ? parseInt(year) : undefined,
      homeId,
    });
  }

  // Leaves for a specific staff member
  @Get('staff/:staffId')
  @Roles(Role.FOUNDER, Role.ADMIN, Role.STAFF)
  findByStaff(
    @Param('staffId') staffId: string,
    @Query('year') year?: string,
  ) {
    return this.service.findByStaff(staffId, year ? parseInt(year) : undefined);
  }

  // Summary for a specific staff member (approved leave days by type)
  @Get('staff/:staffId/summary')
  @Roles(Role.FOUNDER, Role.ADMIN, Role.STAFF)
  getSummary(
    @Param('staffId') staffId: string,
    @Query('year') year?: string,
  ) {
    const y = year ? parseInt(year) : new Date().getFullYear();
    return this.service.getSummary(staffId, y);
  }

  // Create a leave request
  @Post()
  @Roles(Role.FOUNDER, Role.ADMIN, Role.STAFF)
  create(
    @Body() body: {
      staffId: string;
      type: string;
      startDate: string;
      endDate: string;
      days: number;
      reason?: string;
    },
  ) {
    return this.service.create(body);
  }

  // Approve / Reject a leave
  @Patch(':id/status')
  @Roles(Role.FOUNDER, Role.ADMIN)
  updateStatus(
    @Param('id') id: string,
    @Body() body: { status: 'APPROVED' | 'REJECTED' | 'PENDING'; notes?: string },
  ) {
    return this.service.updateStatus(id, body.status, body.notes);
  }

  // Delete a leave record
  @Delete(':id')
  @Roles(Role.FOUNDER, Role.ADMIN)
  delete(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
