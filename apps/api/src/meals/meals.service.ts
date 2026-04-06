import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { DonationHomeType, DonationType, DonationPurpose, HomeAssignment, MealOccasionType, MealPaymentStatus, PledgeStatus, PledgeType, Role } from "@prisma/client";
import {
  CreateMealSponsorshipDto,
  UpdateMealSponsorshipDto,
  MealSponsorshipQueryDto,
  PostMealUpdateDto,
} from "./meals.dto";

interface MealUserContext {
  id: string;
  role: Role;
  assignedHome?: HomeAssignment | null;
}

@Injectable()
export class MealsService {
  private readonly logger = new Logger(MealsService.name);

  constructor(private readonly prisma: PrismaService) {}

  private buildMealSlotDescription(
    breakfast: boolean,
    lunch: boolean,
    eveningSnacks: boolean,
    dinner: boolean,
  ): string {
    const slots: string[] = [];
    if (breakfast) slots.push("Breakfast");
    if (lunch) slots.push("Lunch");
    if (eveningSnacks) slots.push("Evening Snacks");
    if (dinner) slots.push("Dinner");
    return slots.join(" + ") || "No slots";
  }

  private buildHomesDescription(homes: DonationHomeType[]): string {
    const homeLabels: Record<DonationHomeType, string> = {
      GIRLS_HOME: "Girls Home",
      BLIND_BOYS_HOME: "Blind Boys Home",
      OLD_AGE_HOME: "Old Age Home",
      GENERAL: "General",
    };
    return homes.map((h) => homeLabels[h] ?? h).join(", ");
  }

