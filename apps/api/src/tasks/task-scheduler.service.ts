import { Injectable, Logger } from '@nestjs/common';
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
export class TaskSchedulerService {
  private readonly logger = new Logger(TaskSchedulerService.name);

  constructor(private prisma: PrismaService) {}

  @Cron('0 7 * * *')
  async runDailyTaskGeneration() {
    this.logger.log('Daily donor task generation started');
    const results = await Promise.allSettled([
      this.generateBirthdayTasks(),
      this.generateAnniversaryTasks(),
      this.generateRemembranceTasks(),
      this.generatePledgeFollowUpTasks(),
      this.generateDonationFollowUpTasks(),
      this.generateSponsorUpdateTasks(),
      this.generateSmartDonationReminderTasks(),
    ]);
    results.forEach((r, i) => {
      const names = ['birthday', 'anniversary', 'remembrance', 'pledge', 'donation-followup', 'sponsor-update', 'smart-reminder'];
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

  // ─── 1. Birthday tasks ─────────────────────────────────────────────────────

  async generateBirthdayTasks(): Promise<number> {
    const today = new Date();
    const month = today.getMonth() + 1;
    const day = today.getDate();
    const { todayStart, tomorrow } = this.todayBounds();

    const donors = await this.prisma.donor.findMany({
      where: { dobMonth: month, dobDay: day, isDeleted: false },
      select: { id: true, firstName: true, lastName: true, prefWhatsapp: true, whatsappPhone: true },
    });

    let created = 0;
    for (const donor of donors) {
      const existing = await this.prisma.task.findFirst({
        where: { type: TaskType.BIRTHDAY, donorId: donor.id, dueDate: { gte: todayStart, lt: tomorrow } },
      });
      if (!existing) {
        await this.prisma.task.create({
          data: {
            title: `Birthday: ${donor.firstName} ${donor.lastName || ''}`.trim(),
            type: TaskType.BIRTHDAY,
            priority: TaskPriority.HIGH,
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

  // ─── 2. Anniversary tasks ──────────────────────────────────────────────────

  async generateAnniversaryTasks(): Promise<number> {
    const today = new Date();
    const month = today.getMonth() + 1;
    const day = today.getDate();
    const { todayStart, tomorrow } = this.todayBounds();

    const occasions = await this.prisma.donorSpecialOccasion.findMany({
      where: {
        type: OccasionType.ANNIVERSARY,
        month,
        day,
        donor: { isDeleted: false },
      },
      include: {
        donor: { select: { id: true, firstName: true, lastName: true, prefWhatsapp: true, whatsappPhone: true } },
      },
    });

    let created = 0;
    for (const occ of occasions) {
      const existing = await this.prisma.task.findFirst({
        where: { type: TaskType.ANNIVERSARY, donorId: occ.donorId, dueDate: { gte: todayStart, lt: tomorrow } },
      });
      if (!existing) {
        const name = [occ.donor.firstName, occ.donor.lastName].filter(Boolean).join(' ');
        await this.prisma.task.create({
          data: {
            title: `Anniversary: ${name}${occ.relatedPersonName ? ` & ${occ.relatedPersonName}` : ''}`,
            type: TaskType.ANNIVERSARY,
            priority: TaskPriority.HIGH,
            status: TaskStatus.PENDING,
            dueDate: todayStart,
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

  // ─── 3. Remembrance / Death Anniversary tasks ──────────────────────────────

  async generateRemembranceTasks(): Promise<number> {
    const today = new Date();
    const month = today.getMonth() + 1;
    const day = today.getDate();
    const { todayStart, tomorrow } = this.todayBounds();

    // Also generate 7-day advance reminder for remembrance
    const sevenDaysLater = new Date(today);
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
    const advMonth = sevenDaysLater.getMonth() + 1;
    const advDay = sevenDaysLater.getDate();

    const [todayOccasions, advanceOccasions] = await Promise.all([
      this.prisma.donorSpecialOccasion.findMany({
        where: {
          type: OccasionType.DEATH_ANNIVERSARY,
          month,
          day,
          donor: { isDeleted: false },
        },
        include: {
          donor: { select: { id: true, firstName: true, lastName: true, prefWhatsapp: true, whatsappPhone: true } },
        },
      }),
      this.prisma.donorSpecialOccasion.findMany({
        where: {
          type: OccasionType.DEATH_ANNIVERSARY,
          month: advMonth,
          day: advDay,
          donor: { isDeleted: false },
        },
        include: {
          donor: { select: { id: true, firstName: true, lastName: true, prefWhatsapp: true, whatsappPhone: true } },
        },
      }),
    ]);

    let created = 0;

    for (const occ of todayOccasions) {
      const existing = await this.prisma.task.findFirst({
        where: { type: TaskType.REMEMBRANCE, donorId: occ.donorId, dueDate: { gte: todayStart, lt: tomorrow } },
      });
      if (!existing) {
        const name = [occ.donor.firstName, occ.donor.lastName].filter(Boolean).join(' ');
        await this.prisma.task.create({
          data: {
            title: `Remembrance: ${occ.relatedPersonName || 'Loved One'} (${name})`,
            type: TaskType.REMEMBRANCE,
            priority: TaskPriority.HIGH,
            status: TaskStatus.PENDING,
            dueDate: todayStart,
            donorId: occ.donorId,
            sourceOccasionId: occ.id,
            autoWhatsAppPossible: false,
            manualRequired: true,
          },
        });
        created++;
      }
    }

    // 7-day advance tasks
    const advanceDue = this.futureDueDate(7);
    for (const occ of advanceOccasions) {
      const existing = await this.prisma.task.findFirst({
        where: {
          type: TaskType.REMEMBRANCE,
          donorId: occ.donorId,
          dueDate: { gte: advanceDue, lt: new Date(advanceDue.getTime() + 86400000) },
        },
      });
      if (!existing) {
        const name = [occ.donor.firstName, occ.donor.lastName].filter(Boolean).join(' ');
        await this.prisma.task.create({
          data: {
            title: `Remembrance in 7 days: ${occ.relatedPersonName || 'Loved One'} (${name})`,
            type: TaskType.REMEMBRANCE,
            priority: TaskPriority.MEDIUM,
            status: TaskStatus.PENDING,
            dueDate: advanceDue,
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

  async generatePledgeFollowUpTasks(): Promise<number> {
    const { todayStart } = this.todayBounds();

    const sevenDaysAgo = new Date(todayStart);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const pendingPledges = await this.prisma.pledge.findMany({
      where: {
        status: PledgeStatus.PENDING,
        isDeleted: false,
        expectedFulfillmentDate: { lte: todayStart },
      },
      select: {
        id: true,
        donorId: true,
        pledgeType: true,
        amount: true,
        donor: { select: { prefWhatsapp: true, whatsappPhone: true } },
      },
    });

    let created = 0;
    for (const pledge of pendingPledges) {
      const existing = await this.prisma.task.findFirst({
        where: {
          type: TaskType.PLEDGE,
          sourcePledgeId: pledge.id,
          createdAt: { gte: sevenDaysAgo },
        },
      });
      if (!existing) {
        await this.prisma.task.create({
          data: {
            title: `Pledge follow-up — ${pledge.pledgeType}${pledge.amount ? ` ₹${pledge.amount}` : ''}`,
            type: TaskType.PLEDGE,
            priority: TaskPriority.HIGH,
            status: TaskStatus.PENDING,
            dueDate: todayStart,
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
