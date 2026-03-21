import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class StaffSalaryService {
  constructor(private prisma: PrismaService) {}

  // ─── Salary Structure ─────────────────────────────────────────────────────

  async getSalaryStructure(staffId: string) {
    const staff = await this.prisma.staff.findUnique({ where: { id: staffId } });
    if (!staff) throw new NotFoundException('Staff member not found');

    const salary = await this.prisma.staffSalary.findUnique({ where: { staffId } });
    return salary;
  }

  async upsertSalaryStructure(staffId: string, data: {
    baseSalary: number;
    allowances?: number;
    deductions?: number;
    effectiveFrom?: string;
    notes?: string;
  }) {
    const staff = await this.prisma.staff.findUnique({ where: { id: staffId } });
    if (!staff) throw new NotFoundException('Staff member not found');

    const net = (data.baseSalary || 0) + (data.allowances || 0) - (data.deductions || 0);

    return this.prisma.staffSalary.upsert({
      where: { staffId },
      create: {
        staffId,
        baseSalary: data.baseSalary,
        allowances: data.allowances ?? 0,
        deductions: data.deductions ?? 0,
        effectiveFrom: data.effectiveFrom ? new Date(data.effectiveFrom) : null,
        notes: data.notes ?? null,
      },
      update: {
        baseSalary: data.baseSalary,
        allowances: data.allowances ?? 0,
        deductions: data.deductions ?? 0,
        effectiveFrom: data.effectiveFrom ? new Date(data.effectiveFrom) : null,
        notes: data.notes ?? null,
      },
    });
  }

  // ─── Salary Payments ──────────────────────────────────────────────────────

  async getPayments(staffId: string, year?: number) {
    const staff = await this.prisma.staff.findUnique({ where: { id: staffId } });
    if (!staff) throw new NotFoundException('Staff member not found');

    const where: any = { staffId };
    if (year) where.year = year;

    return this.prisma.salaryPayment.findMany({
      where,
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });
  }

  async recordPayment(staffId: string, data: {
    month: number;
    year: number;
    baseSalary: number;
    allowances?: number;
    deductions?: number;
    amountPaid: number;
    paymentDate?: string;
    paymentMode?: string;
    notes?: string;
  }) {
    const staff = await this.prisma.staff.findUnique({ where: { id: staffId } });
    if (!staff) throw new NotFoundException('Staff member not found');

    const existing = await this.prisma.salaryPayment.findUnique({
      where: { staffId_month_year: { staffId, month: data.month, year: data.year } },
    });
    if (existing) {
      throw new ConflictException(`Payment for ${data.month}/${data.year} already recorded`);
    }

    const netSalary =
      (data.baseSalary || 0) + (data.allowances || 0) - (data.deductions || 0);

    return this.prisma.salaryPayment.create({
      data: {
        staffId,
        month: data.month,
        year: data.year,
        baseSalary: data.baseSalary,
        allowances: data.allowances ?? 0,
        deductions: data.deductions ?? 0,
        netSalary,
        amountPaid: data.amountPaid,
        paymentDate: data.paymentDate ? new Date(data.paymentDate) : null,
        paymentMode: data.paymentMode ?? 'BANK_TRANSFER',
        notes: data.notes ?? null,
      },
    });
  }

  async deletePayment(paymentId: string) {
    const payment = await this.prisma.salaryPayment.findUnique({ where: { id: paymentId } });
    if (!payment) throw new NotFoundException('Payment record not found');
    return this.prisma.salaryPayment.delete({ where: { id: paymentId } });
  }

  // ─── Payroll Overview ─────────────────────────────────────────────────────

  async getPayrollOverview(homeId?: string) {
    const where: any = { status: 'ACTIVE' };
    if (homeId) where.homeId = homeId;

    const staff = await this.prisma.staff.findMany({
      where,
      include: {
        home: true,
        salary: true,
        salaryPayments: {
          orderBy: [{ year: 'desc' }, { month: 'desc' }],
          take: 1,
        },
      },
      orderBy: { name: 'asc' },
    });

    return staff.map((s) => ({
      id: s.id,
      name: s.name,
      designation: s.designation,
      home: s.home,
      baseSalary: s.salary ? Number(s.salary.baseSalary) : null,
      allowances: s.salary ? Number(s.salary.allowances) : null,
      deductions: s.salary ? Number(s.salary.deductions) : null,
      netSalary: s.salary
        ? Number(s.salary.baseSalary) + Number(s.salary.allowances) - Number(s.salary.deductions)
        : null,
      lastPayment: s.salaryPayments[0] ?? null,
      hasSalary: !!s.salary,
    }));
  }
}