  async create(dto: CreateMealSponsorshipDto, createdById: string) {
    const donor = await this.prisma.donor.findFirst({
      where: { id: dto.donorId, isDeleted: false },
      select: { id: true, firstName: true, lastName: true },
    });
    if (!donor) throw new NotFoundException("Donor not found");

    const eveningSnacks = dto.eveningSnacks ?? false;

    if (!dto.breakfast && !dto.lunch && !eveningSnacks && !dto.dinner) {
      throw new BadRequestException("At least one meal slot must be selected");
    }

    // ── slotHomes path vs legacy homes path ──────────────────────────────────
    const slotHomes = dto.slotHomes as Record<string, string[]> | undefined | null;

    const activeSlotKeys: string[] = [
      ...(dto.breakfast ? ["breakfast"] : []),
      ...(dto.lunch ? ["lunch"] : []),
      ...(eveningSnacks ? ["eveningSnacks"] : []),
      ...(dto.dinner ? ["dinner"] : []),
    ];

    if (slotHomes) {
      // New path: validate each active slot has at least one home
      for (const slot of activeSlotKeys) {
        const slotLabel = { breakfast: "Breakfast", lunch: "Lunch", eveningSnacks: "Evening Snacks", dinner: "Dinner" }[slot] ?? slot;
        if (!slotHomes[slot] || slotHomes[slot].length === 0) {
          throw new BadRequestException(`Please select at least one home for ${slotLabel}`);
        }
      }
    } else {
      // Legacy path
      if (!dto.homes || dto.homes.length === 0) {
        throw new BadRequestException("At least one home must be selected");
      }
    }

    // Derive effective homes (unique union across all slots, used for legacy field + donation home)
    const effectiveHomes: DonationHomeType[] = slotHomes
      ? ([...new Set(activeSlotKeys.flatMap((s) => slotHomes[s] ?? []))] as DonationHomeType[])
      : dto.homes;

    const totalAmount = dto.totalAmount ?? dto.amount;
    const amountReceived = dto.amountReceived ?? 0;

    if (amountReceived > totalAmount) {
      throw new BadRequestException("Amount received cannot exceed total amount");
    }

    const mealServiceDate = new Date(dto.mealServiceDate);
    const donationReceivedDate = new Date(dto.donationReceivedDate);

    const occasionSuffix = dto.occasionType && dto.occasionType !== MealOccasionType.NONE
      ? ` | Occasion: ${dto.occasionType}` : "";

    let remarks: string;
    if (slotHomes) {
      const slotHomeLabels: Record<string, string> = {
        breakfast: "Breakfast", lunch: "Lunch", eveningSnacks: "Evening Snacks", dinner: "Dinner",
      };
      const homeNames: Record<DonationHomeType, string> = {
        GIRLS_HOME: "Girls Home", BLIND_BOYS_HOME: "Blind Boys Home",
        OLD_AGE_HOME: "Old Age Home", GENERAL: "General",
      };
      const parts = activeSlotKeys.map((s) => {
        const homes = (slotHomes[s] ?? []).map((h) => homeNames[h as DonationHomeType] ?? h).join(" & ");
        return `${slotHomeLabels[s]} (${homes})`;
      });
      remarks = `Meal Sponsorship — ${parts.join(", ")} | Meal Date: ${mealServiceDate.toLocaleDateString("en-IN")}${occasionSuffix}`;
    } else {
      const slotsDesc = this.buildMealSlotDescription(dto.breakfast, dto.lunch, eveningSnacks, dto.dinner);
      const homesDesc = this.buildHomesDescription(effectiveHomes);
      remarks = `Meal Sponsorship — ${slotsDesc} | Homes: ${homesDesc} | Meal Date: ${mealServiceDate.toLocaleDateString("en-IN")}${occasionSuffix}`;
    }

    const primaryHome = effectiveHomes[0];

    const result = await this.prisma.$transaction(async (tx) => {
      const donation = await tx.donation.create({
        data: {
          donorId: dto.donorId,
          donationDate: donationReceivedDate,
          donationAmount: totalAmount,
          donationType: DonationType.CASH,
          donationPurpose: DonationPurpose.MEAL_DONATION,
          donationHomeType: primaryHome,
          transactionId: dto.transactionId,
          remarks,
          createdById,
        },
      });

      const meal = await tx.mealSponsorship.create({
        data: {
          donorId: dto.donorId,
          homes: effectiveHomes,
          slotHomes: slotHomes ?? undefined,
          sponsorshipType: dto.sponsorshipType,
          breakfast: dto.breakfast,
          lunch: dto.lunch,
          eveningSnacks,
          dinner: dto.dinner,
          foodType: dto.foodType,
          mealNotes: dto.mealNotes,
          donationReceivedDate,
          mealServiceDate,
          paymentType: dto.paymentType ?? (amountReceived >= totalAmount ? "FULL" : "ADVANCE"),
          amount: totalAmount,
          totalAmount,
          amountReceived,
          paymentStatus: dto.paymentStatus ?? (
            amountReceived >= totalAmount ? MealPaymentStatus.FULL :
            amountReceived > 0 ? MealPaymentStatus.PARTIAL :
            MealPaymentStatus.AFTER_SERVICE
          ),
          transactionId: dto.transactionId,
          selectedMenuItems: dto.selectedMenuItems ?? [],
          specialMenuItem: dto.specialMenuItem,
          telecallerName: dto.telecallerName,
          bookingStatus: dto.bookingStatus ?? "CONFIRMED",
          donorVisitExpected: dto.donorVisitExpected ?? true,
          occasionType: dto.occasionType ?? MealOccasionType.NONE,
          occasionFor: dto.occasionFor,
          occasionPersonName: dto.occasionPersonName,
          occasionRelationship: dto.occasionRelationship,
          occasionNotes: dto.occasionNotes,
          internalNotes: dto.internalNotes,
          donationId: donation.id,
          createdById,
        },
        include: {
          donor: { select: { id: true, firstName: true, lastName: true, donorCode: true } },
          donation: { select: { id: true, donationAmount: true } },
          createdBy: { select: { name: true } },
        },
      });

      // Auto-cancel HOLD bookings that conflict with this CONFIRMED booking
      if ((meal.bookingStatus as string) === "CONFIRMED") {
        const dayStart = new Date(dto.mealServiceDate + "T00:00:00.000");
        const dayEnd = new Date(dto.mealServiceDate + "T23:59:59.999");

        const holdMeals = await tx.mealSponsorship.findMany({
          where: {
            id: { not: meal.id },
            bookingStatus: "HOLD" as any,
            mealServiceDate: { gte: dayStart, lte: dayEnd },
          },
          select: { id: true, breakfast: true, lunch: true, eveningSnacks: true, dinner: true, homes: true },
        });

        const newHomes = new Set<string>(effectiveHomes as string[]);
        const toCancel = holdMeals
          .filter((h) => {
            const slotOverlap =
              (dto.breakfast && h.breakfast) ||
              (dto.lunch && h.lunch) ||
              (eveningSnacks && h.eveningSnacks) ||
              (dto.dinner && h.dinner);
            const homeOverlap = h.homes.some((home) => newHomes.has(home));
            return slotOverlap && homeOverlap;
          })
          .map((h) => h.id);

        if (toCancel.length > 0) {
          this.logger.log(`Auto-cancelling ${toCancel.length} HOLD booking(s) superseded by CONFIRMED meal ${meal.id}`);
          await tx.mealSponsorship.updateMany({
            where: { id: { in: toCancel } },
            data: { bookingStatus: "CANCELLED" as any },
          });
        }
      }

      return meal;
    });

    // Non-blocking occasion sync — must NOT break meal save if it fails
    if (dto.occasionType && dto.occasionType !== MealOccasionType.NONE) {
      this.syncOccasionToProfile(dto, mealServiceDate, result.donorId).catch((err) => {
        this.logger.warn(`Occasion sync to People & Occasions failed (non-blocking): ${err?.message ?? err}`);
      });
    }

    return result;
  }

