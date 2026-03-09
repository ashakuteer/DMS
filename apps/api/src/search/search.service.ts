import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import {
  HomeType,
  BeneficiaryStatus,
  CampaignStatus,
  DonorCategory,
  Prisma,
} from "@prisma/client";

export interface SearchFilters {
  donorCategory?: string;
  donorCity?: string;
  beneficiaryHomeType?: string;
  beneficiaryStatus?: string;
  beneficiaryAgeGroup?: string;
  beneficiarySponsored?: string;
  campaignStatus?: string;
  campaignStartFrom?: string;
  campaignStartTo?: string;
  entityType?: string;
}

export interface SearchResult {
  donors: Array<{
    id: string;
    donorCode: string;
    name: string;
    phone: string | null;
    email: string | null;
    city: string | null;
    category: string | null;
  }>;
  beneficiaries: Array<{
    id: string;
    code: string;
    fullName: string;
    homeType: string | null;
    status: string;
    age: number | null;
    sponsored: boolean;
  }>;
  donations: Array<{
    id: string;
    receiptNumber: string | null;
    amount: number;
    donorName: string;
    donorId: string;
    date: Date;
    type: string;
  }>;
  campaigns: Array<{
    id: string;
    name: string;
    status: string;
    goalAmount: number | null;
    startDate: Date | null;
  }>;
}

@Injectable()
export class SearchService {
  private readonly DEFAULT_LIMIT = 5;
  private readonly MAX_LIMIT = 20;

  constructor(private readonly prisma: PrismaService) {}

  async globalSearch(
    query: string,
    limit: number = this.DEFAULT_LIMIT,
    filters: SearchFilters = {},
  ): Promise<SearchResult> {
    const trimmed = (query ?? "").trim();
    const normalizedFilters = this.normalizeFilters(filters);
    const hasFilters = Object.values(normalizedFilters).some(
      (v) => v !== undefined && v !== null && v !== "",
    );

    const safeLimit = this.getSafeLimit(limit);

    // Empty query protection
    if (trimmed.length < 2 && !hasFilters) {
      return {
        donors: [],
        beneficiaries: [],
        donations: [],
        campaigns: [],
      };
    }

    const searchTerm = trimmed.length >= 2 ? trimmed : "";
    const isNumeric = searchTerm ? /^\d+(\.\d{1,2})?$/.test(searchTerm) : false;
    const numericValue = isNumeric ? Number(searchTerm) : null;
    const entityType = normalizedFilters.entityType;

    const donorPromise =
      !entityType || entityType === "donors"
        ? this.searchDonors(searchTerm, safeLimit, normalizedFilters)
        : Promise.resolve([]);

    const beneficiaryPromise =
      !entityType || entityType === "beneficiaries"
        ? this.searchBeneficiaries(searchTerm, safeLimit, normalizedFilters)
        : Promise.resolve([]);

    const donationPromise =
      !entityType || entityType === "donations"
        ? this.searchDonations(searchTerm, numericValue, safeLimit)
        : Promise.resolve([]);

    const campaignPromise =
      !entityType || entityType === "campaigns"
        ? this.searchCampaigns(searchTerm, safeLimit, normalizedFilters)
        : Promise.resolve([]);

    const [donors, beneficiaries, donations, campaigns] = await Promise.all([
      donorPromise,
      beneficiaryPromise,
      donationPromise,
      campaignPromise,
    ]);

    return { donors, beneficiaries, donations, campaigns };
  }

  private getSafeLimit(limit: number): number {
    if (!Number.isFinite(limit) || limit <= 0) {
      return this.DEFAULT_LIMIT;
    }
    return Math.min(Math.floor(limit), this.MAX_LIMIT);
  }

  private normalizeFilters(filters: SearchFilters): SearchFilters {
    return {
      donorCategory: this.clean(filters.donorCategory),
      donorCity: this.clean(filters.donorCity),
      beneficiaryHomeType: this.clean(filters.beneficiaryHomeType),
      beneficiaryStatus: this.clean(filters.beneficiaryStatus),
      beneficiaryAgeGroup: this.clean(filters.beneficiaryAgeGroup),
      beneficiarySponsored: this.clean(filters.beneficiarySponsored),
      campaignStatus: this.clean(filters.campaignStatus),
      campaignStartFrom: this.clean(filters.campaignStartFrom),
      campaignStartTo: this.clean(filters.campaignStartTo),
      entityType: this.clean(filters.entityType),
    };
  }

  private clean(value?: string): string | undefined {
    if (typeof value !== "string") return undefined;
    const trimmed = value.trim();
    return trimmed ? trimmed : undefined;
  }

