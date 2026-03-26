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

  /**
   * Convert a FamilyRelationType enum value to a human-readable label.
   * Used in task titles so telecallers see "Son Birthday: Arjun" instead of
   * "SON_Birthday: Arjun".
   */
  private relationLabel(relationType: string): string {
    const map: Record<string, string> = {
      SPOUSE: 'Spouse', SON: 'Son', DAUGHTER: 'Daughter', CHILD: 'Child',
      FATHER: 'Father', MOTHER: 'Mother', BROTHER: 'Brother', SISTER: 'Sister',
      SIBLING: 'Sibling', FATHER_IN_LAW: 'Father-in-law', MOTHER_IN_LAW: 'Mother-in-law',
      BROTHER_IN_LAW: 'Brother-in-law', SISTER_IN_LAW: 'Sister-in-law',
      SON_IN_LAW: 'Son-in-law', DAUGHTER_IN_LAW: 'Daughter-in-law', IN_LAW: 'In-law',
      GRANDFATHER: 'Grandfather', GRANDMOTHER: 'Grandmother', GRANDPARENT: 'Grandparent',
      GRANDSON: 'Grandson', GRANDDAUGHTER: 'Granddaughter', GRANDCHILD: 'Grandchild',
      COUSIN: 'Cousin', UNCLE: 'Uncle', AUNT: 'Aunt',
      FIANCE: 'Fiancé', FIANCEE: 'Fiancée',
      FRIEND: 'Friend', COLLEAGUE: 'Colleague', BOSS: 'Boss', MENTOR: 'Mentor',
      OTHER: 'Other',
    };
    return map[relationType] ?? relationType;
  }

  // ─── Source-of-truth rules implemented in generators ───────────────────────
  //
  //  SOURCE                          TASK TYPE    GENERATED BY
  //  donor.dobMonth / dobDay         BIRTHDAY     generateDonorDobBirthdayTasks  (PRIMARY)
  //  donorSpecialOccasion DOB_SELF   BIRTHDAY     generateBirthdayTasks           (fallback)
  //  donorFamilyMember birthMonth    BIRTHDAY     generateFamilyMemberBirthdayTasks
  //  donorSpecialOccasion ANNIVERSARY ANNIVERSARY  generateAnniversaryTasks
  //  donorSpecialOccasion DEATH_ANN  REMEMBRANCE  generateRemembranceTasks
  //  pledge (PENDING, due ≤30d)      PLEDGE       generatePledgeFollowUpTasks
  //  donation (made 30d ago)         FOLLOW_UP    generateDonationFollowUpTasks
  //  sponsorship (active, ≥90d)      SPONSOR_UPDATE generateSponsorUpdateTasks
  //  monthly/quarterly donor         SMART_REMINDER generateSmartDonationReminderTasks
  //
  //  NOT generated from DOB_SPOUSE / DOB_CHILD special occasions —
  //  those person-level dates belong exclusively in the Family Members tab.
  //
  // ──────────────────────────────────────────────────────────────────────────

  // ─── 0. Donor DOB birthday — reads from donor.dobMonth / donor.dobDay ─────
  //        PRIMARY source. Deduplication prevents a double task if the donor
  //        also has a DOB_SELF special occasion for the same date.

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

      // Dedup: skip if ANY birthday task already exists for this donor on this date
      // (prevents double-task when donor also has a DOB_SELF special occasion)
      const existing = await this.prisma.task.findFirst({
        where: {
          type: TaskType.BIRTHDAY,
          donorId: donor.id,
          dueDate: { gte: dueDate, lt: nextDay },
          sourceFamilyMemberId: null, // only match donor-level tasks, not family-member tasks
        },
      });

      if (!existing) {
        const donorName = [donor.firstName, donor.lastName].filter(Boolean).join(' ');
        await this.prisma.task.create({
          data: {
            title: `Donor Birthday: ${donorName}`,
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

  // ─── 1. Donor self-birthday from Special Days (DOB_SELF only) ─────────────
  //        Fallback for donors whose birthday was entered via the Special Days
  //        dialog before the DOB fields on the donor record existed.
  //        DOB_SPOUSE and DOB_CHILD are intentionally EXCLUDED here — those
  //        person-level dates are the exclusive domain of the Family Members tab.

  async generateBirthdayTasks(): Promise<number> {
    const LOOK_AHEAD_DAYS = 30;

    // Only DOB_SELF — spouse/child birthdays come from Family Members tab only
    const birthdayOccasions = await this.prisma.donorSpecialOccasion.findMany({
      where: {
        type: OccasionType.DOB_SELF,
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
      // Dedup: if a donor-level birthday task already exists on this date (from the
      // DOB generator above), skip — same donor, same date, no need for a second task.
      const existing = await this.prisma.task.findFirst({
        where: {
          type: TaskType.BIRTHDAY,
          donorId: occ.donorId,
          dueDate: { gte: dueDate, lt: nextDay },
          sourceFamilyMemberId: null,
        },
      });
      if (!existing) {
        const donorName = [occ.donor.firstName, occ.donor.lastName].filter(Boolean).join(' ');
        await this.prisma.task.create({
          data: {
            title: `Donor Birthday: ${donorName}`,
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

  // ─── 1b. Family member birthdays — source of truth for person-level dates ─
  //         Reads from donorFamilyMember.birthMonth / birthDay.
  //         Title format: "{Relation} Birthday: {memberName} (for {donorName})"
  //         e.g. "Son Birthday: Arjun (for Ramesh Kumar)"
  //              "Spouse Birthday: Priya (for Ramesh Kumar)"

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
      // Dedup: keyed to the specific family member record — each member gets at most
      // one open birthday task per annual occurrence.
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
        const rel = this.relationLabel(member.relationType);
        const title = `${rel} Birthday: ${member.name} (for ${donorName})`;

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

  // ─── 2. Wedding anniversary — from Special Days (ANNIVERSARY type) ─────────

  async generateAnniversaryTasks(): Promise<number> {
    const LOOK_AHEAD_DAYS = 30;

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
            title: `Wedding Anniversary: ${name}${occ.relatedPersonName ? ` & ${occ.relatedPersonName}` : ''}`,
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

  // ─── 3. Memorial Day / Remembrance — from Special Days (DEATH_ANNIVERSARY) ─

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
        await this.prisma.task.create({
          data: {
            title: `Memorial Day: ${occ.relatedPersonName || 'Loved One'} (for ${name})`,
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
