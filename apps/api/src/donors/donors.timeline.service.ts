import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { UserContext } from "./donors.types";
import { Role } from "@prisma/client";

@Injectable()
export class DonorsTimelineService {
  constructor(private readonly prisma: PrismaService) {}

  private getAccessFilter(_user: UserContext): any {
    return {};
  }

  async getTimeline(
    user: UserContext,
    donorId: string,
    options: {
      page?: number;
      limit?: number;
      startDate?: string;
      endDate?: string;
      types?: string[];
    } = {},
  ) {
    const donor = await this.prisma.donor.findFirst({
      where: { id: donorId, isDeleted: false, ...this.getAccessFilter(user) },
      select: { id: true },
    });

    if (!donor) {
      throw new NotFoundException("Donor not found");
    }

    const { page = 1, limit = 50, startDate, endDate, types } = options;
    const dateFilter: any = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      dateFilter.lte = end;
    }
    const hasDateFilter = Object.keys(dateFilter).length > 0;

    const allTypes = [
      "DONATION",
      "VISIT",
      "COMMUNICATION",
      "BIRTHDAY_WISH",
      "PLEDGE",
      "FOLLOW_UP",
      "SPONSORSHIP",
      "MEAL_SPONSORSHIP",
    ];
    const activeTypes = types && types.length > 0 ? types : allTypes;

    const items: Array<{
      id: string;
      type: string;
      date: string;
      title: string;
      description: string;
      amount?: number;
      currency?: string;
      status?: string;
      metadata?: Record<string, any>;
    }> = [];

    if (activeTypes.includes("DONATION") || activeTypes.includes("VISIT")) {
      const donations = await this.prisma.donation.findMany({
        where: {
          donorId,
          isDeleted: false,
          ...(hasDateFilter ? { donationDate: dateFilter } : {}),
        },
        orderBy: { donationDate: "desc" },
        include: {
          createdBy: { select: { name: true } },
          campaign: { select: { name: true } },
          home: { select: { fullName: true } },
        },
      });

      for (const d of donations) {
        if (activeTypes.includes("DONATION")) {
          items.push({
            id: `donation-${d.id}`,
            type: "DONATION",
            date: d.donationDate.toISOString(),
            title: `Donation - ${d.donationType}`,
            description: `${d.currency} ${Number(d.donationAmount).toLocaleString()} via ${d.donationMode || "N/A"}${d.remarks ? ` - ${d.remarks}` : ""}`,
            amount: Number(d.donationAmount),
            currency: d.currency,
            status: d.receiptNumber ? "RECEIPTED" : "RECORDED",
            metadata: {
              donationType: d.donationType,
              donationMode: d.donationMode,
              receiptNumber: d.receiptNumber,
              campaignName: d.campaign?.name,
              homeName: d.home?.fullName,
              createdBy: d.createdBy?.name,
              visitedHome: d.visitedHome,
              servedFood: d.servedFood,
            },
          });
        }

        if (activeTypes.includes("VISIT") && d.visitedHome) {
          items.push({
            id: `visit-${d.id}`,
            type: "VISIT",
            date: d.donationDate.toISOString(),
            title: "Home Visit",
            description: `Visited${d.home?.fullName ? ` ${d.home.fullName}` : ""}${d.servedFood ? " and served food" : ""}`,
            metadata: {
              homeName: d.home?.fullName,
              servedFood: d.servedFood,
              donationAmount: Number(d.donationAmount),
            },
          });
        }
      }
    }

