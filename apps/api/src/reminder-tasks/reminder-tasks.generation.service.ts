import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ReminderTaskType, ReminderTaskStatus, EmailJobType } from '@prisma/client';
import {
  mapOccasionTypeToReminderType,
  getOccasionTitle,
  getFamilyBirthdayTitle,
  calculateNextOccurrence,
  subtractDays,
} from './reminder-tasks.helpers';
import { ReminderTasksCommunicationService } from './reminder-tasks.communication.service';

@Injectable()
export class ReminderTasksGenerationService {
  private readonly logger = new Logger(ReminderTasksGenerationService.name);

  constructor(
    private prisma: PrismaService,
    private communicationService: ReminderTasksCommunicationService,
  ) {}

  async generateSpecialDayReminders(): Promise<number> {
    this.logger.log('Starting special day reminder generation...');

    const donors = await this.prisma.donor.findMany({
      where: { isDeleted: false, prefReminders: true },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        primaryPhone: true,
        primaryPhoneCode: true,
        whatsappPhone: true,
        personalEmail: true,
        officialEmail: true,
        prefReminders: true,
        specialOccasions: true,
        familyMembers: {
          where: {
            birthMonth: { not: null },
            birthDay: { not: null },
          },
        },
      },
    });

    let createdCount = 0;
    const offsets = [30, 15, 7, 2, 0];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const donor of donors) {
      for (const occasion of donor.specialOccasions) {
        const nextOccurrence = calculateNextOccurrence(occasion.month, occasion.day);
        const reminderType = mapOccasionTypeToReminderType(occasion.type);

        for (const offset of offsets) {
          const dueDate = subtractDays(nextOccurrence, offset);

          if (dueDate < today) continue;

          const thirtyDaysFromNow = new Date(today);
          thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 35);
          if (dueDate > thirtyDaysFromNow) continue;

          try {
            const reminderTask = await this.prisma.reminderTask.upsert({
              where: {
                unique_occasion_reminder: {
                  donorId: donor.id,
                  sourceOccasionId: occasion.id,
                  offsetDays: offset,
                },
              },
              update: {
                title: getOccasionTitle(occasion, offset),
                dueDate: dueDate,
              },
              create: {
                donorId: donor.id,
                type: reminderType,
                title: getOccasionTitle(occasion, offset),
                dueDate: dueDate,
                status: ReminderTaskStatus.OPEN,
                sourceOccasionId: occasion.id,
                offsetDays: offset,
              },
            });
            createdCount++;

            if (offset === 0) {
              await this.communicationService.queueEmailJob(
                donor,
                EmailJobType.SPECIAL_DAY,
                getOccasionTitle(occasion, offset),
                dueDate,
                reminderTask.id,
              );
              await this.communicationService.sendAutoWhatsApp(donor, 'SPECIAL_DAY_WISH', {
                '2': getOccasionTitle(occasion, offset),
              });
            }
          } catch (error: any) {
            if (error.code !== 'P2002') {
              this.logger.error(
                `Error creating reminder for donor ${donor.id}: ${error.message}`,
              );
            }
          }
        }
      }

      for (const familyMember of donor.familyMembers) {
        if (!familyMember.birthMonth || !familyMember.birthDay) continue;

        const nextOccurrence = calculateNextOccurrence(
          familyMember.birthMonth,
          familyMember.birthDay,
        );

        for (const offset of offsets) {
          const dueDate = subtractDays(nextOccurrence, offset);

          if (dueDate < today) continue;

          const thirtyDaysFromNow = new Date(today);
          thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 35);
          if (dueDate > thirtyDaysFromNow) continue;

          try {
            const reminderTask = await this.prisma.reminderTask.upsert({
              where: {
                unique_family_reminder: {
                  donorId: donor.id,
                  sourceFamilyId: familyMember.id,
                  offsetDays: offset,
                },
              },
              update: {
                title: getFamilyBirthdayTitle(familyMember, offset),
                dueDate: dueDate,
              },
              create: {
                donorId: donor.id,
                type: ReminderTaskType.FAMILY_BIRTHDAY,
                title: getFamilyBirthdayTitle(familyMember, offset),
                dueDate: dueDate,
                status: ReminderTaskStatus.OPEN,
                sourceFamilyId: familyMember.id,
                offsetDays: offset,
              },
            });
            createdCount++;

            if (offset === 0) {
              await this.communicationService.queueEmailJob(
                donor,
                EmailJobType.SPECIAL_DAY,
                getFamilyBirthdayTitle(familyMember, offset),
                dueDate,
                reminderTask.id,
              );
              await this.communicationService.sendAutoWhatsApp(donor, 'SPECIAL_DAY_WISH', {
                '2': getFamilyBirthdayTitle(familyMember, offset),
              });
            }
          } catch (error: any) {
            if (error.code !== 'P2002') {
              this.logger.error(
                `Error creating family reminder for donor ${donor.id}: ${error.message}`,
              );
            }
          }
        }
      }
    }

    this.logger.log(`Generated ${createdCount} reminder tasks`);
    return createdCount;
  }
}
