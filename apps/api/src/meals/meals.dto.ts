import {
  IsString,
  IsEnum,
  IsBoolean,
  IsOptional,
  IsDateString,
  IsArray,
  IsNumber,
  Min,
  Max,
  ArrayMinSize,
  ValidateIf,
} from "class-validator";
import {
  DonationHomeType,
  MealSponsorshipType,
  MealFoodType,
  MealPaymentType,
  MealPaymentStatus,
  MealOccasionType,
  MealOccasionFor,
  CancellationBy,
  MealBookingStatus,
} from "@prisma/client";

export class CreateMealSponsorshipDto {
  @IsString()
  donorId: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsEnum(DonationHomeType, { each: true })
  homes: DonationHomeType[];

  @IsOptional()
  slotHomes?: Record<string, string[]>;

  @IsEnum(MealSponsorshipType)
  sponsorshipType: MealSponsorshipType;

  @IsBoolean()
  breakfast: boolean;

  @IsBoolean()
  lunch: boolean;

  @IsOptional()
  @IsBoolean()
  eveningSnacks?: boolean;

  @IsBoolean()
  dinner: boolean;

  @IsEnum(MealFoodType)
  foodType: MealFoodType;

  @IsOptional()
  @IsString()
  mealNotes?: string;

  @IsDateString()
  donationReceivedDate: string;

  @IsDateString()
  mealServiceDate: string;

  @IsOptional()
  @IsEnum(MealPaymentType)
  paymentType?: MealPaymentType;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsNumber()
  @Min(0)
  totalAmount: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  amountReceived?: number;

  @IsOptional()
  @IsEnum(MealPaymentStatus)
  paymentStatus?: MealPaymentStatus;

  @IsOptional()
  @IsString()
  transactionId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  selectedMenuItems?: string[];

  @IsOptional()
  @IsString()
  specialMenuItem?: string;

  @IsOptional()
  @IsString()
  telecallerName?: string;

  @IsOptional()
  @IsEnum(MealBookingStatus)
  bookingStatus?: MealBookingStatus;

  @IsOptional()
  @IsBoolean()
  donorVisitExpected?: boolean;

  @IsOptional()
  @IsEnum(MealOccasionType)
  occasionType?: MealOccasionType;

  @IsOptional()
  @IsEnum(MealOccasionFor)
  occasionFor?: MealOccasionFor;

  @IsOptional()
  @IsString()
  occasionPersonName?: string;

  @IsOptional()
  @IsString()
  occasionRelationship?: string;

  @IsOptional()
  @IsString()
  occasionNotes?: string;

  @IsOptional()
  @IsString()
  internalNotes?: string;
}

export class UpdateMealSponsorshipDto {
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsEnum(DonationHomeType, { each: true })
  homes?: DonationHomeType[];

  @IsOptional()
  slotHomes?: Record<string, string[]>;

  @IsOptional()
  @IsEnum(MealSponsorshipType)
  sponsorshipType?: MealSponsorshipType;

  @IsOptional()
  @IsBoolean()
  breakfast?: boolean;

  @IsOptional()
  @IsBoolean()
  lunch?: boolean;

  @IsOptional()
  @IsBoolean()
  eveningSnacks?: boolean;

  @IsOptional()
  @IsBoolean()
  dinner?: boolean;

  @IsOptional()
  @IsEnum(MealFoodType)
  foodType?: MealFoodType;

  @IsOptional()
  @IsString()
  mealNotes?: string;

  @IsOptional()
  @IsDateString()
  donationReceivedDate?: string;

  @IsOptional()
  @IsDateString()
  mealServiceDate?: string;

  @IsOptional()
  @IsEnum(MealPaymentType)
  paymentType?: MealPaymentType;

  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  totalAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  amountReceived?: number;

  @IsOptional()
  @IsEnum(MealPaymentStatus)
  paymentStatus?: MealPaymentStatus;

  @IsOptional()
  @IsString()
  transactionId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  selectedMenuItems?: string[];

  @IsOptional()
  @IsString()
  specialMenuItem?: string;

  @IsOptional()
  @IsString()
  telecallerName?: string;

  @IsOptional()
  @IsEnum(MealBookingStatus)
  bookingStatus?: MealBookingStatus;

  @IsOptional()
  @IsBoolean()
  donorVisitExpected?: boolean;

  @IsOptional()
  @IsEnum(MealOccasionType)
  occasionType?: MealOccasionType;

  @IsOptional()
  @IsEnum(MealOccasionFor)
  occasionFor?: MealOccasionFor;

  @IsOptional()
  @IsString()
  occasionPersonName?: string;

  @IsOptional()
  @IsString()
  occasionRelationship?: string;

  @IsOptional()
  @IsString()
  occasionNotes?: string;

  @IsOptional()
  @IsString()
  internalNotes?: string;
}

export class PostMealUpdateDto {
  @IsOptional()
  @IsBoolean()
  mealCompleted?: boolean;

  @IsOptional()
  @IsDateString()
  mealCompletedAt?: string;

  @IsOptional()
  @IsBoolean()
  donorVisited?: boolean;

  @IsOptional()
  @IsString()
  donorVisitNotes?: string;

  @IsOptional()
  @IsBoolean()
  balancePaidAfterMeal?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  postMealAmountReceived?: number;

  @IsOptional()
  @IsBoolean()
  promiseMade?: boolean;

  @IsOptional()
  @IsString()
  promiseNotes?: string;

  @IsOptional()
  @IsBoolean()
  thankYouSent?: boolean;

  @IsOptional()
  @IsBoolean()
  reviewRequested?: boolean;

  @IsOptional()
  @IsBoolean()
  askedToSendHi?: boolean;

  @IsOptional()
  @IsBoolean()
  extraItemsGiven?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  extraItemTypes?: string[];

  @IsOptional()
  @IsString()
  extraItemNotes?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  extraItemEstimatedValue?: number;

  // ── Phase 3B — Cancellation / Refund ─────────────────────────────────────
  @IsOptional()
  @IsBoolean()
  mealCancelled?: boolean;

  @IsOptional()
  @IsEnum(CancellationBy)
  cancellationBy?: CancellationBy;

  @IsOptional()
  @IsString()
  cancellationReason?: string;

  @IsOptional()
  @IsBoolean()
  amountReturned?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  refundAmount?: number;

  @IsOptional()
  @IsDateString()
  refundDate?: string;

  @IsOptional()
  @IsString()
  refundNotes?: string;
}

export class MealSponsorshipQueryDto {
  @IsOptional()
  @IsString()
  mealServiceDate?: string;

  @IsOptional()
  @IsString()
  mealServiceDateTo?: string;

  @IsOptional()
  @IsEnum(DonationHomeType)
  home?: DonationHomeType;

  @IsOptional()
  @IsString()
  donorId?: string;

  @IsOptional()
  @IsEnum(MealSponsorshipType)
  sponsorshipType?: MealSponsorshipType;

  @IsOptional()
  @IsString()
  slot?: "breakfast" | "lunch" | "evening_snacks" | "dinner";

  @IsOptional()
  @IsString()
  paymentStatus?: string;

  @IsOptional()
  @IsString()
  bookingStatus?: string;

  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  limit?: string;
}
