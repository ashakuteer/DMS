import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { StaffAttendanceService } from './staff-attendance.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('staff-attendance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StaffAttendanceController {
  constructor(private readonly service: StaffAttendanceService) {}

  // All attendance records (filterable)
  @Get()
  @Roles(Role.FOUNDER, Role.ADMIN, Role.STAFF)
  findAll(
    @Query('date') date?: string,
    @Query('staffId') staffId?: string,
    @Query('homeId') homeId?: string,
    @Query('month') month?: string,
    @Query('year') year?: string,
  ) {
    return this.service.findAll({ date, staffId, homeId, month, year });
  }

  // Today's summary card counts
  @Get('today-summary')
  @Roles(Role.FOUNDER, Role.ADMIN, Role.STAFF)
  getTodaySummary(@Query('homeId') homeId?: string) {
    return this.service.getTodaySummary(homeId);
  }

  // Monthly summary for a specific staff
  @Get('staff/:staffId/monthly')
  @Roles(Role.FOUNDER, Role.ADMIN, Role.STAFF)
  getMonthlySummary(
    @Param('staffId') staffId: string,
    @Query('year') year?: string,
    @Query('month') month?: string,
  ) {
    const y = year ? parseInt(year) : new Date().getFullYear();
    const m = month ? parseInt(month) : new Date().getMonth() + 1;
    return this.service.getMonthlySummary(staffId, y, m);
  }

  // Create single attendance record
  @Post()
  @Roles(Role.FOUNDER, Role.ADMIN)
  create(
    @Body() body: {
      staffId: string;
      date: string;
      status: string;
      checkIn?: string;
      checkOut?: string;
      notes?: string;
    },
  ) {
    return this.service.create(body);
  }

  // Bulk attendance entry for a given date
  @Post('bulk')
  @Roles(Role.FOUNDER, Role.ADMIN)
  bulkCreate(
    @Body() body: {
      date: string;
      entries: { staffId: string; status: string; checkIn?: string; checkOut?: string; notes?: string }[];
    },
  ) {
    return this.service.bulkCreate(body.date, body.entries);
  }

  // Update a single attendance record
  @Patch(':id')
  @Roles(Role.FOUNDER, Role.ADMIN)
  update(
    @Param('id') id: string,
    @Body() body: { status?: string; checkIn?: string | null; checkOut?: string | null; notes?: string | null },
  ) {
    return this.service.update(id, body);
  }

  // Delete a single attendance record
  @Delete(':id')
  @Roles(Role.FOUNDER, Role.ADMIN)
  delete(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
