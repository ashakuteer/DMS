import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CommunicationLogService } from "../communication-log/communication-log.service";
import {
  CommunicationChannel,
  CommunicationStatus,
  CommunicationType,
} from "@prisma/client";

@Injectable()
export class DashboardActionsService {
  private readonly logger = new Logger(DashboardActionsService.name);

  // Simple in-memory TTL cache — safe to swap for Redis later
  private readonly cache = new Map<string, { data: any; expiresAt: number }>();
  private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

  constructor(
    private readonly prisma: PrismaService,
    private readonly communicationLogService: CommunicationLogService,
  ) {}

  private getCached<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (entry && Date.now() < entry.expiresAt) return entry.data as T;
    this.cache.delete(key);
    return null;
  }

  private setCached(key: string, data: any): void {
    this.cache.set(key, { data, expiresAt: Date.now() + this.CACHE_TTL_MS });
  }

  async getStaffActions() {
    const cached = this.getCached<ReturnType<typeof this._computeStaffActions>>("staff_actions");
    if (cached) {
      this.logger.debug("getStaffActions() served from cache");
      return cached;
    }
    return this._computeStaffActions();
  }

  private async _computeStaffActions() {
    const start = Date.now();
    const now = new Date();

    // FIX: Run two independent queries in parallel instead of sequentially
    const [donorsWithLastDonation, recentDonations] = await Promise.all([
      this.prisma.donor.findMany({
        where: {
          deletedAt: null,
          donations: {
            some: {
              deletedAt: null,
            },
          },
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          donorCode: true,
          primaryPhone: true,
          donationFrequency: true,
          donations: {
            where: { deletedAt: null },
            orderBy: { donationDate: "desc" },
            take: 1,
            select: { donationDate: true },
          },
        },
        take: 200,
      }),
      this.prisma.donation.findMany({
        where: { deletedAt: null },
        select: { donationDate: true },
        orderBy: { donationDate: "desc" },
        take: 100,
      }),
    ]);

    const followUpDonors: {
      id: string;
      name: string;
      donorCode: string;
      phone: string;
      daysSinceLastDonation: number;
      healthStatus: "AT_RISK" | "DORMANT";
      bestTimeToContact: string;
      followUpReason: string;
    }[] = [];

    for (const donor of donorsWithLastDonation) {
      const lastDonation = donor.donations[0];

      if (lastDonation) {
        const lastDate = new Date(lastDonation.donationDate);
        const daysSinceLastDonation = Math.floor(
          (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24),
        );

        if (daysSinceLastDonation >= 60) {
          const healthStatus =
            daysSinceLastDonation >= 120 ? "DORMANT" : "AT_RISK";

          const donationHour = lastDate.getHours();
          const bestTimeToContact = donationHour < 12 ? "Morning" : "Evening";

          let followUpReason = "";
          if (healthStatus === "DORMANT") {
            followUpReason =
              "Re-engage: Last donated over 4 months ago. Gentle reminder about ongoing projects.";
          } else if (donor.donationFrequency === "MONTHLY") {
            followUpReason =
              "Monthly donor overdue. Check if they need payment assistance or reminders.";
          } else if (donor.donationFrequency === "QUARTERLY") {
            followUpReason =
              "Quarterly donor approaching due date. Share recent impact stories.";
          } else {
            followUpReason =
              "Regular check-in: Share recent accomplishments and upcoming initiatives.";
          }

          followUpDonors.push({
            id: donor.id,
            name: `${donor.firstName} ${donor.lastName || ""}`.trim(),
            donorCode: donor.donorCode,
            phone: donor.primaryPhone || "N/A",
            daysSinceLastDonation,
            healthStatus,
            bestTimeToContact,
            followUpReason,
          });
        }
      }
    }

    followUpDonors.sort((a, b) => b.daysSinceLastDonation - a.daysSinceLastDonation);

    const atRiskDonors = followUpDonors.filter((d) => d.healthStatus === "AT_RISK");
    const dormantDonors = followUpDonors.filter((d) => d.healthStatus === "DORMANT");

    let bestCallTime = { day: "Weekdays", slot: "Morning (9AM-12PM)" };

    if (recentDonations.length >= 10) {
      const dayOfWeekCounts: Record<string, number> = {};
      const timeSlotCounts: Record<string, number> = {};

      recentDonations.forEach((d) => {
        const date = new Date(d.donationDate);
        const days = [
          "Sunday",
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
        ];
        const day = days[date.getDay()];
        dayOfWeekCounts[day] = (dayOfWeekCounts[day] || 0) + 1;

        const hour = date.getHours();
        let slot = "Morning (9AM-12PM)";
        if (hour >= 12 && hour < 17) slot = "Afternoon (12PM-5PM)";
        else if (hour >= 17) slot = "Evening (5PM-9PM)";
        timeSlotCounts[slot] = (timeSlotCounts[slot] || 0) + 1;
      });

      const bestDay = Object.entries(dayOfWeekCounts).sort((a, b) => b[1] - a[1])[0];
      const bestSlot = Object.entries(timeSlotCounts).sort((a, b) => b[1] - a[1])[0];

      bestCallTime = {
        day: bestDay?.[0] || "Weekdays",
        slot: bestSlot?.[0] || "Morning (9AM-12PM)",
      };
    }

    const result = {
      followUpDonors: followUpDonors.slice(0, 15),
      atRiskCount: atRiskDonors.length,
      dormantCount: dormantDonors.length,
      bestCallTime,
      summary: {
        total: followUpDonors.length,
        atRisk: atRiskDonors.length,
        dormant: dormantDonors.length,
      },
    };

    this.setCached("staff_actions", result);
    this.logger.log(`getStaffActions() completed in ${Date.now() - start}ms`);
    return result;
  }


  async getDailyActions() {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentDay = now.getDate();

    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59,
    );
    const in7Days = new Date(now);
    in7Days.setDate(now.getDate() + 7);
    const in15Days = new Date(now);
    in15Days.setDate(now.getDate() + 15);

    const donorSelect = {
      id: true,
      donorCode: true,
      firstName: true,
      lastName: true,
      primaryPhone: true,
      whatsappPhone: true,
      personalEmail: true,
      officialEmail: true,
      healthScore: true,
      healthStatus: true,
    };

    const [
      allSpecialOccasions,
      reminderTasks,
      pledgesDue,
      atRiskDonors,
      beneficiariesWithBirthdays,
      activeMonthlySponsors,
    ] = await Promise.all([
      this.prisma.donorSpecialOccasion.findMany({
        where: { donor: { isDeleted: false } },
        include: { donor: { select: donorSelect } },
      }),
      this.prisma.reminderTask.findMany({
        where: {
          status: "OPEN",
          dueDate: { lte: in15Days },
          donor: { isDeleted: false },
        },
        include: {
          donor: { select: donorSelect },
          sourcePledge: {
            select: { id: true, pledgeType: true, amount: true, quantity: true },
          },
        },
        orderBy: { dueDate: "asc" },
      }),
      this.prisma.pledge.findMany({
        where: {
          status: "PENDING",
          isDeleted: false,
          expectedFulfillmentDate: { lte: in15Days },
          donor: { isDeleted: false },
        },
        include: { donor: { select: donorSelect } },
        orderBy: { expectedFulfillmentDate: "asc" },
      }),
      this.prisma.donor.findMany({
        where: { isDeleted: false, healthStatus: "RED" },
        select: donorSelect,
        orderBy: { healthScore: "asc" },
        take: 50,
      }),
      this.prisma.beneficiary.findMany({
        where: {
          isDeleted: false,
          status: "ACTIVE",
          dobMonth: { not: null },
          dobDay: { not: null },
        },
        select: {
          id: true,
          code: true,
          fullName: true,
          homeType: true,
          photoUrl: true,
          dobMonth: true,
          dobDay: true,
          isDeleted: true,
          status: true,
          sponsorships: {
            where: { isActive: true, status: "ACTIVE" },
            select: {
              id: true,
              donorId: true,
              isActive: true,
              status: true,
              donor: { select: donorSelect },
            },
          },
        },
      }),
      this.prisma.sponsorship.findMany({
        where: {
          isActive: true,
          status: "ACTIVE",
          frequency: "MONTHLY",
          donor: { isDeleted: false },
          beneficiary: { isDeleted: false },
        },
        include: {
          donor: { select: donorSelect },
          beneficiary: {
            select: {
              id: true,
              code: true,
              fullName: true,
              homeType: true,
              photoUrl: true,
            },
          },
        },
      }),
    ]);

    const todaySpecialDays: any[] = [];
    const upcoming7Days: any[] = [];
    const upcoming15Days: any[] = [];

    for (const occasion of allSpecialOccasions) {
      const occasionDate = new Date(now.getFullYear(), occasion.month - 1, occasion.day);
      if (occasionDate < now) {
        occasionDate.setFullYear(now.getFullYear() + 1);
      }

      const daysUntil = Math.ceil(
        (occasionDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );

      const item = {
        id: occasion.id,
        donorId: occasion.donorId,
        donorName: [occasion.donor.firstName, occasion.donor.lastName]
          .filter(Boolean)
          .join(" "),
        donorCode: occasion.donor.donorCode,
        type: occasion.type,
        relatedPersonName: occasion.relatedPersonName,
        month: occasion.month,
        day: occasion.day,
        daysUntil,
        donor: occasion.donor,
      };

      if (occasion.month === currentMonth && occasion.day === currentDay) {
        todaySpecialDays.push(item);
      } else if (daysUntil > 0 && daysUntil <= 7) {
        upcoming7Days.push(item);
      } else if (daysUntil > 7 && daysUntil <= 15) {
        upcoming15Days.push(item);
      }
    }

    const mapReminder = (r: any) => ({
      id: r.id,
      type: r.type,
      donorId: r.donorId,
      donorName: [r.donor.firstName, r.donor.lastName].filter(Boolean).join(" "),
      donorCode: r.donor.donorCode,
      title: r.title,
      dueDate: r.dueDate,
      status: r.status,
      offsetDays: r.offsetDays,
      pledgeId: r.sourcePledge?.id,
      pledgeType: r.sourcePledge?.pledgeType,
      pledgeAmount: r.sourcePledge?.amount,
      pledgeQuantity: r.sourcePledge?.quantity,
      daysOverdue:
        new Date(r.dueDate) < todayStart
          ? Math.ceil(
              (todayStart.getTime() - new Date(r.dueDate).getTime()) /
                (1000 * 60 * 60 * 24),
            )
          : 0,
      daysUntil:
        new Date(r.dueDate) >= todayStart
          ? Math.ceil(
              (new Date(r.dueDate).getTime() - todayStart.getTime()) /
                (1000 * 60 * 60 * 24),
            )
          : 0,
      donor: r.donor,
    });

    const todayReminders = reminderTasks
      .filter((r) => {
        const due = new Date(r.dueDate);
        return due >= todayStart && due <= todayEnd;
      })
      .map(mapReminder);

    const overdueReminders = reminderTasks
      .filter((r) => new Date(r.dueDate) < todayStart)
      .map(mapReminder);

    const upcoming7Reminders = reminderTasks
      .filter((r) => {
        const due = new Date(r.dueDate);
        return due > todayEnd && due <= in7Days;
      })
      .map(mapReminder);

    const upcoming15Reminders = reminderTasks
      .filter((r) => {
        const due = new Date(r.dueDate);
        return due > in7Days && due <= in15Days;
      })
      .map(mapReminder);

    const followUpReminders = reminderTasks
      .filter((r) => r.type === "FOLLOW_UP")
      .map(mapReminder);

    const mapPledge = (p: any) => ({
      id: p.id,
      donorId: p.donorId,
      donorName: [p.donor.firstName, p.donor.lastName].filter(Boolean).join(" "),
      donorCode: p.donor.donorCode,
      pledgeType: p.pledgeType,
      amount: p.amount,
      quantity: p.quantity,
      currency: p.currency,
      expectedFulfillmentDate: p.expectedFulfillmentDate,
      notes: p.notes,
      daysOverdue:
        new Date(p.expectedFulfillmentDate) < todayStart
          ? Math.ceil(
              (todayStart.getTime() -
                new Date(p.expectedFulfillmentDate).getTime()) /
                (1000 * 60 * 60 * 24),
            )
          : 0,
      daysUntil:
        new Date(p.expectedFulfillmentDate) >= todayStart
          ? Math.ceil(
              (new Date(p.expectedFulfillmentDate).getTime() -
                todayStart.getTime()) /
                (1000 * 60 * 60 * 24),
            )
          : 0,
      donor: p.donor,
    });

    const overduePledges = pledgesDue
      .filter((p) => new Date(p.expectedFulfillmentDate) < todayStart)
      .map(mapPledge);

    const dueTodayPledges = pledgesDue
      .filter((p) => {
        const due = new Date(p.expectedFulfillmentDate);
        return due >= todayStart && due <= todayEnd;
      })
      .map(mapPledge);

    const upcoming7Pledges = pledgesDue
      .filter((p) => {
        const due = new Date(p.expectedFulfillmentDate);
        return due > todayEnd && due <= in7Days;
      })
      .map(mapPledge);

    const beneficiaryBirthdays: any[] = [];

    for (const beneficiary of beneficiariesWithBirthdays) {
      if (!beneficiary.dobMonth || !beneficiary.dobDay) continue;

      const birthdayDate = new Date(
        now.getFullYear(),
        beneficiary.dobMonth - 1,
        beneficiary.dobDay,
      );

      if (birthdayDate < now) {
        birthdayDate.setFullYear(now.getFullYear() + 1);
      }

      const daysUntil = Math.ceil(
        (birthdayDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (daysUntil >= 0 && daysUntil <= 7) {
        beneficiaryBirthdays.push({
          id: beneficiary.id,
          beneficiaryId: beneficiary.id,
          beneficiaryCode: beneficiary.code,
          beneficiaryName: beneficiary.fullName,
          homeType: beneficiary.homeType,
          photoUrl: beneficiary.photoUrl,
          dobMonth: beneficiary.dobMonth,
          dobDay: beneficiary.dobDay,
          daysUntil,
          isToday: daysUntil === 0,
          sponsorCount: beneficiary.sponsorships.length,
          sponsors: beneficiary.sponsorships.map((s: any) => ({
            donorId: s.donorId,
            donorCode: s.donor.donorCode,
            donorName: `${s.donor.firstName} ${s.donor.lastName || ""}`.trim(),
            primaryPhone: s.donor.primaryPhone,
            personalEmail: s.donor.personalEmail,
          })),
        });
      }
    }

    beneficiaryBirthdays.sort((a, b) => a.daysUntil - b.daysUntil);

    const monthlySponsorshipsDue: any[] = [];

    for (const sponsorship of activeMonthlySponsors) {
      const startDay =
        (sponsorship as any).dueDayOfMonth ??
        (sponsorship.startDate ? new Date(sponsorship.startDate).getDate() : null);

      if (startDay === null) continue;

      let dueDate: Date;
      if ((sponsorship as any).nextDueDate) {
        dueDate = new Date((sponsorship as any).nextDueDate);
      } else {
        dueDate = new Date(now.getFullYear(), now.getMonth(), startDay);
        if (dueDate < todayStart) {
          dueDate.setMonth(dueDate.getMonth() + 1);
        }
      }

      const daysUntil = Math.ceil(
        (dueDate.getTime() - todayStart.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (daysUntil <= 7 || (daysUntil < 0 && daysUntil >= -30)) {
        monthlySponsorshipsDue.push({
          id: sponsorship.id,
          sponsorshipId: sponsorship.id,
          donorId: sponsorship.donorId,
          donorCode: sponsorship.donor.donorCode,
          donorName: `${sponsorship.donor.firstName} ${sponsorship.donor.lastName || ""}`.trim(),
          beneficiaryId: sponsorship.beneficiaryId,
          beneficiaryCode: sponsorship.beneficiary.code,
          beneficiaryName: sponsorship.beneficiary.fullName,
          homeType: sponsorship.beneficiary.homeType,
          amount: sponsorship.amount,
          currency: sponsorship.currency,
          frequency: sponsorship.frequency,
          dueDay: startDay,
          daysUntil,
          isOverdue: daysUntil < 0,
          donor: sponsorship.donor,
          beneficiary: sponsorship.beneficiary,
        });
      }
    }

    monthlySponsorshipsDue.sort((a, b) => a.daysUntil - b.daysUntil);

    return {
      todaySpecialDays: {
        birthdays: todaySpecialDays.filter(
          (o) =>
            o.type === "DOB_SELF" ||
            o.type === "DOB_SPOUSE" ||
            o.type === "DOB_CHILD",
        ),
        anniversaries: todaySpecialDays.filter((o) => o.type === "ANNIVERSARY"),
        memorials: todaySpecialDays.filter((o) => o.type === "DEATH_ANNIVERSARY"),
        other: todaySpecialDays.filter((o) => o.type === "OTHER"),
      },
      upcomingSpecialDays: {
        next7Days: upcoming7Days.sort((a, b) => a.daysUntil - b.daysUntil),
        next15Days: upcoming15Days.sort((a, b) => a.daysUntil - b.daysUntil),
      },
      reminders: {
        today: todayReminders,
        overdue: overdueReminders,
        upcoming7: upcoming7Reminders,
        upcoming15: upcoming15Reminders,
      },
      pledges: {
        overdue: overduePledges,
        dueToday: dueTodayPledges,
        upcoming7: upcoming7Pledges,
      },
      followUps: {
        dueToday: followUpReminders.filter(
          (r) => r.daysUntil === 0 && r.daysOverdue === 0,
        ),
        overdue: followUpReminders.filter((r) => r.daysOverdue > 0),
      },
      atRiskDonors: atRiskDonors.map((d) => ({
        id: d.id,
        donorId: d.id,
        donorName: [d.firstName, d.lastName].filter(Boolean).join(" "),
        donorCode: d.donorCode,
        healthScore: d.healthScore,
        healthStatus: d.healthStatus,
        donor: d,
      })),
      beneficiaryBirthdays: {
        today: beneficiaryBirthdays.filter((b) => b.isToday),
        upcoming7: beneficiaryBirthdays.filter((b) => !b.isToday),
      },
      sponsorshipsDue: monthlySponsorshipsDue,
      stats: {
        todayTotal: todaySpecialDays.length + todayReminders.length,
        upcoming7Total: upcoming7Days.length + upcoming7Reminders.length,
        upcoming15Total: upcoming15Days.length + upcoming15Reminders.length,
        overdueTotal: overdueReminders.length + overduePledges.length,
        pledgesDue:
          overduePledges.length + dueTodayPledges.length + upcoming7Pledges.length,
        followUpsDueToday: followUpReminders.filter(
          (r) => r.daysUntil === 0 && r.daysOverdue === 0,
        ).length,
        overdueFollowUps: followUpReminders.filter((r) => r.daysOverdue > 0).length,
        atRiskCount: atRiskDonors.length,
        beneficiaryBirthdaysCount: beneficiaryBirthdays.length,
        sponsorshipsDueCount: monthlySponsorshipsDue.length,
      },
    };
  }

  async markActionDone(
    user: any,
    params: { donorId: string; actionType: string; description: string },
  ) {
    await this.communicationLogService.create({
      donorId: params.donorId,
      channel: CommunicationChannel.EMAIL,
      type: CommunicationType.GENERAL,
      status: CommunicationStatus.SENT,
      subject: `Action Completed: ${params.actionType}`,
      messagePreview: params.description,
      sentById: user.id || user.sub,
    });

    this.logger.log(
      `Daily action marked done: ${params.actionType} for donor ${params.donorId} by user ${user.id || user.sub}`,
    );

    return {
      success: true,
      message: "Action marked as done and logged to timeline",
    };
  }

  async snoozeAction(
    user: any,
    params: { donorId: string; actionType: string; description: string; days: number },
  ) {
    const snoozeUntil = new Date();
    snoozeUntil.setDate(snoozeUntil.getDate() + params.days);

    await this.communicationLogService.create({
      donorId: params.donorId,
      channel: CommunicationChannel.EMAIL,
      type: CommunicationType.GENERAL,
      status: CommunicationStatus.SENT,
      subject: `Action Snoozed: ${params.actionType}`,
      messagePreview: `${params.description} - Snoozed for ${params.days} days until ${snoozeUntil.toLocaleDateString("en-IN")}`,
      sentById: user.id || user.sub,
    });

    this.logger.log(
      `Daily action snoozed: ${params.actionType} for donor ${params.donorId}, ${params.days} days`,
    );

    return {
      success: true,
      message: `Action snoozed for ${params.days} days`,
      snoozeUntil,
    };
  }
}