    if (activeTypes.includes("VISIT")) {
      const mealVisits = await this.prisma.mealVisitRecord.findMany({
        where: {
          donorId,
          ...(hasDateFilter ? { visitDate: dateFilter } : {}),
        },
        orderBy: { visitDate: "desc" },
        include: {
          mealSponsorship: {
            select: {
              homes: true,
              breakfast: true,
              lunch: true,
              eveningSnacks: true,
              dinner: true,
              foodType: true,
              occasionType: true,
            },
          },
        },
      });

      const homeLabels: Record<string, string> = {
        GIRLS_HOME: "Girls Home",
        BLIND_BOYS_HOME: "Blind Boys Home",
        OLD_AGE_HOME: "Old Age Home",
        GENERAL: "General",
      };

      for (const v of mealVisits) {
        const slots: string[] = [];
        if (v.mealSponsorship.breakfast) slots.push("Breakfast");
        if (v.mealSponsorship.lunch) slots.push("Lunch");
        if (v.mealSponsorship.eveningSnacks) slots.push("Evening Snacks");
        if (v.mealSponsorship.dinner) slots.push("Dinner");
        const homesDesc = (v.mealSponsorship.homes as string[])
          .map((h) => homeLabels[h] ?? h)
          .join(", ");
        const slotsDesc = slots.join(" + ") || "Meal";

        items.push({
          id: `meal-visit-${v.id}`,
          type: "VISIT",
          date: v.visitDate.toISOString(),
          title: "Meal Sponsorship Visit",
          description: `Visited during ${slotsDesc} at ${homesDesc}${v.notes ? ` — ${v.notes}` : ""}`,
          metadata: {
            homesDesc,
            slotsDesc,
            foodType: v.mealSponsorship.foodType,
            occasionType: v.mealSponsorship.occasionType,
            notes: v.notes,
            mealSponsorshipId: v.mealSponsorshipId,
          },
        });
      }
    }

    if (
      activeTypes.includes("COMMUNICATION") ||
      activeTypes.includes("BIRTHDAY_WISH")
    ) {
      const logs = await this.prisma.communicationLog.findMany({
        where: {
          donorId,
          ...(hasDateFilter ? { createdAt: dateFilter } : {}),
        },
        orderBy: { createdAt: "desc" },
        include: {
          sentBy: { select: { name: true } },
        },
      });

      for (const log of logs) {
        const isBirthdayWish =
          log.type === "GREETING" &&
          (log.subject?.toLowerCase().includes("birthday") ||
            log.subject?.toLowerCase().includes("anniversary") ||
            log.messagePreview?.toLowerCase().includes("birthday"));

        if (isBirthdayWish && activeTypes.includes("BIRTHDAY_WISH")) {
          items.push({
            id: `birthday-${log.id}`,
            type: "BIRTHDAY_WISH",
            date: log.createdAt.toISOString(),
            title: "Birthday/Anniversary Wish",
            description: `${log.channel} ${log.type.toLowerCase()} sent${log.subject ? `: ${log.subject}` : ""}`,
            status: log.status,
            metadata: {
              channel: log.channel,
              sentBy: log.sentBy?.name || "System",
              subject: log.subject,
              messagePreview: log.messagePreview,
            },
          });
        } else if (!isBirthdayWish && activeTypes.includes("COMMUNICATION")) {
          items.push({
            id: `comm-${log.id}`,
            type: "COMMUNICATION",
            date: log.createdAt.toISOString(),
            title: `${log.channel} - ${log.type.replace(/_/g, " ")}`,
            description:
              log.subject ||
              log.messagePreview ||
              `${log.channel} message sent`,
            status: log.status,
            metadata: {
              channel: log.channel,
              communicationType: log.type,
              sentBy: log.sentBy?.name || "System",
              recipient: log.recipient,
              subject: log.subject,
              messagePreview: log.messagePreview,
            },
          });
        }
      }
    }

    if (activeTypes.includes("PLEDGE")) {
      const pledges = await this.prisma.pledge.findMany({
        where: {
          donorId,
          isDeleted: false,
          ...(hasDateFilter ? { expectedFulfillmentDate: dateFilter } : {}),
        },
        orderBy: { createdAt: "desc" },
        include: {
          createdBy: { select: { name: true } },
        },
      });

      for (const p of pledges) {
        items.push({
          id: `pledge-${p.id}`,
          type: "PLEDGE",
          date: p.createdAt.toISOString(),
          title: `Pledge - ${p.pledgeType}`,
          description: `${p.currency} ${Number(p.amount).toLocaleString()}${p.notes ? ` - ${p.notes}` : ""}`,
          amount: Number(p.amount),
          currency: p.currency,
          status: p.status,
          metadata: {
            pledgeType: p.pledgeType,
            expectedDate: p.expectedFulfillmentDate?.toISOString(),
            createdBy: p.createdBy?.name,
          },
        });
      }
    }

