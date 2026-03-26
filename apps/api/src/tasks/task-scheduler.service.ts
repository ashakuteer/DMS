import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import {
  TaskStatus,
  TaskType,
  TaskPriority,
  PledgeStatus,
  OccasionType,
  DonationFrequency,
} from '@prisma/client';

@Injectable()
export class TaskSchedulerService implements OnModuleInit {
  private readonly logger = new Logger(TaskSchedulerService.name);

  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    // Run generation on startup so tasks are always populated (e.g. after DB reset).
    // The deduplication checks inside each generator prevent duplicate tasks.
    this.logger.log('Startup: running donor task generation...');
    try {
      // Log how many donors have birthday data before generating
      const donorCount = await this.prisma.donor.count({ where: { isDeleted: false } });
      const donorWithDob = await this.prisma.donor.count({
        where: { dobMonth: { not: null }, dobDay: { not: null }, isDeleted: false },
      });
      const existingTaskCount = await this.prisma.task.count();
      this.logger.log(
        `Pre-generation state: ${donorCount} total donors, ${donorWithDob} with DOB, ${existingTaskCount} existing tasks in DB`,
      );
      await this.runDailyTaskGeneration();
      const afterCount = await this.prisma.task.count();
      this.logger.log(`Post-generation: ${afterCount} total tasks in DB`);
    } catch (err) {
      this.logger.error(`Startup task generation failed: ${err}`);
    }
  }

  @Cron('0 7 * * *')
  async runDailyTaskGeneration() {
    this.logger.log('Daily donor task generation started');
    const results = await Promise.allSettled([
      this.generateDonorDobBirthdayTasks(),      // PRIMARY: reads donor.dobMonth / donor.dobDay
      this.generateBirthdayTasks(),               // SECONDARY: reads donorSpecialOccasion (DOB_SELF/SPOUSE/CHILD)
      this.generateFamilyMemberBirthdayTasks(),   // family members tab birthday data
      this.generateAnniversaryTasks(),
      this.generateRemembranceTasks(),
      this.generatePledgeFollowUpTasks(),
      this.generateDonationFollowUpTasks(),
      this.generateSponsorUpdateTasks(),
      this.generateSmartDonationReminderTasks(),
    ]);
    const names = [
      'donor-dob-birthday', 'occasion-birthday', 'family-birthday',
      'anniversary', 'remembrance', 'pledge', 'donation-followup',
      'sponsor-update', 'smart-reminder',
    ];
    results.forEach((r, i) => {
      if (r.status === 'rejected') {
        this.logger.error(`${names[i]} task generation failed: ${r.reason}`);
      } else {
        this.logger.log(`${names[i]}: ${r.value} tasks created`);
      }
    });
    this.logger.log('Daily donor task generation complete');
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  private todayBounds(): { todayStart: Date; tomorrow: Date } {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const tomorrow = new Date(todayStart);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return { todayStart, tomorrow };
  }

  private autoWhatsApp(donor: { prefWhatsapp: boolean; whatsappPhone: string | null }): boolean {
    return !!(donor.prefWhatsapp && donor.whatsappPhone);
  }

  private futureDueDate(offsetDays: number): Date {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + offsetDays);
    return d;
  }

  // ─── Shared: next annual date within look-ahead window ─────────────────────

  /**
   * Given a month (1-12) and day (1-31), returns the next occurrence of that
   * calendar date at midnight local time, and the number of days until it.
   * If the date has already passed this year, returns next year's date.
   */
  private nextAnnualDate(month: number, day: number): { dueDate: Date; daysUntil: number } {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const year = today.getFullYear();
    let dueDate = new Date(year, month - 1, day, 0, 0, 0, 0);
    if (dueDate < today) {
      dueDate = new Date(year + 1, month - 1, day, 0, 0, 0, 0);
    }
    const daysUntil = Math.round((dueDate.getTime() - today.getTime()) / 86400000);
    return { dueDate, daysUntil };
  }

  // ─── 0. Donor DOB birthday tasks — reads from donor.dobMonth / donor.dobDay ──
  //        This is the PRIMARY source. Most donors have their birthday stored directly
  //        on the donor record (populated via the donor edit form or bulk import).
  //        Deduplication is on (donorId + BIRTHDAY type + dueDate) regardless of source,
  //        so it safely co-exists with the special-occasions generator below.

  async generateDonorDobBirthdayTasks(): Promise<number> {
    const LOOK_AHEAD_DAYS = 30;

    const donors = await this.prisma.donor.findMany({
      where: {
        dobMonth: { not: null },
        dobDay: { not: null },
        isDeleted: false,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        dobMonth: true,
        dobDay: true,
        prefWhatsapp: true,
        whatsappPhone: true,
      },
    });

    this.logger.log(`generateDonorDobBirthdayTasks: scanning ${donors.length} donors with DOB data`);

    let created = 0;
    for (const donor of donors) {
      if (!donor.dobMonth || !donor.dobDay) continue;

      const { dueDate, daysUntil } = this.nextAnnualDate(donor.dobMonth, donor.dobDay);
      if (daysUntil > LOOK_AHEAD_DAYS) continue;

      const nextDay = new Date(dueDate.getTime() + 86400000);

      // Deduplicate: any existing BIRTHDAY task for this donor on this dueDate
      // (regardless of sourceOccasionId — avoids double-task if special occasion also exists)
      const existing = await this.prisma.task.findFirst({
        where: {
          type: TaskType.BIRTHDAY,
          donorId: donor.id,
          dueDate: { gte: dueDate, lt: nextDay },
        },
      });

      if (!existing) {
        const donorName = [donor.firstName, donor.lastName].filter(Boolean).join(' ');
        await this.prisma.task.create({
          data: {
            title: `Birthday: ${donorName}`,
            type: TaskType.BIRTHDAY,
            priority: daysUntil <= 1 ? TaskPriority.HIGH : TaskPriority.MEDIUM,
            status: TaskStatus.PENDING,
            dueDate,
            donorId: donor.id,
            autoWhatsAppPossible: this.autoWhatsApp(donor),
            manualRequired: true,
          },
        });
        created++;
      }
    }

    this.logger.log(`generateDonorDobBirthdayTasks: created ${created} new birthday tasks`);
    return created;
  }

  // ─── 1. Birthday tasks — reads from donor_special_occasions (DOB_SELF / DOB_SPOUSE / DOB_CHILD)
  //        Secondary source: Special Days dialog entries. The DOB generator above already
  //        covers donor self-birthdays from donor.dobMonth/dobDay, so this handles
  //        spouse/child occasions and any DOB_SELF occasions entered via the dialog.

  async generateBirthdayTasks(): Promise<number> {
    const LOOK_AHEAD_DAYS = 30;

    // All birthday occasions: donor's own birthday (DOB_SELF) and
    // family member birthdays (DOB_SPOUSE, DOB_CHILD) stored by staff.
    const birthdayOccasions = await this.prisma.donorSpecialOccasion.findMany({
      where: {
        type: { in: [OccasionType.DOB_SELF, OccasionType.DOB_SPOUSE, OccasionType.DOB_CHILD] },
        donor: { isDeleted: false },
      },
      include: {
        donor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            prefWhatsapp: true,
            whatsappPhone: true,
          },
        },
      },
    });

    let created = 0;
    for (const occ of birthdayOccasions) {
      if (!occ.month || !occ.day) continue;

      const { dueDate, daysUntil } = this.nextAnnualDate(occ.month, occ.day);
      if (daysUntil > LOOK_AHEAD_DAYS) continue;

      const nextDay = new Date(dueDate.getTime() + 86400000);
      const existing = await this.prisma.task.findFirst({
        where: {
          type: TaskType.BIRTHDAY,
          donorId: occ.donorId,
          sourceOccasionId: occ.id,
          dueDate: { gte: dueDate, lt: nextDay },
        },
      });
      if (!existing) {
        const donorName = [occ.donor.firstName, occ.donor.lastName].filter(Boolean).join(' ');
        let title: string;
        if (occ.type === OccasionType.DOB_SELF) {
          title = `Birthday: ${donorName}`;
        } else if (occ.type === OccasionType.DOB_SPOUSE) {
          const spouseName = occ.relatedPersonName || 'Spouse';
          title = `Birthday: ${spouseName} (Spouse of ${donorName})`;
        } else {
          const childName = occ.relatedPersonName || 'Child';
          title = `Birthday: ${childName} (Child of ${donorName})`;
        }

        await this.prisma.task.create({
          data: {
            title,
            type: TaskType.BIRTHDAY,
            priority: daysUntil <= 1 ? TaskPriority.HIGH : TaskPriority.MEDIUM,
            status: TaskStatus.PENDING,
            dueDate,
            donorId: occ.donorId,
            sourceOccasionId: occ.id,
            autoWhatsAppPossible: this.autoWhatsApp(occ.donor),
            manualRequired: true,
          },
        });
        created++;
      }
    }
    return created;
  }

  // ─── 1b. Family member birthday tasks — reads from donor_family_members (birthMonth/birthDay)
  //         Family Members is now the source of truth for person-level birthday data.
  //         These complement the DOB_SELF/DOB_SPOUSE/DOB_CHILD occasion records for backward compat.

  async generateFamilyMemberBirthdayTasks(): Promise<number> {
    const LOOK_AHEAD_DAYS = 30;

    const members = await this.prisma.donorFamilyMember.findMany({
      where: {
        birthMonth: { not: null },
        birthDay: { not: null },
        donor: { isDeleted: false },
      },
      include: {
        donor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            prefWhatsapp: true,
            whatsappPhone: true,
          },
        },
      },
    });

    let created = 0;
    for (const member of members) {
      if (!member.birthMonth || !member.birthDay) continue;

      const { dueDate, daysUntil } = this.nextAnnualDate(member.birthMonth, member.birthDay);
      if (daysUntil > LOOK_AHEAD_DAYS) continue;

      const nextDay = new Date(dueDate.getTime() + 86400000);
      const existing = await this.prisma.task.findFirst({
        where: {
          type: TaskType.BIRTHDAY,
          donorId: member.donorId,
          sourceFamilyMemberId: member.id,
          dueDate: { gte: dueDate, lt: nextDay },
        },
      });

      if (!existing) {
        const donorName = [member.donor.firstName, member.donor.lastName].filter(Boolean).join(' ');
        const title = `Birthday: ${member.name} (${member.relationType.replace(/_/g, ' ')} of ${donorName})`;

        await this.prisma.task.create({
          data: {
            title,
            type: TaskType.BIRTHDAY,
            priority: daysUntil <= 1 ? TaskPriority.HIGH : TaskPriority.MEDIUM,
            status: TaskStatus.PENDING,
            dueDate,
            donorId: member.donorId,
            sourceFamilyMemberId: member.id,
            autoWhatsAppPossible: this.autoWhatsApp(member.donor),
            manualRequired: true,
          },
        });
        created++;
      }
    }
    return created;
  }

  // ─── 2. Anniversary tasks — looks ahead LOOK_AHEAD_DAYS ───────────────────

  async generateAnniversaryTasks(): Promise<number> {
    const LOOK_AHEAD_DAYS = 30;

    // Fetch all active anniversary occasions
    const occasions = await this.prisma.donorSpecialOccasion.findMany({
      where: {
        type: OccasionType.ANNIVERSARY,
        donor: { isDeleted: false },
      },
      include: {
        donor: {
          select: { id: true, firstName: true, lastName: true, prefWhatsapp: true, whatsappPhone: true },
        },
      },
    });

    let created = 0;
    for (const occ of occasions) {
      if (!occ.month || !occ.day) continue;

      const { dueDate, daysUntil } = this.nextAnnualDate(occ.month, occ.day);
      if (daysUntil > LOOK_AHEAD_DAYS) continue;

      const nextDay = new Date(dueDate.getTime() + 86400000);
      const existing = await this.prisma.task.findFirst({
        where: {
          type: TaskType.ANNIVERSARY,
          donorId: occ.donorId,
          sourceOccasionId: occ.id,
          dueDate: { gte: dueDate, lt: nextDay },
        },
      });
      if (!existing) {
        const name = [occ.donor.firstName, occ.donor.lastName].filter(Boolean).join(' ');
        await this.prisma.task.create({
          data: {
            title: `Anniversary: ${name}${occ.relatedPersonName ? ` & ${occ.relatedPersonName}` : ''}`,
            type: TaskType.ANNIVERSARY,
            priority: daysUntil <= 1 ? TaskPriority.HIGH : TaskPriority.MEDIUM,
            status: TaskStatus.PENDING,
            dueDate,
            donorId: occ.donorId,
            sourceOccasionId: occ.id,
            autoWhatsAppPossible: this.autoWhatsApp(occ.donor),
            manualRequired: true,
          },
        });
        created++;
      }
    }
    return created;
  }

  // ─── 3. Remembrance tasks — looks ahead LOOK_AHEAD_DAYS ───────────────────

  async generateRemembranceTasks(): Promise<number> {
    const LOOK_AHEAD_DAYS = 30;

    const occasions = await this.prisma.donorSpecialOccasion.findMany({
      where: {
        type: OccasionType.DEATH_ANNIVERSARY,
        donor: { isDeleted: false },
      },
      include: {
        donor: {
          select: { id: true, firstName: true, lastName: true, prefWhatsapp: true, whatsappPhone: true },
        },
      },
    });

    let created = 0;
    for (const occ of occasions) {
      if (!occ.month || !occ.day) continue;

      const { dueDate, daysUntil } = this.nextAnnualDate(occ.month, occ.day);
      if (daysUntil > LOOK_AHEAD_DAYS) continue;

      const nextDay = new Date(dueDate.getTime() + 86400000);
      const existing = await this.prisma.task.findFirst({
        where: {
          type: TaskType.REMEMBRANCE,
          donorId: occ.donorId,
          sourceOccasionId: occ.id,
          dueDate: { gte: dueDate, lt: nextDay },
        },
      });
      if (!existing) {
        const name = [occ.donor.firstName, occ.donor.lastName].filter(Boolean).join(' ');
        const titleSuffix = daysUntil === 0
          ? ''
          : ` (in ${daysUntil} day${daysUntil === 1 ? '' : 's'})`;
        await this.prisma.task.create({
          data: {
            title: `Remembrance${titleSuffix}: ${occ.relatedPersonName || 'Loved One'} (${name})`,
            type: TaskType.REMEMBRANCE,
            priority: daysUntil <= 3 ? TaskPriority.HIGH : TaskPriority.MEDIUM,
            status: TaskStatus.PENDING,
            dueDate,
            donorId: occ.donorId,
            sourceOccasionId: occ.id,
            autoWhatsAppPossible: false,
            manualRequired: true,
          },
        });
        created++;
      }
    }
    return created;
  }

  // ─── 4. Pledge follow-up tasks ─────────────────────────────────────────────
  //        Generates tasks for PENDING pledges that are overdue OR due within 30 days.
  //        Deduplication: skip if an open (non-completed) task already exists for the pledge.
  //        Due date on the task is set to the pledge's own expectedFulfillmentDate,
  //        so it appears correctly in the donor-actions inbox.

  async generatePledgeFollowUpTasks(): Promise<number> {
    const { todayStart } = this.todayBounds();

    // Look ahead 30 days AND include all overdue (no lower bound)
    const thirtyDaysLater = new Date(todayStart);
    thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);

    const pendingPledges = await this.prisma.pledge.findMany({
      where: {
        status: PledgeStatus.PENDING,
        isDeleted: false,
        expectedFulfillmentDate: { lte: thirtyDaysLater },
      },
      select: {
        id: true,
        donorId: true,
        pledgeType: true,
        amount: true,
        quantity: true,
        expectedFulfillmentDate: true,
        donor: { select: { prefWhatsapp: true, whatsappPhone: true } },
      },
    });

    let created = 0;
    for (const pledge of pendingPledges) {
      // Deduplicate: if any open task already exists for this pledge, skip it.
      // Using status filter (not createdAt) so we never recreate until the task is resolved.
      const existing = await this.prisma.task.findFirst({
        where: {
          type: TaskType.PLEDGE,
          sourcePledgeId: pledge.id,
          status: { notIn: [TaskStatus.COMPLETED, TaskStatus.MISSED] },
        },
      });
      if (!existing) {
        const dueDate = new Date(pledge.expectedFulfillmentDate);
        dueDate.setHours(0, 0, 0, 0);

        const daysUntil = Math.round(
          (dueDate.getTime() - todayStart.getTime()) / 86400000,
        );
        const isOverdue = daysUntil < 0;

        // Build a descriptive title including amount or quantity
        const amountStr =
          pledge.pledgeType === 'MONEY' && pledge.amount
            ? ` ₹${Number(pledge.amount)}`
            : pledge.quantity
              ? ` (${pledge.quantity})`
              : '';

        const urgency = isOverdue
          ? ` — ${Math.abs(daysUntil)}d overdue`
          : daysUntil === 0
            ? ' — due today'
            : ` — due in ${daysUntil}d`;

        await this.prisma.task.create({
          data: {
            title: `${pledge.pledgeType} pledge follow-up${amountStr}${urgency}`,
            type: TaskType.PLEDGE,
            priority:
              isOverdue || daysUntil <= 3
                ? TaskPriority.HIGH
                : TaskPriority.MEDIUM,
            status: TaskStatus.PENDING,
            dueDate,
            donorId: pledge.donorId,
            sourcePledgeId: pledge.id,
            autoWhatsAppPossible: this.autoWhatsApp(pledge.donor),
            manualRequired: true,
          },
        });
        created++;
      }
    }
    return created;
  }

  // ─── 5. Post-donation follow-up tasks ──────────────────────────────────────

  async generateDonationFollowUpTasks(): Promise<number> {
    const { todayStart } = this.todayBounds();

    const thirtyDaysAgo = new Date(todayStart);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyOneDaysAgo = new Date(todayStart);
    thirtyOneDaysAgo.setDate(thirtyOneDaysAgo.getDate() - 31);

    const donations = await this.prisma.donation.findMany({
      where: {
        donationDate: { gte: thirtyOneDaysAgo, lt: thirtyDaysAgo },
        isDeleted: false,
      },
      select: {
        id: true,
        donorId: true,
        donor: { select: { prefWhatsapp: true, whatsappPhone: true } },
      },
    });

    let created = 0;
    for (const donation of donations) {
      const existing = await this.prisma.task.findFirst({
        where: {
          type: TaskType.FOLLOW_UP,
          donorId: donation.donorId,
          dueDate: { gte: thirtyDaysAgo },
        },
      });
      if (!existing) {
        await this.prisma.task.create({
          data: {
            title: `Follow-up call — 30-day check-in`,
            type: TaskType.FOLLOW_UP,
            priority: TaskPriority.MEDIUM,
            status: TaskStatus.PENDING,
            dueDate: todayStart,
            donorId: donation.donorId,
            autoWhatsAppPossible: this.autoWhatsApp(donation.donor),
            manualRequired: true,
          },
        });
        created++;
      }
    }
    return created;
  }

  // ─── 6. Sponsor update tasks (quarterly) ───────────────────────────────────

  async generateSponsorUpdateTasks(): Promise<number> {
    const { todayStart } = this.todayBounds();

    // Find active sponsorships
    const sponsorships = await this.prisma.sponsorship.findMany({
      where: { isActive: true, status: 'ACTIVE' },
      select: {
        id: true,
        donorId: true,
        sponsorshipType: true,
        beneficiary: { select: { id: true, fullName: true } },
        donor: { select: { prefWhatsapp: true, whatsappPhone: true } },
      },
    });

    // 90 days = roughly quarterly
    const ninetyDaysAgo = new Date(todayStart);
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    let created = 0;
    for (const sp of sponsorships) {
      const existing = await this.prisma.task.findFirst({
        where: {
          type: TaskType.SPONSOR_UPDATE,
          sourceSponsorshipId: sp.id,
          createdAt: { gte: ninetyDaysAgo },
        },
      });
      if (!existing) {
        await this.prisma.task.create({
          data: {
            title: `Send sponsor update — ${sp.beneficiary.fullName}`,
            description: `Quarterly update for ${sp.sponsorshipType} sponsorship`,
            type: TaskType.SPONSOR_UPDATE,
            priority: TaskPriority.MEDIUM,
            status: TaskStatus.PENDING,
            dueDate: todayStart,
            donorId: sp.donorId,
            beneficiaryId: sp.beneficiary.id,
            sourceSponsorshipId: sp.id,
            autoWhatsAppPossible: this.autoWhatsApp(sp.donor),
            manualRequired: true,
          },
        });
        created++;
      }
    }
    return created;
  }

  // ─── 7. Smart donation reminder tasks ─────────────────────────────────────

  async generateSmartDonationReminderTasks(): Promise<number> {
    const { todayStart } = this.todayBounds();
    const today = new Date();
    const dayOfMonth = today.getDate();

    // Monthly donors: if past day 10 and no donation this month
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    // Quarterly donors: if past day 10 and no donation this quarter
    const quarterMonth = Math.floor(today.getMonth() / 3) * 3;
    const quarterStart = new Date(today.getFullYear(), quarterMonth, 1);

    // Only trigger after day 10 of the period
    if (dayOfMonth < 10) return 0;

    const [monthlyDonors, quarterlyDonors] = await Promise.all([
      this.prisma.donor.findMany({
        where: {
          isDeleted: false,
          donationFrequency: DonationFrequency.MONTHLY,
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          prefWhatsapp: true,
          whatsappPhone: true,
          donations: {
            where: { donationDate: { gte: monthStart }, isDeleted: false },
            select: { id: true },
            take: 1,
          },
        },
      }),
      this.prisma.donor.findMany({
        where: {
          isDeleted: false,
          donationFrequency: DonationFrequency.QUARTERLY,
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          prefWhatsapp: true,
          whatsappPhone: true,
          donations: {
            where: { donationDate: { gte: quarterStart }, isDeleted: false },
            select: { id: true },
            take: 1,
          },
        },
      }),
    ]);

    const sevenDaysAgo = new Date(todayStart);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    let created = 0;

    for (const donor of monthlyDonors) {
      if (donor.donations.length > 0) continue; // already donated this month

      const existing = await this.prisma.task.findFirst({
        where: {
          type: TaskType.SMART_REMINDER,
          donorId: donor.id,
          createdAt: { gte: sevenDaysAgo },
        },
      });
      if (!existing) {
        const name = [donor.firstName, donor.lastName].filter(Boolean).join(' ');
        await this.prisma.task.create({
          data: {
            title: `Smart reminder — Monthly donation due (${name})`,
            description: `${name} is a monthly donor and hasn't donated this month yet.`,
            type: TaskType.SMART_REMINDER,
            priority: TaskPriority.MEDIUM,
            status: TaskStatus.PENDING,
            dueDate: todayStart,
            donorId: donor.id,
            autoWhatsAppPossible: this.autoWhatsApp(donor),
            manualRequired: true,
          },
        });
        created++;
      }
    }

    for (const donor of quarterlyDonors) {
      if (donor.donations.length > 0) continue; // already donated this quarter

      const existing = await this.prisma.task.findFirst({
        where: {
          type: TaskType.SMART_REMINDER,
          donorId: donor.id,
          createdAt: { gte: sevenDaysAgo },
        },
      });
      if (!existing) {
        const name = [donor.firstName, donor.lastName].filter(Boolean).join(' ');
        await this.prisma.task.create({
          data: {
            title: `Smart reminder — Quarterly donation due (${name})`,
            description: `${name} is a quarterly donor and hasn't donated this quarter yet.`,
            type: TaskType.SMART_REMINDER,
            priority: TaskPriority.MEDIUM,
            status: TaskStatus.PENDING,
            dueDate: todayStart,
            donorId: donor.id,
            autoWhatsAppPossible: this.autoWhatsApp(donor),
            manualRequired: true,
          },
        });
        created++;
      }
    }

    return created;
  }
}