  private toValidDate(value?: string): Date | undefined {
    if (!value) return undefined;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? undefined : date;
  }

  private async searchDonors(
    searchTerm: string,
    limit: number,
    filters: SearchFilters = {},
  ) {
    const andConditions: Prisma.DonorWhereInput[] = [{ deletedAt: null }];

    if (searchTerm) {
      // Prefer startsWith for better index usage where possible.
      // Keep contains only for fields where partial lookup matters.
      andConditions.push({
        OR: [
          { firstName: { startsWith: searchTerm, mode: "insensitive" } },
          { lastName: { startsWith: searchTerm, mode: "insensitive" } },
          { donorCode: { contains: searchTerm, mode: "insensitive" } },
          { primaryPhone: { contains: searchTerm, mode: "insensitive" } },
          { whatsappPhone: { contains: searchTerm, mode: "insensitive" } },
          { personalEmail: { startsWith: searchTerm, mode: "insensitive" } },
          { officialEmail: { startsWith: searchTerm, mode: "insensitive" } },
        ],
      });
    }

    if (
      filters.donorCategory &&
      Object.values(DonorCategory).includes(filters.donorCategory as DonorCategory)
    ) {
      andConditions.push({
        category: filters.donorCategory as DonorCategory,
      });
    }

    if (filters.donorCity) {
      andConditions.push({
        city: { startsWith: filters.donorCity, mode: "insensitive" },
      });
    }

    if (andConditions.length === 1 && !searchTerm && !filters.donorCategory && !filters.donorCity) {
      return [];
    }

    const donors = await this.prisma.donor.findMany({
      where: { AND: andConditions },
      select: {
        id: true,
        donorCode: true,
        firstName: true,
        middleName: true,
        lastName: true,
        primaryPhone: true,
        personalEmail: true,
        city: true,
        category: true,
      },
      take: limit,
      orderBy: [
        { firstName: "asc" },
        { lastName: "asc" },
      ],
    });

    return donors.map((d) => ({
      id: d.id,
      donorCode: d.donorCode,
      name: [d.firstName, d.middleName, d.lastName].filter(Boolean).join(" "),
      phone: d.primaryPhone,
      email: d.personalEmail,
      city: d.city,
      category: d.category,
    }));
  }

  private async searchBeneficiaries(
    searchTerm: string,
    limit: number,
    filters: SearchFilters = {},
  ) {
    const andConditions: Prisma.BeneficiaryWhereInput[] = [{ deletedAt: null }];

    if (searchTerm) {
      const termUpper = searchTerm.toUpperCase().replace(/\s+/g, "_");
      const lowerSearch = searchTerm.toLowerCase();

      const matchingHomeTypes = Object.values(HomeType).filter(
        (ht) =>
          ht.includes(termUpper) ||
          ht.replace(/_/g, " ").toLowerCase().includes(lowerSearch),
      );

      const orConditions: Prisma.BeneficiaryWhereInput[] = [
        { fullName: { startsWith: searchTerm, mode: "insensitive" } },
        { code: { contains: searchTerm, mode: "insensitive" } },
      ];

      if (matchingHomeTypes.length > 0) {
        orConditions.push({ homeType: { in: matchingHomeTypes } });
      }

      andConditions.push({ OR: orConditions });
    }

    if (
      filters.beneficiaryHomeType &&
      Object.values(HomeType).includes(filters.beneficiaryHomeType as HomeType)
    ) {
      andConditions.push({
        homeType: filters.beneficiaryHomeType as HomeType,
      });
    }

    if (
      filters.beneficiaryStatus &&
      Object.values(BeneficiaryStatus).includes(
        filters.beneficiaryStatus as BeneficiaryStatus,
      )
    ) {
      andConditions.push({
        status: filters.beneficiaryStatus as BeneficiaryStatus,
      });
    }

    if (filters.beneficiaryAgeGroup) {
      const ageRange = this.getAgeRange(filters.beneficiaryAgeGroup);
      if (ageRange) {
        andConditions.push({
          approxAge: {
            gte: ageRange.min,
            lte: ageRange.max,
          },
        });
      }
    }

    if (filters.beneficiarySponsored === "true") {
      andConditions.push({
        sponsorships: {
          some: {
            status: "ACTIVE",
          },
        },
      });
    } else if (filters.beneficiarySponsored === "false") {
      andConditions.push({
        sponsorships: {
          none: {
            status: "ACTIVE",
          },
        },
      });
    }

    if (
      andConditions.length === 1 &&
      !searchTerm &&
      !filters.beneficiaryHomeType &&
      !filters.beneficiaryStatus &&
      !filters.beneficiaryAgeGroup &&
      filters.beneficiarySponsored === undefined
    ) {
      return [];
    }

    const beneficiaries = await this.prisma.beneficiary.findMany({
      where: { AND: andConditions },
      select: {
        id: true,
        code: true,
        fullName: true,
        homeType: true,
        status: true,
        approxAge: true,
        sponsorships: {
          where: { status: "ACTIVE" },
          select: { id: true },
          take: 1,
        },
      },
      take: limit,
      orderBy: [{ fullName: "asc" }],
    });

    return beneficiaries.map((b) => ({
      id: b.id,
      code: b.code,
      fullName: b.fullName,
      homeType: b.homeType,
      status: b.status,
      age: b.approxAge,
      sponsored: b.sponsorships.length > 0,
    }));
  }

