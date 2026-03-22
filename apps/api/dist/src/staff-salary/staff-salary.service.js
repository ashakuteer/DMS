"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StaffSalaryService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let StaffSalaryService = class StaffSalaryService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getSalaryStructure(staffId) {
        const staff = await this.prisma.staff.findUnique({ where: { id: staffId } });
        if (!staff)
            throw new common_1.NotFoundException('Staff member not found');
        const salary = await this.prisma.staffSalary.findUnique({ where: { staffId } });
        return salary;
    }
    async upsertSalaryStructure(staffId, data) {
        const staff = await this.prisma.staff.findUnique({ where: { id: staffId } });
        if (!staff)
            throw new common_1.NotFoundException('Staff member not found');
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
    async getPayments(staffId, year) {
        const staff = await this.prisma.staff.findUnique({ where: { id: staffId } });
        if (!staff)
            throw new common_1.NotFoundException('Staff member not found');
        const where = { staffId };
        if (year)
            where.year = year;
        return this.prisma.salaryPayment.findMany({
            where,
            orderBy: [{ year: 'desc' }, { month: 'desc' }],
        });
    }
    async recordPayment(staffId, data) {
        const staff = await this.prisma.staff.findUnique({ where: { id: staffId } });
        if (!staff)
            throw new common_1.NotFoundException('Staff member not found');
        const existing = await this.prisma.salaryPayment.findUnique({
            where: { staffId_month_year: { staffId, month: data.month, year: data.year } },
        });
        if (existing) {
            throw new common_1.ConflictException(`Payment for ${data.month}/${data.year} already recorded`);
        }
        const netSalary = (data.baseSalary || 0) + (data.allowances || 0) - (data.deductions || 0);
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
    async deletePayment(paymentId) {
        const payment = await this.prisma.salaryPayment.findUnique({ where: { id: paymentId } });
        if (!payment)
            throw new common_1.NotFoundException('Payment record not found');
        return this.prisma.salaryPayment.delete({ where: { id: paymentId } });
    }
    async getPayrollOverview(homeId) {
        const where = { status: 'ACTIVE' };
        if (homeId)
            where.homeId = homeId;
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
};
exports.StaffSalaryService = StaffSalaryService;
exports.StaffSalaryService = StaffSalaryService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], StaffSalaryService);
//# sourceMappingURL=staff-salary.service.js.map