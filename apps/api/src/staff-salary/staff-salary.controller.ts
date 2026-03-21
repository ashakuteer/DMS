import {
  Controller, Get, Post, Delete, Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { StaffSalaryService } from './staff-salary.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('staff-salary')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StaffSalaryController {
  constructor(private readonly service: StaffSalaryService) {}

  // ─── Payroll Overview ─────────────────────────────────────────────────────

  @Get('overview')
  @Roles(Role.FOUNDER, Role.ADMIN)
  getOverview(@Query('homeId') homeId?: string) {
    return this.service.getPayrollOverview(homeId);
  }

  // ─── Salary Structure ─────────────────────────────────────────────────────

  @Get(':staffId/structure')
  @Roles(Role.FOUNDER, Role.ADMIN, Role.STAFF)
  getSalaryStructure(@Param('staffId') staffId: string) {
    return this.service.getSalaryStructure(staffId);
  }

  @Post(':staffId/structure')
  @Roles(Role.FOUNDER, Role.ADMIN)
  upsertSalaryStructure(
    @Param('staffId') staffId: string,
    @Body() body: {
      baseSalary: number;
      allowances?: number;
      deductions?: number;
      effectiveFrom?: string;
      notes?: string;
    },
  ) {
    return this.service.upsertSalaryStructure(staffId, body);
  }

  // ─── Salary Payments ──────────────────────────────────────────────────────

  @Get(':staffId/payments')
  @Roles(Role.FOUNDER, Role.ADMIN, Role.STAFF)
  getPayments(
    @Param('staffId') staffId: string,
    @Query('year') year?: string,
  ) {
    return this.service.getPayments(staffId, year ? parseInt(year) : undefined);
  }

  @Post(':staffId/payments')
  @Roles(Role.FOUNDER, Role.ADMIN)
  recordPayment(
    @Param('staffId') staffId: string,
    @Body() body: {
      month: number;
      year: number;
      baseSalary: number;
      allowances?: number;
      deductions?: number;
      amountPaid: number;
      paymentDate?: string;
      paymentMode?: string;
      notes?: string;
    },
  ) {
    return this.service.recordPayment(staffId, body);
  }

  @Delete('payments/:paymentId')
  @Roles(Role.FOUNDER, Role.ADMIN)
  deletePayment(@Param('paymentId') paymentId: string) {
    return this.service.deletePayment(paymentId);
  }
}