  private getAgeRange(ageGroup: string): { min: number; max: number } | null {
    switch (ageGroup) {
      case "0-10":
        return { min: 0, max: 10 };
      case "11-18":
        return { min: 11, max: 18 };
      case "19-30":
        return { min: 19, max: 30 };
      case "31-50":
        return { min: 31, max: 50 };
      case "51-70":
        return { min: 51, max: 70 };
      case "71+":
        return { min: 71, max: 200 };
      default:
        return null;
    }
  }

  private async searchDonations(
    searchTerm: string,
    numericValue: number | null,
    limit: number,
  ) {
    if (!searchTerm) return [];

    const orConditions: Prisma.DonationWhereInput[] = [
      { receiptNumber: { contains: searchTerm, mode: "insensitive" } },
      { transactionId: { contains: searchTerm, mode: "insensitive" } },
    ];

    if (numericValue !== null) {
      orConditions.push({ donationAmount: numericValue });
    }

    const donations = await this.prisma.donation.findMany({
      where: {
        deletedAt: null,
        OR: orConditions,
      },
      select: {
        id: true,
        receiptNumber: true,
        donationAmount: true,
        donationDate: true,
        donationType: true,
        donorId: true,
        donor: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      take: limit,
      orderBy: [{ donationDate: "desc" }],
    });

    return donations.map((d) => ({
      id: d.id,
      receiptNumber: d.receiptNumber,
      amount: Number(d.donationAmount),
      donorName: [d.donor?.firstName, d.donor?.lastName].filter(Boolean).join(" "),
      donorId: d.donorId,
      date: d.donationDate,
      type: d.donationType,
    }));
  }

  private async searchCampaigns(
    searchTerm: string,
    limit: number,
    filters: SearchFilters = {},
  ) {
    const andConditions: Prisma.CampaignWhereInput[] = [{ deletedAt: null }];

    if (searchTerm) {
      // Avoid searching description unless really needed.
      // Description search is expensive on large text columns.
      andConditions.push({
        OR: [
          { name: { startsWith: searchTerm, mode: "insensitive" } },
        ],
      });
    }

    if (
      filters.campaignStatus &&
      Object.values(CampaignStatus).includes(filters.campaignStatus as CampaignStatus)
    ) {
      andConditions.push({
        status: filters.campaignStatus as CampaignStatus,
      });
    }

    const startFrom = this.toValidDate(filters.campaignStartFrom);
    const startTo = this.toValidDate(filters.campaignStartTo);

    if (filters.campaignStartFrom && !startFrom) {
      throw new BadRequestException("Invalid campaignStartFrom date");
    }

    if (filters.campaignStartTo && !startTo) {
      throw new BadRequestException("Invalid campaignStartTo date");
    }

    if (startFrom) {
      andConditions.push({ startDate: { gte: startFrom } });
    }

    if (startTo) {
      andConditions.push({ startDate: { lte: startTo } });
    }

    if (
      andConditions.length === 1 &&
      !searchTerm &&
      !filters.campaignStatus &&
      !filters.campaignStartFrom &&
      !filters.campaignStartTo
    ) {
      return [];
    }

    const campaigns = await this.prisma.campaign.findMany({
      where: { AND: andConditions },
      select: {
        id: true,
        name: true,
        status: true,
        goalAmount: true,
        startDate: true,
      },
      take: limit,
      orderBy: [{ createdAt: "desc" }],
    });

    return campaigns.map((c) => ({
      id: c.id,
      name: c.name,
      status: c.status,
      goalAmount: c.goalAmount ? Number(c.goalAmount) : null,
      startDate: c.startDate,
    }));
  }
}