  // ─── Occasion sync helpers ────────────────────────────────────────────────

  private async syncOccasionToProfile(
    dto: CreateMealSponsorshipDto,
    mealServiceDate: Date,
    donorId: string,
  ): Promise<void> {
    const mappedType = this.mapMealOccasionToProfileType(
      dto.occasionType as string,
      dto.occasionFor,
      dto.occasionRelationship,
    );
    if (!mappedType) return;

    const month = mealServiceDate.getMonth() + 1;
    const day = mealServiceDate.getDate();
    const relatedPersonName = dto.occasionFor === "OTHER" ? (dto.occasionPersonName ?? null) : null;
    const normalizedName = (relatedPersonName ?? "").toLowerCase().trim();

    // Duplicate guard: same donor + type + month + day + person name
    const existing = await this.prisma.donorSpecialOccasion.findFirst({
      where: { donorId, type: mappedType as any, month, day },
      select: { id: true, relatedPersonName: true },
    });

    if (existing) {
      const existingNorm = (existing.relatedPersonName ?? "").toLowerCase().trim();
      if (existingNorm === normalizedName) {
        this.logger.log(`Occasion sync skipped — duplicate already exists (id=${existing.id})`);
        return;
      }
    }

    await this.prisma.donorSpecialOccasion.create({
      data: {
        donorId,
        type: mappedType as any,
        month,
        day,
        relatedPersonName: relatedPersonName ?? null,
        notes: `Auto-synced from Meal Sponsorship (${dto.occasionType})`,
      },
    });

    this.logger.log(
      `Occasion synced → donor=${donorId} type=${mappedType} date=${day}/${month} person=${relatedPersonName ?? "self"}`,
    );
  }

  private mapMealOccasionToProfileType(
    mealOccasion: string,
    occasionFor?: string,
    relation?: string,
  ): string | null {
    switch (mealOccasion) {
      case "BIRTHDAY":
        if (occasionFor === "SELF") return "DOB_SELF";
        if (occasionFor === "OTHER") {
          if (relation === "SPOUSE") return "DOB_SPOUSE";
          if (relation === "SON" || relation === "DAUGHTER" || relation === "CHILD") return "DOB_CHILD";
          return "OTHER";
        }
        return "DOB_SELF";
      case "WEDDING_ANNIVERSARY":
        return "ANNIVERSARY";
      case "MEMORIAL":
        return "DEATH_ANNIVERSARY";
      case "OTHER":
        return "OTHER";
      default:
        return null;
    }
  }

