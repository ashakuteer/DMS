import { Injectable, NotFoundException, BadRequestException, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { DonationHomeType, DonationType, DonationPurpose, MealOccasionType, MealPaymentStatus } from "@prisma/client";
import {
  CreateMealSponsorshipDto,
  UpdateMealSponsorshipDto,
  MealSponsorshipQueryDto,
} from "./meals.dto";

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
    if (!dto.homes || dto.homes.length === 0) {
      throw new BadRequestException("At least one home must be selected");
    }

    const totalAmount = dto.totalAmount ?? dto.amount;
    const amountReceived = dto.amountReceived ?? 0;

    if (amountReceived > totalAmount) {
      throw new BadRequestException("Amount received cannot exceed total amount");
    }

    const mealServiceDate = new Date(dto.mealServiceDate);
    const donationReceivedDate = new Date(dto.donationReceivedDate);

    const slotsDesc = this.buildMealSlotDescription(dto.breakfast, dto.lunch, eveningSnacks, dto.dinner);
    const homesDesc = this.buildHomesDescription(dto.homes);
    const remarks = `Meal Sponsorship — ${slotsDesc} | Homes: ${homesDesc} | Meal Date: ${mealServiceDate.toLocaleDateString("en-IN")}${dto.occasionType && dto.occasionType !== MealOccasionType.NONE ? ` | Occasion: ${dto.occasionType}` : ""}`;

    const primaryHome = dto.homes[0];

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
          homes: dto.homes,
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
          occasionType: dto.occasionType ?? MealOccasionType.NONE,
          occasionFor: dto.occasionFor,
          occasionPersonName: dto.occasionPersonName,
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

      return meal;
    });

    return result;
  }

  async findAll(query: MealSponsorshipQueryDto) {
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

    if (query.home) {
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

  async findOne(id: string) {
    const meal = await this.prisma.mealSponsorship.findUnique({
      where: { id },
      include: {
        donor: { select: { id: true, firstName: true, lastName: true, donorCode: true } },
        donation: { select: { id: true, donationAmount: true, receiptNumber: true } },
        createdBy: { select: { name: true } },
      },
    });
    if (!meal) throw new NotFoundException("Meal sponsorship not found");
    return meal;
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
}
