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
exports.DonorRelationsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const client_1 = require("@prisma/client");
let DonorRelationsService = class DonorRelationsService {
    constructor(prisma, auditService) {
        this.prisma = prisma;
        this.auditService = auditService;
    }
    canEdit(user) {
        return user.role === client_1.Role.FOUNDER || user.role === client_1.Role.ADMIN || user.role === client_1.Role.STAFF;
    }
    validateMonthDay(month, day, required = false) {
        if (required) {
            if (month === undefined || month === null) {
                throw new common_1.BadRequestException('Month is required');
            }
            if (day === undefined || day === null) {
                throw new common_1.BadRequestException('Day is required');
            }
        }
        if (month !== undefined && month !== null) {
            if (month < 1 || month > 12) {
                throw new common_1.BadRequestException('Month must be between 1 and 12');
            }
        }
        if (day !== undefined && day !== null) {
            if (day < 1 || day > 31) {
                throw new common_1.BadRequestException('Day must be between 1 and 31');
            }
        }
    }
    async verifyDonorAccess(user, donorId) {
        const donor = await this.prisma.donor.findFirst({
            where: {
                id: donorId,
                isDeleted: false,
            },
            select: { id: true, assignedToUserId: true },
        });
        if (!donor) {
            throw new common_1.NotFoundException('Donor not found');
        }
    }
    async getFamilyMembers(user, donorId) {
        await this.verifyDonorAccess(user, donorId);
        return this.prisma.donorFamilyMember.findMany({
            where: { donorId },
            orderBy: { createdAt: 'desc' },
        });
    }
    async createFamilyMember(user, donorId, data, ipAddress, userAgent) {
        if (!this.canEdit(user)) {
            throw new common_1.ForbiddenException('You do not have permission to add family members');
        }
        this.validateMonthDay(data.birthMonth, data.birthDay, false);
        await this.verifyDonorAccess(user, donorId);
        const member = await this.prisma.donorFamilyMember.create({
            data: {
                donorId,
                name: data.name,
                relationType: data.relationType,
                birthMonth: data.birthMonth ?? null,
                birthDay: data.birthDay ?? null,
                phone: data.phone || null,
                email: data.email || null,
                notes: data.notes || null,
            },
        });
        await this.auditService.log({
            userId: user.id,
            action: client_1.AuditAction.DONOR_UPDATE,
            entityType: 'DonorFamilyMember',
            entityId: member.id,
            newValue: member,
            ipAddress,
            userAgent,
            metadata: { donorId, action: 'family_member_created' },
        });
        return member;
    }
    async updateFamilyMember(user, memberId, data, ipAddress, userAgent) {
        if (!this.canEdit(user)) {
            throw new common_1.ForbiddenException('You do not have permission to edit family members');
        }
        this.validateMonthDay(data.birthMonth, data.birthDay, false);
        const existing = await this.prisma.donorFamilyMember.findUnique({
            where: { id: memberId },
        });
        if (!existing) {
            throw new common_1.NotFoundException('Family member not found');
        }
        await this.verifyDonorAccess(user, existing.donorId);
        const updateData = {};
        if (data.name !== undefined)
            updateData.name = data.name;
        if (data.relationType !== undefined)
            updateData.relationType = data.relationType;
        if (data.birthMonth !== undefined)
            updateData.birthMonth = data.birthMonth;
        if (data.birthDay !== undefined)
            updateData.birthDay = data.birthDay;
        if (data.phone !== undefined)
            updateData.phone = data.phone || null;
        if (data.email !== undefined)
            updateData.email = data.email || null;
        if (data.notes !== undefined)
            updateData.notes = data.notes || null;
        const updated = await this.prisma.donorFamilyMember.update({
            where: { id: memberId },
            data: updateData,
        });
        await this.auditService.log({
            userId: user.id,
            action: client_1.AuditAction.DONOR_UPDATE,
            entityType: 'DonorFamilyMember',
            entityId: memberId,
            oldValue: existing,
            newValue: updated,
            ipAddress,
            userAgent,
            metadata: { donorId: existing.donorId, action: 'family_member_updated' },
        });
        return updated;
    }
    async deleteFamilyMember(user, memberId, ipAddress, userAgent) {
        if (!this.canEdit(user)) {
            throw new common_1.ForbiddenException('You do not have permission to delete family members');
        }
        const existing = await this.prisma.donorFamilyMember.findUnique({
            where: { id: memberId },
        });
        if (!existing) {
            throw new common_1.NotFoundException('Family member not found');
        }
        await this.verifyDonorAccess(user, existing.donorId);
        await this.prisma.donorFamilyMember.delete({
            where: { id: memberId },
        });
        await this.auditService.log({
            userId: user.id,
            action: client_1.AuditAction.DONOR_UPDATE,
            entityType: 'DonorFamilyMember',
            entityId: memberId,
            oldValue: existing,
            ipAddress,
            userAgent,
            metadata: { donorId: existing.donorId, action: 'family_member_deleted' },
        });
        return { success: true };
    }
    async getSpecialOccasions(user, donorId) {
        await this.verifyDonorAccess(user, donorId);
        return this.prisma.donorSpecialOccasion.findMany({
            where: { donorId },
            orderBy: [{ month: 'asc' }, { day: 'asc' }],
        });
    }
    async createSpecialOccasion(user, donorId, data, ipAddress, userAgent) {
        if (!this.canEdit(user)) {
            throw new common_1.ForbiddenException('You do not have permission to add special occasions');
        }
        this.validateMonthDay(data.month, data.day, true);
        await this.verifyDonorAccess(user, donorId);
        const occasion = await this.prisma.donorSpecialOccasion.create({
            data: {
                donorId,
                type: data.type,
                month: data.month,
                day: data.day,
                relatedPersonName: data.relatedPersonName || null,
                notes: data.notes || null,
            },
        });
        await this.auditService.log({
            userId: user.id,
            action: client_1.AuditAction.DONOR_UPDATE,
            entityType: 'DonorSpecialOccasion',
            entityId: occasion.id,
            newValue: occasion,
            ipAddress,
            userAgent,
            metadata: { donorId, action: 'special_occasion_created' },
        });
        return occasion;
    }
    async updateSpecialOccasion(user, occasionId, data, ipAddress, userAgent) {
        if (!this.canEdit(user)) {
            throw new common_1.ForbiddenException('You do not have permission to edit special occasions');
        }
        this.validateMonthDay(data.month, data.day, false);
        const existing = await this.prisma.donorSpecialOccasion.findUnique({
            where: { id: occasionId },
        });
        if (!existing) {
            throw new common_1.NotFoundException('Special occasion not found');
        }
        await this.verifyDonorAccess(user, existing.donorId);
        const updateData = {};
        if (data.type !== undefined)
            updateData.type = data.type;
        if (data.month !== undefined)
            updateData.month = data.month;
        if (data.day !== undefined)
            updateData.day = data.day;
        if (data.relatedPersonName !== undefined)
            updateData.relatedPersonName = data.relatedPersonName || null;
        if (data.notes !== undefined)
            updateData.notes = data.notes || null;
        const updated = await this.prisma.donorSpecialOccasion.update({
            where: { id: occasionId },
            data: updateData,
        });
        await this.auditService.log({
            userId: user.id,
            action: client_1.AuditAction.DONOR_UPDATE,
            entityType: 'DonorSpecialOccasion',
            entityId: occasionId,
            oldValue: existing,
            newValue: updated,
            ipAddress,
            userAgent,
            metadata: { donorId: existing.donorId, action: 'special_occasion_updated' },
        });
        return updated;
    }
    async deleteSpecialOccasion(user, occasionId, ipAddress, userAgent) {
        if (!this.canEdit(user)) {
            throw new common_1.ForbiddenException('You do not have permission to delete special occasions');
        }
        const existing = await this.prisma.donorSpecialOccasion.findUnique({
            where: { id: occasionId },
        });
        if (!existing) {
            throw new common_1.NotFoundException('Special occasion not found');
        }
        await this.verifyDonorAccess(user, existing.donorId);
        await this.prisma.donorSpecialOccasion.delete({
            where: { id: occasionId },
        });
        await this.auditService.log({
            userId: user.id,
            action: client_1.AuditAction.DONOR_UPDATE,
            entityType: 'DonorSpecialOccasion',
            entityId: occasionId,
            oldValue: existing,
            ipAddress,
            userAgent,
            metadata: { donorId: existing.donorId, action: 'special_occasion_deleted' },
        });
        return { success: true };
    }
    async getUpcomingSpecialOccasions(user, donorId, days = 30) {
        await this.verifyDonorAccess(user, donorId);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const endDate = new Date(today);
        endDate.setDate(today.getDate() + days);
        const occasions = await this.prisma.donorSpecialOccasion.findMany({
            where: { donorId },
        });
        return occasions.filter((occasion) => {
            let thisYearDate = new Date(today.getFullYear(), occasion.month - 1, occasion.day);
            if (thisYearDate < today) {
                thisYearDate = new Date(today.getFullYear() + 1, occasion.month - 1, occasion.day);
            }
            return thisYearDate >= today && thisYearDate <= endDate;
        }).map((occasion) => {
            let nextOccurrence = new Date(today.getFullYear(), occasion.month - 1, occasion.day);
            if (nextOccurrence < today) {
                nextOccurrence = new Date(today.getFullYear() + 1, occasion.month - 1, occasion.day);
            }
            const daysUntil = Math.ceil((nextOccurrence.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            return {
                ...occasion,
                nextOccurrence: nextOccurrence.toISOString(),
                daysUntil,
            };
        }).sort((a, b) => a.daysUntil - b.daysUntil);
    }
};
exports.DonorRelationsService = DonorRelationsService;
exports.DonorRelationsService = DonorRelationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService])
], DonorRelationsService);
//# sourceMappingURL=donor-relations.service.js.map