  async findAll(query: MealSponsorshipQueryDto, user?: MealUserContext) {
    const page = parseInt(query.page ?? "1", 10);
    const limit = parseInt(query.limit ?? "25", 10);
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.mealServiceDate || query.mealServiceDateTo) {
      where.mealServiceDate = {};
      if (query.mealServiceDate) {
        where.mealServiceDate.gte = new Date(query.mealServiceDate);
      }
      if (query.mealServiceDateTo) {
        const endDate = new Date(query.mealServiceDateTo);
        endDate.setHours(23, 59, 59, 999);
        where.mealServiceDate.lte = endDate;
      }
    }

    // HOME_INCHARGE: always scope to their assigned home regardless of query params
    if (user?.role === Role.HOME_INCHARGE) {
      if (!user.assignedHome) throw new ForbiddenException("No assigned home configured for this account");
      where.homes = { has: user.assignedHome as unknown as DonationHomeType };
    } else if (query.home) {
      where.homes = { has: query.home };
    }

    if (query.donorId) {
      where.donorId = query.donorId;
    }

    if (query.sponsorshipType) {
      where.sponsorshipType = query.sponsorshipType;
    }

    if (query.slot === "breakfast") where.breakfast = true;
    if (query.slot === "lunch") where.lunch = true;
    if (query.slot === "evening_snacks") where.eveningSnacks = true;
    if (query.slot === "dinner") where.dinner = true;

    if (query.paymentStatus) {
      where.paymentStatus = query.paymentStatus;
    }

