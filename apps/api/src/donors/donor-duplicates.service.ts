import { Injectable } from "@nestjs/common";

@Injectable()
export class DuplicatesService {
import { Injectable, ForbiddenException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { Role, AuditAction } from '@prisma/client';

interface UserContext {
  id: string;
  email: string;
  role: Role;
}

export interface DuplicateGroup {
  matchType: string;
  matchValue: string;
  donors: {
    id: string;
    donorCode: string;
    firstName: string;
    lastName?: string;
    primaryPhone?: string;
    personalEmail?: string;
    createdAt: Date;
    donationCount: number;
    totalDonations: number;
  }[];
}

@Injectable()
export class DonorDuplicatesService {
  private readonly logger = new Logger(DonorDuplicatesService.name);

  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async findDuplicates(user: UserContext): Promise<DuplicateGroup[]> {
    if (user.role !== Role.ADMIN) {
      throw new ForbiddenException('Only admins can access duplicate detection');
    }

    try {
      this.logger.log('Starting optimized duplicate detection...');
      
      // Fetch only necessary data with aggregations done in DB
      const donors = await this.prisma.donor.findMany({
        where: { isDeleted: false },
        select: {
          id: true,
          donorCode: true,
          firstName: true,
          lastName: true,
          primaryPhone: true,
          personalEmail: true,
          officialEmail: true,
          createdAt: true,
          _count: {
            select: { donations: { where: { deletedAt: null } } },
          },
          donations: {
            where: { deletedAt: null },
            select: { donationAmount: true },
          },
        },
        orderBy: { createdAt: 'asc' },
      });

      const duplicateGroups: DuplicateGroup[] = [];
      const processedIds = new Set<string>();

      // Build phone and email maps more efficiently
      const phoneMap = new Map<string, typeof donors>();
      const emailMap = new Map<string, typeof donors>();

      // Single pass to build both maps
      for (const donor of donors) {
        if (donor.primaryPhone) {
          const cleanPhone = donor.primaryPhone.replace(/\D/g, '').slice(-10);
          if (cleanPhone.length >= 10) {
            const existing = phoneMap.get(cleanPhone) || [];
            existing.push(donor);
            phoneMap.set(cleanPhone, existing);
          }
        }

        const emails = [donor.personalEmail, donor.officialEmail].filter(Boolean);
        for (const email of emails) {
          const cleanEmail = email!.toLowerCase().trim();
          const existing = emailMap.get(cleanEmail) || [];
          existing.push(donor);
          emailMap.set(cleanEmail, existing);
        }
      }

      // Process phone duplicates
      for (const [phone, phoneDonors] of phoneMap) {
        if (phoneDonors.length > 1) {
          const uniqueDonors = phoneDonors.filter(d => !processedIds.has(d.id));

          if (uniqueDonors.length > 1) {
            uniqueDonors.forEach(d => processedIds.add(d.id));

            duplicateGroups.push({
              matchType: 'phone',
              matchValue: phone,
              donors: uniqueDonors.map(d => ({
                id: d.id,
                donorCode: d.donorCode,
                firstName: d.firstName,
                lastName: d.lastName || undefined,
                primaryPhone: d.primaryPhone || undefined,
                personalEmail: d.personalEmail || undefined,
                createdAt: d.createdAt,
                donationCount: d._count.donations,
                totalDonations: d.donations.reduce(
                  (sum, don) => sum + Number(don.donationAmount),
                  0,
                ),
              })),
            });
          }
        }
      }

      // Process email duplicates
      for (const [email, emailDonors] of emailMap) {
        if (emailDonors.length > 1) {
          const uniqueDonors = emailDonors.filter(d => !processedIds.has(d.id));
          if (uniqueDonors.length > 1) {
            uniqueDonors.forEach(d => processedIds.add(d.id));
            
            duplicateGroups.push({
              matchType: 'email',
              matchValue: email,
              donors: uniqueDonors.map(d => ({
                id: d.id,
                donorCode: d.donorCode,
                firstName: d.firstName,
                lastName: d.lastName || undefined,
                primaryPhone: d.primaryPhone || undefined,
                personalEmail: d.personalEmail || undefined,
                createdAt: d.createdAt,
                donationCount: d._count.donations,
                totalDonations: d.donations.reduce((sum, don) => sum + Number(don.donationAmount), 0),
              })),
            });
          }
        }
      }

      this.logger.log(`Duplicate detection complete. Found ${duplicateGroups.length} duplicate groups.`);
      return duplicateGroups;
    } catch (error) {
      this.logger.error('Error during duplicate detection', error);
      throw error;
    }
  }

  async mergeDonors(
    primaryDonorId: string,
    donorIdsToMerge: string[],
    user: UserContext,
  ): Promise<{
    success: boolean;
    primaryDonorId: string;
    mergedCount: number;
    donationsMoved: number;
    pledgesMoved: number;
    remindersMoved: number;
    communicationLogsMoved: number;
    familyMembersMoved: number;
    specialDaysMoved: number;
  }> {
    if (user.role !== Role.ADMIN) {
      throw new ForbiddenException('Only admins can merge donors');
    }

    if (!donorIdsToMerge.length) {
      throw new BadRequestException('No donors to merge');
    }

    if (donorIdsToMerge.includes(primaryDonorId)) {
      throw new BadRequestException('Primary donor cannot be in the merge list');
    }

    const primaryDonor = await this.prisma.donor.findUnique({
      where: { id: primaryDonorId, isDeleted: false },
    });

    if (!primaryDonor) {
      throw new BadRequestException('Primary donor not found');
    }

    const donorsToMerge = await this.prisma.donor.findMany({
      where: { id: { in: donorIdsToMerge }, isDeleted: false },
    });

    if (donorsToMerge.length !== donorIdsToMerge.length) {
      throw new BadRequestException('One or more donors to merge not found');
    }

    const mergeResult = await this.prisma.$transaction(async (tx) => {
      let donationsMoved = 0;
      let pledgesMoved = 0;
      let remindersMoved = 0;
      let communicationLogsMoved = 0;
      let familyMembersMoved = 0;
      let specialDaysMoved = 0;

      for (const donorId of donorIdsToMerge) {
        const donations = await tx.donation.updateMany({
          where: { donorId, deletedAt: null },
          data: { donorId: primaryDonorId },
        });
        donationsMoved += donations.count;

        const pledges = await tx.pledge.updateMany({
          where: { donorId, isDeleted: false },
          data: { donorId: primaryDonorId },
        });
        pledgesMoved += pledges.count;

        const reminders = await tx.reminderTask.updateMany({
          where: { donorId },
          data: { donorId: primaryDonorId },
        });
        remindersMoved += reminders.count;

        const commsLogs = await tx.communicationLog.updateMany({
          where: { donorId },
          data: { donorId: primaryDonorId },
        });
        communicationLogsMoved += commsLogs.count;

        const familyMembers = await tx.donorFamilyMember.updateMany({
          where: { donorId },
          data: { donorId: primaryDonorId },
        });
        familyMembersMoved += familyMembers.count;

        const specialDays = await tx.donorSpecialOccasion.updateMany({
          where: { donorId },
          data: { donorId: primaryDonorId },
        });
        specialDaysMoved += specialDays.count;

        await tx.donor.update({
          where: { id: donorId },
          data: {
            isDeleted: true,
            deletedAt: new Date(),
          },
        });
      }

      return {
        donationsMoved,
        pledgesMoved,
        remindersMoved,
        communicationLogsMoved,
        familyMembersMoved,
        specialDaysMoved,
      };
    });

    const mergedDonorCodes = donorsToMerge.map(d => d.donorCode).join(', ');
    const summary = `Merged ${donorsToMerge.length} donor(s) into ${primaryDonor.donorCode}. ` +
      `Moved: ${mergeResult.donationsMoved} donations, ${mergeResult.pledgesMoved} pledges, ` +
      `${mergeResult.remindersMoved} reminders, ${mergeResult.communicationLogsMoved} comm logs, ` +
      `${mergeResult.familyMembersMoved} family members, ${mergeResult.specialDaysMoved} special days.`;

    await this.auditService.log({
      userId: user.id,
      action: AuditAction.DONOR_MERGE,
      entityType: 'Donor',
      entityId: primaryDonorId,
      newValue: { mergedDonorCodes, summary },
    });

    this.logger.log(`Donor merge completed: ${summary}`);

    return {
      success: true,
      primaryDonorId,
      mergedCount: donorsToMerge.length,
      donationsMoved: mergeResult.donationsMoved,
      pledgesMoved: mergeResult.pledgesMoved,
      remindersMoved: mergeResult.remindersMoved,
      communicationLogsMoved: mergeResult.communicationLogsMoved,
      familyMembersMoved: mergeResult.familyMembersMoved,
      specialDaysMoved: mergeResult.specialDaysMoved,
    };
  }
}
