import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { Role, FamilyRelationType, OccasionType, AuditAction } from '@prisma/client';

export interface UserContext {
  id: string;
  email: string;
  name: string;
  role: Role;
}

interface CreateFamilyMemberDto {
  name: string;
  relationType: FamilyRelationType;
  birthMonth?: number;  // 1-12
  birthDay?: number;    // 1-31
  phone?: string;
  email?: string;
  notes?: string;
}

interface UpdateFamilyMemberDto {
  name?: string;
  relationType?: FamilyRelationType;
  birthMonth?: number;  // 1-12
  birthDay?: number;    // 1-31
  phone?: string;
  email?: string;
  notes?: string;
}

interface CreateSpecialOccasionDto {
  type: OccasionType;
  month: number;        // 1-12
  day: number;          // 1-31
  relatedPersonName?: string;
  notes?: string;
}

interface UpdateSpecialOccasionDto {
  type?: OccasionType;
  month?: number;       // 1-12
  day?: number;         // 1-31
  relatedPersonName?: string;
  notes?: string;
}

@Injectable()
export class DonorRelationsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  private canEdit(user: UserContext): boolean {
    return user.role === Role.FOUNDER || user.role === Role.ADMIN || user.role === Role.STAFF;
  }

  private normalizeName(name: string): string {
    return name.trim().toLowerCase().replace(/\s+/g, ' ');
  }

  private validateMonthDay(month: number | undefined | null, day: number | undefined | null, required: boolean = false): void {
    if (required) {
      if (month === undefined || month === null) {
        throw new BadRequestException('Month is required');
      }
      if (day === undefined || day === null) {
        throw new BadRequestException('Day is required');
      }
    }
    
    if (month !== undefined && month !== null) {
      if (month < 1 || month > 12) {
        throw new BadRequestException('Month must be between 1 and 12');
      }
    }
    
    if (day !== undefined && day !== null) {
      if (day < 1 || day > 31) {
        throw new BadRequestException('Day must be between 1 and 31');
      }
    }
  }

  private async verifyDonorAccess(user: UserContext, donorId: string): Promise<void> {
    const donor = await this.prisma.donor.findFirst({
      where: {
        id: donorId,
        isDeleted: false,
      },
      select: { id: true, assignedToUserId: true },
    });

    if (!donor) {
      throw new NotFoundException('Donor not found');
    }

  }

  async getFamilyMembers(user: UserContext, donorId: string) {
    await this.verifyDonorAccess(user, donorId);
    
    return this.prisma.donorFamilyMember.findMany({
      where: { donorId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createFamilyMember(
    user: UserContext,
    donorId: string,
    data: CreateFamilyMemberDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    if (!this.canEdit(user)) {
      throw new ForbiddenException('You do not have permission to add family members');
    }

    // Validate month/day ranges (optional for family members)
    this.validateMonthDay(data.birthMonth, data.birthDay, false);

    await this.verifyDonorAccess(user, donorId);

    // Duplicate check: same name + relation + birthMonth + birthDay for this donor
    const existingMembers = await this.prisma.donorFamilyMember.findMany({
      where: { donorId },
      select: { id: true, name: true, relationType: true, birthMonth: true, birthDay: true },
    });
    const normalizedIncoming = this.normalizeName(data.name);
    const isDuplicate = existingMembers.some(
      (m) =>
        this.normalizeName(m.name) === normalizedIncoming &&
        m.relationType === data.relationType &&
        m.birthMonth === (data.birthMonth ?? null) &&
        m.birthDay === (data.birthDay ?? null),
    );
    if (isDuplicate) {
      throw new BadRequestException(
        'Duplicate entry not allowed. This person already has the same occasion on the same date.',
      );
    }

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
      action: AuditAction.DONOR_UPDATE,
      entityType: 'DonorFamilyMember',
      entityId: member.id,
      newValue: member,
      ipAddress,
      userAgent,
      metadata: { donorId, action: 'family_member_created' },
    });

    return member;
  }

  async updateFamilyMember(
    user: UserContext,
    memberId: string,
    data: UpdateFamilyMemberDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    if (!this.canEdit(user)) {
      throw new ForbiddenException('You do not have permission to edit family members');
    }

    // Validate month/day ranges (optional for family members)
    this.validateMonthDay(data.birthMonth, data.birthDay, false);

    const existing = await this.prisma.donorFamilyMember.findUnique({
      where: { id: memberId },
    });

    if (!existing) {
      throw new NotFoundException('Family member not found');
    }

    await this.verifyDonorAccess(user, existing.donorId);

    // Duplicate check: resolve final values, then check siblings (exclude self)
    const finalName = data.name !== undefined ? data.name : existing.name;
    const finalRelationType = data.relationType !== undefined ? data.relationType : existing.relationType;
    const finalBirthMonth = data.birthMonth !== undefined ? data.birthMonth : existing.birthMonth;
    const finalBirthDay = data.birthDay !== undefined ? data.birthDay : existing.birthDay;

    const siblings = await this.prisma.donorFamilyMember.findMany({
      where: { donorId: existing.donorId, id: { not: memberId } },
      select: { id: true, name: true, relationType: true, birthMonth: true, birthDay: true },
    });
    const normalizedFinal = this.normalizeName(finalName);
    const isDuplicateUpdate = siblings.some(
      (m) =>
        this.normalizeName(m.name) === normalizedFinal &&
        m.relationType === finalRelationType &&
        m.birthMonth === (finalBirthMonth ?? null) &&
        m.birthDay === (finalBirthDay ?? null),
    );
    if (isDuplicateUpdate) {
      throw new BadRequestException(
        'Duplicate entry not allowed. This person already has the same occasion on the same date.',
      );
    }

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.relationType !== undefined) updateData.relationType = data.relationType;
    if (data.birthMonth !== undefined) updateData.birthMonth = data.birthMonth;
    if (data.birthDay !== undefined) updateData.birthDay = data.birthDay;
    if (data.phone !== undefined) updateData.phone = data.phone || null;
    if (data.email !== undefined) updateData.email = data.email || null;
    if (data.notes !== undefined) updateData.notes = data.notes || null;

    const updated = await this.prisma.donorFamilyMember.update({
      where: { id: memberId },
      data: updateData,
    });

    await this.auditService.log({
      userId: user.id,
      action: AuditAction.DONOR_UPDATE,
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

  async deleteFamilyMember(
    user: UserContext,
    memberId: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    if (!this.canEdit(user)) {
      throw new ForbiddenException('You do not have permission to delete family members');
    }

    const existing = await this.prisma.donorFamilyMember.findUnique({
      where: { id: memberId },
    });

    if (!existing) {
      throw new NotFoundException('Family member not found');
    }

    await this.verifyDonorAccess(user, existing.donorId);

    await this.prisma.donorFamilyMember.delete({
      where: { id: memberId },
    });

    await this.auditService.log({
      userId: user.id,
      action: AuditAction.DONOR_UPDATE,
      entityType: 'DonorFamilyMember',
      entityId: memberId,
      oldValue: existing,
      ipAddress,
      userAgent,
      metadata: { donorId: existing.donorId, action: 'family_member_deleted' },
    });

    return { success: true };
  }

  async getSpecialOccasions(user: UserContext, donorId: string) {
    await this.verifyDonorAccess(user, donorId);

    return this.prisma.donorSpecialOccasion.findMany({
      where: { donorId },
      orderBy: [{ month: 'asc' }, { day: 'asc' }],
    });
  }

  async createSpecialOccasion(
    user: UserContext,
    donorId: string,
    data: CreateSpecialOccasionDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    if (!this.canEdit(user)) {
      throw new ForbiddenException('You do not have permission to add special occasions');
    }

    // Validate month/day ranges (required for special occasions)
    this.validateMonthDay(data.month, data.day, true);

    await this.verifyDonorAccess(user, donorId);

    // Duplicate check: same relatedPersonName + type + month + day for this donor
    const existingOccasions = await this.prisma.donorSpecialOccasion.findMany({
      where: { donorId },
      select: { id: true, type: true, month: true, day: true, relatedPersonName: true },
    });
    const normalizedIncomingName = this.normalizeName(data.relatedPersonName || '');
    const isDuplicateOccasion = existingOccasions.some(
      (o) =>
        this.normalizeName(o.relatedPersonName || '') === normalizedIncomingName &&
        o.type === data.type &&
        o.month === data.month &&
        o.day === data.day,
    );
    if (isDuplicateOccasion) {
      throw new BadRequestException(
        'Duplicate entry not allowed. This person already has the same occasion on the same date.',
      );
    }

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
      action: AuditAction.DONOR_UPDATE,
      entityType: 'DonorSpecialOccasion',
      entityId: occasion.id,
      newValue: occasion,
      ipAddress,
      userAgent,
      metadata: { donorId, action: 'special_occasion_created' },
    });

    return occasion;
  }

  async updateSpecialOccasion(
    user: UserContext,
    occasionId: string,
    data: UpdateSpecialOccasionDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    if (!this.canEdit(user)) {
      throw new ForbiddenException('You do not have permission to edit special occasions');
    }

    // Validate month/day ranges if provided (not required for updates)
    this.validateMonthDay(data.month, data.day, false);

    const existing = await this.prisma.donorSpecialOccasion.findUnique({
      where: { id: occasionId },
    });

    if (!existing) {
      throw new NotFoundException('Special occasion not found');
    }

    await this.verifyDonorAccess(user, existing.donorId);

    // Duplicate check: resolve final values, then check siblings (exclude self)
    const finalType = data.type !== undefined ? data.type : existing.type;
    const finalMonth = data.month !== undefined ? data.month : existing.month;
    const finalDay = data.day !== undefined ? data.day : existing.day;
    const finalPersonName = data.relatedPersonName !== undefined
      ? (data.relatedPersonName || '')
      : (existing.relatedPersonName || '');

    const occasionSiblings = await this.prisma.donorSpecialOccasion.findMany({
      where: { donorId: existing.donorId, id: { not: occasionId } },
      select: { id: true, type: true, month: true, day: true, relatedPersonName: true },
    });
    const normalizedFinalName = this.normalizeName(finalPersonName);
    const isDuplicateOccasionUpdate = occasionSiblings.some(
      (o) =>
        this.normalizeName(o.relatedPersonName || '') === normalizedFinalName &&
        o.type === finalType &&
        o.month === finalMonth &&
        o.day === finalDay,
    );
    if (isDuplicateOccasionUpdate) {
      throw new BadRequestException(
        'Duplicate entry not allowed. This person already has the same occasion on the same date.',
      );
    }

    const updateData: any = {};
    if (data.type !== undefined) updateData.type = data.type;
    if (data.month !== undefined) updateData.month = data.month;
    if (data.day !== undefined) updateData.day = data.day;
    if (data.relatedPersonName !== undefined) updateData.relatedPersonName = data.relatedPersonName || null;
    if (data.notes !== undefined) updateData.notes = data.notes || null;

    const updated = await this.prisma.donorSpecialOccasion.update({
      where: { id: occasionId },
      data: updateData,
    });

    await this.auditService.log({
      userId: user.id,
      action: AuditAction.DONOR_UPDATE,
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

  async deleteSpecialOccasion(
    user: UserContext,
    occasionId: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    if (!this.canEdit(user)) {
      throw new ForbiddenException('You do not have permission to delete special occasions');
    }

    const existing = await this.prisma.donorSpecialOccasion.findUnique({
      where: { id: occasionId },
    });

    if (!existing) {
      throw new NotFoundException('Special occasion not found');
    }

    await this.verifyDonorAccess(user, existing.donorId);

    await this.prisma.donorSpecialOccasion.delete({
      where: { id: occasionId },
    });

    await this.auditService.log({
      userId: user.id,
      action: AuditAction.DONOR_UPDATE,
      entityType: 'DonorSpecialOccasion',
      entityId: occasionId,
      oldValue: existing,
      ipAddress,
      userAgent,
      metadata: { donorId: existing.donorId, action: 'special_occasion_deleted' },
    });

    return { success: true };
  }

  async getUpcomingSpecialOccasions(user: UserContext, donorId: string, days: number = 30) {
    await this.verifyDonorAccess(user, donorId);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + days);

    const occasions = await this.prisma.donorSpecialOccasion.findMany({
      where: { donorId },
    });

    return occasions.filter((occasion) => {
      // Build date for this year using month/day
      let thisYearDate = new Date(today.getFullYear(), occasion.month - 1, occasion.day);
      
      // If this year's date has passed, use next year's
      if (thisYearDate < today) {
        thisYearDate = new Date(today.getFullYear() + 1, occasion.month - 1, occasion.day);
      }

      return thisYearDate >= today && thisYearDate <= endDate;
    }).map((occasion) => {
      // Build next occurrence date
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
}