    const [items, total] = await Promise.all([
      this.prisma.mealSponsorship.findMany({
        where,
        skip,
        take: limit,
        orderBy: { mealServiceDate: "desc" },
        include: {
          donor: { select: { id: true, firstName: true, lastName: true, donorCode: true } },
          donation: { select: { id: true, donationAmount: true } },
          createdBy: { select: { name: true } },
          visitRecord: { select: { id: true, visitDate: true } },
        },
      }),
      this.prisma.mealSponsorship.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findPendingActions(user?: MealUserContext) {
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const homeFilter: any =
      user?.role === Role.HOME_INCHARGE && user.assignedHome
        ? { homes: { has: user.assignedHome as unknown as DonationHomeType } }
        : {};

    const meals = await this.prisma.mealSponsorship.findMany({
      where: {
        ...homeFilter,
        OR: [
          { mealServiceDate: { lte: today } },
          { promiseMade: true },
        ],
      },
      orderBy: { mealServiceDate: "asc" },
      include: {
        donor: { select: { id: true, firstName: true, lastName: true, donorCode: true } },
        createdBy: { select: { name: true } },
        visitRecord: { select: { id: true, visitDate: true } },
      },
    });

    return { items: meals };
  }

  async findOne(id: string) {
    const meal = await this.prisma.mealSponsorship.findUnique({
      where: { id },
      include: {
        donor: { select: { id: true, firstName: true, lastName: true, donorCode: true } },
        donation: { select: { id: true, donationAmount: true, receiptNumber: true } },
        createdBy: { select: { name: true } },
        visitRecord: { select: { id: true, visitDate: true } },
      },
    });
    if (!meal) throw new NotFoundException("Meal sponsorship not found");
    return meal;
  }

  async updatePostMeal(id: string, dto: PostMealUpdateDto, updatedById: string, user?: MealUserContext) {
    const meal = await this.findOne(id);

    // HOME_INCHARGE: verify the meal belongs to their home
    if (user?.role === Role.HOME_INCHARGE) {
      if (!user.assignedHome) throw new ForbiddenException("No assigned home configured for this account");
      const mealHomes = (meal as any).homes as string[];
      if (!mealHomes.includes(user.assignedHome)) {
        throw new ForbiddenException("You can only update post-meal details for your assigned home");
      }
    }

    // Validate effective received does not exceed totalAmount
    if (dto.postMealAmountReceived !== undefined && meal.totalAmount) {
      const existingReceived = Number(meal.amountReceived ?? 0);
      const newPostMeal = Number(dto.postMealAmountReceived);
      const effectiveReceived = existingReceived + newPostMeal;
      const total = Number(meal.totalAmount);
      if (effectiveReceived > total * 1.05) {
        throw new BadRequestException(
          `Effective received amount (${effectiveReceived}) would exceed total amount (${total})`,
        );
      }
    }

    const data: any = {};

    if (dto.mealCompleted !== undefined) data.mealCompleted = dto.mealCompleted;
    if (dto.mealCompletedAt !== undefined) data.mealCompletedAt = dto.mealCompletedAt ? new Date(dto.mealCompletedAt) : null;
    if (dto.donorVisited !== undefined) data.donorVisited = dto.donorVisited;
    if (dto.donorVisitNotes !== undefined) data.donorVisitNotes = dto.donorVisitNotes;
    if (dto.balancePaidAfterMeal !== undefined) data.balancePaidAfterMeal = dto.balancePaidAfterMeal;
    if (dto.postMealAmountReceived !== undefined) data.postMealAmountReceived = dto.postMealAmountReceived;
    if (dto.promiseMade !== undefined) data.promiseMade = dto.promiseMade;
    if (dto.promiseNotes !== undefined) data.promiseNotes = dto.promiseNotes;
    if (dto.thankYouSent !== undefined) data.thankYouSent = dto.thankYouSent;
    if (dto.reviewRequested !== undefined) data.reviewRequested = dto.reviewRequested;
    if (dto.askedToSendHi !== undefined) data.askedToSendHi = dto.askedToSendHi;
    if (dto.extraItemsGiven !== undefined) data.extraItemsGiven = dto.extraItemsGiven;
    if (dto.extraItemTypes !== undefined) data.extraItemTypes = dto.extraItemTypes;
    if (dto.extraItemNotes !== undefined) data.extraItemNotes = dto.extraItemNotes;
    if (dto.extraItemEstimatedValue !== undefined) data.extraItemEstimatedValue = dto.extraItemEstimatedValue;

    // ── Phase 3B — Cancellation / Refund ─────────────────────────────────────
    if (dto.mealCancelled !== undefined) data.mealCancelled = dto.mealCancelled;
    if (dto.cancellationBy !== undefined) data.cancellationBy = dto.cancellationBy;
    if (dto.cancellationReason !== undefined) data.cancellationReason = dto.cancellationReason || null;
    if (dto.amountReturned !== undefined) data.amountReturned = dto.amountReturned;
    if (dto.refundAmount !== undefined) data.refundAmount = dto.refundAmount;
    if (dto.refundDate !== undefined) data.refundDate = dto.refundDate ? new Date(dto.refundDate) : null;
    if (dto.refundNotes !== undefined) data.refundNotes = dto.refundNotes || null;

    const [updated] = await this.prisma.$transaction(async (tx) => {
      const updatedMeal = await tx.mealSponsorship.update({
        where: { id },
        data,
        include: {
          donor: { select: { id: true, firstName: true, lastName: true, donorCode: true } },
          donation: { select: { id: true, donationAmount: true } },
          createdBy: { select: { name: true } },
          visitRecord: { select: { id: true, visitDate: true } },
        },
      });

      // ── Donor visit record (duplicate-safe via @unique on mealSponsorshipId) ──
      if (dto.donorVisited === true) {
        const visitDate = dto.mealCompletedAt
          ? new Date(dto.mealCompletedAt)
          : (meal.mealServiceDate ? new Date(meal.mealServiceDate) : new Date());

        await tx.mealVisitRecord.upsert({
          where: { mealSponsorshipId: id },
          create: {
            mealSponsorshipId: id,
            donorId: meal.donorId,
            visitDate,
            notes: dto.donorVisitNotes ?? null,
          },
          update: {
            visitDate,
            notes: dto.donorVisitNotes ?? undefined,
          },
        });
        this.logger.log(`Visit record upserted for meal=${id} donor=${meal.donorId}`);
      } else if (dto.donorVisited === false) {
        await tx.mealVisitRecord.deleteMany({ where: { mealSponsorshipId: id } });
        this.logger.log(`Visit record removed for meal=${id} (donorVisited set to false)`);
      }

      // ── Meal Promise → auto-pledge (duplicate-safe via @unique on mealSponsorshipId) ──
      const promiseMade = dto.promiseMade ?? meal.promiseMade;
      const promiseNotes = dto.promiseNotes ?? meal.promiseNotes ?? "";
      if (promiseMade === true && promiseNotes.trim().length > 0) {
        // Expected 30 days after the meal service date
        const expectedFulfillmentDate = new Date(meal.mealServiceDate);
        expectedFulfillmentDate.setDate(expectedFulfillmentDate.getDate() + 30);

        await tx.pledge.upsert({
          where: { mealSponsorshipId: id },
          create: {
            donorId: meal.donorId,
            pledgeType: PledgeType.MEAL_SPONSOR,
            mealSponsorshipId: id,
            notes: promiseNotes.trim(),
            expectedFulfillmentDate,
            status: PledgeStatus.PENDING,
            createdById: updatedById,
          },
          update: {
            notes: promiseNotes.trim(),
            status: PledgeStatus.PENDING, // restore if it was previously cancelled
            deletedAt: null,
            isDeleted: false,
          },
        });
        this.logger.log(`Pledge upserted for meal promise: meal=${id} donor=${meal.donorId}`);
      } else if (dto.promiseMade === false) {
        // Soft-cancel only the auto-linked pledge (manual pledges unaffected)
        await tx.pledge.updateMany({
          where: { mealSponsorshipId: id, isDeleted: false },
          data: { status: PledgeStatus.CANCELLED, isDeleted: true, deletedAt: new Date() },
        });
        this.logger.log(`Auto-pledge soft-cancelled for meal=${id} (promiseMade unchecked)`);
      }

      return [updatedMeal];
    });

    return updated;
  }

  async update(id: string, dto: UpdateMealSponsorshipDto) {
    await this.findOne(id);

    const data: any = { ...dto };
    if (dto.donationReceivedDate) data.donationReceivedDate = new Date(dto.donationReceivedDate);
    if (dto.mealServiceDate) data.mealServiceDate = new Date(dto.mealServiceDate);
    if (dto.totalAmount !== undefined) {
      data.totalAmount = dto.totalAmount;
      data.amount = dto.totalAmount;
    }
    if (dto.amount !== undefined && dto.totalAmount === undefined) {
      data.amount = dto.amount;
    }

    return this.prisma.mealSponsorship.update({
      where: { id },
      data,
      include: {
        donor: { select: { id: true, firstName: true, lastName: true, donorCode: true } },
        donation: { select: { id: true, donationAmount: true } },
        createdBy: { select: { name: true } },
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.mealSponsorship.delete({ where: { id } });
    return { message: "Meal sponsorship deleted" };
  }

  async quickCreateDonor(
    dto: { firstName: string; lastName?: string; phone: string },
    createdById: string,
  ) {
    const cleaned = dto.phone.replace(/[\s\-\(\)\+\.]/g, "");

    // Check for duplicate by phone
    const existing = await this.prisma.donor.findFirst({
      where: {
        OR: [
          { primaryPhone: cleaned },
          { whatsappPhone: cleaned },
          { alternatePhone: cleaned },
        ],
        isDeleted: false,
      },
      select: { id: true, firstName: true, lastName: true, donorCode: true },
    });

    if (existing) {
      return {
        created: false,
        existed: true,
        donor: {
          id: existing.id,
          firstName: existing.firstName,
          lastName: existing.lastName ?? "",
          donorCode: existing.donorCode,
        },
      };
    }

    const donorCode = `AKF-DNR-${Date.now()}`;
    const donor = await this.prisma.donor.create({
      data: {
        donorCode,
        firstName: dto.firstName.trim(),
        lastName: dto.lastName?.trim() ?? "",
        primaryPhone: cleaned,
        whatsappPhone: cleaned,
        donorSince: new Date(),
        sourceDetails: "Quick add from meals booking form",
        createdById,
      },
      select: { id: true, firstName: true, lastName: true, donorCode: true },
    });

    return { created: true, existed: false, donor };
  }
}