    if (activeTypes.includes("FOLLOW_UP")) {
      const followUps = await this.prisma.followUpReminder.findMany({
        where: {
          donorId,
          isDeleted: false,
          ...(hasDateFilter ? { dueDate: dateFilter } : {}),
        },
        orderBy: { createdAt: "desc" },
        include: {
          assignedTo: { select: { name: true } },
          createdBy: { select: { name: true } },
        },
      });

      for (const f of followUps) {
        items.push({
          id: `followup-${f.id}`,
          type: "FOLLOW_UP",
          date: f.createdAt.toISOString(),
          title: `Follow-up${f.status === "COMPLETED" ? " (Completed)" : ""}`,
          description: f.note,
          status: f.status,
          metadata: {
            priority: f.priority,
            dueDate: f.dueDate.toISOString(),
            assignedTo: f.assignedTo?.name,
            createdBy: f.createdBy?.name,
            completedAt: f.completedAt?.toISOString(),
            completedNote: f.completedNote,
          },
        });
      }
    }

    if (activeTypes.includes("SPONSORSHIP")) {
      const sponsorships = await this.prisma.sponsorship.findMany({
        where: {
          donorId,
          ...(hasDateFilter ? { startDate: dateFilter } : {}),
        },
        orderBy: { startDate: "desc" },
        include: {
          beneficiary: { select: { fullName: true } },
        },
      });

      for (const s of sponsorships) {
        items.push({
          id: `sponsorship-${s.id}`,
          type: "SPONSORSHIP",
          date: (s.startDate || s.createdAt).toISOString(),
          title: `Sponsorship - ${s.sponsorshipType}`,
          description: `${s.currency} ${Number(s.amount || 0).toLocaleString()} ${s.frequency}${s.beneficiary?.fullName ? ` for ${s.beneficiary.fullName}` : ""}`,
          amount: Number(s.amount || 0),
          currency: s.currency,
          status: s.isActive ? "ACTIVE" : "INACTIVE",
          metadata: {
            sponsorshipType: s.sponsorshipType,
            frequency: s.frequency,
            beneficiaryName: s.beneficiary?.fullName,
            isActive: s.isActive,
          },
        });
      }
    }

    if (activeTypes.includes("MEAL_SPONSORSHIP")) {
      const meals = await this.prisma.mealSponsorship.findMany({
        where: {
          donorId,
          ...(hasDateFilter ? { mealServiceDate: dateFilter } : {}),
        },
        orderBy: { mealServiceDate: "desc" },
        include: {
          createdBy: { select: { name: true } },
        },
      });

      const homeLabels: Record<string, string> = {
        GIRLS_HOME: "Girls Home",
        BLIND_BOYS_HOME: "Blind Boys Home",
        OLD_AGE_HOME: "Old Age Home",
        GENERAL: "General",
      };

      for (const m of meals) {
        const slots: string[] = [];
        if (m.breakfast) slots.push("Breakfast");
        if (m.lunch) slots.push("Lunch");
        if (m.dinner) slots.push("Dinner");
        const slotsDesc = slots.join(" + ") || "N/A";
        const homesDesc = (m.homes as string[]).map((h) => homeLabels[h] ?? h).join(", ");

        items.push({
          id: `meal-${m.id}`,
          type: "MEAL_SPONSORSHIP",
          date: m.mealServiceDate.toISOString(),
          title: `Meal Sponsorship — ${slotsDesc}`,
          description: `INR ${Number(m.amount).toLocaleString()} | Homes: ${homesDesc} | ${m.foodType} | Received: ${m.donationReceivedDate.toLocaleDateString("en-IN")}`,
          amount: Number(m.amount),
          currency: "INR",
          status: m.paymentType,
          metadata: {
            homes: m.homes,
            sponsorshipType: m.sponsorshipType,
            breakfast: m.breakfast,
            lunch: m.lunch,
            dinner: m.dinner,
            foodType: m.foodType,
            mealServiceDate: m.mealServiceDate.toISOString(),
            donationReceivedDate: m.donationReceivedDate.toISOString(),
            paymentType: m.paymentType,
            occasionType: m.occasionType,
            createdBy: m.createdBy?.name,
            donationId: m.donationId,
          },
        });
      }
    }

    items.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    const total = items.length;
    const startIdx = (page - 1) * limit;
    const paginated = items.slice(startIdx, startIdx + limit);

    const typeCounts: Record<string, number> = {};
    for (const item of items) {
      typeCounts[item.type] = (typeCounts[item.type] || 0) + 1;
    }

    return {
      items: paginated,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      typeCounts,
    };
  }
}
