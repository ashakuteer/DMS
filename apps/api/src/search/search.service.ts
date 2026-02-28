import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { HomeType, BeneficiaryStatus, CampaignStatus, DonorCategory } from '@prisma/client';

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
  constructor(private prisma: PrismaService) {}

  async globalSearch(query: string, limit: number = 5, filters: SearchFilters = {}): Promise<SearchResult> {
    const trimmed = query.trim();
    const hasFilters = Object.values(filters).some((v) => v && v !== '');
    
    if ((!trimmed || trimmed.length < 2) && !hasFilters) {
      return { donors: [], beneficiaries: [], donations: [], campaigns: [] };
    }

    const searchTerm = trimmed.length >= 2 ? trimmed : '';
    const isNumeric = searchTerm ? /^\d+(\.\d+)?$/.test(searchTerm) : false;
    const entityType = filters.entityType;

    const promises: [
      Promise<SearchResult['donors']>,
      Promise<SearchResult['beneficiaries']>,
      Promise<SearchResult['donations']>,
      Promise<SearchResult['campaigns']>,
    ] = [
      (!entityType || entityType === 'donors') ? this.searchDonors(searchTerm, limit, filters) : Promise.resolve([]),
      (!entityType || entityType === 'beneficiaries') ? this.searchBeneficiaries(searchTerm, limit, filters) : Promise.resolve([]),
      (!entityType || entityType === 'donations') ? this.searchDonations(searchTerm, isNumeric ? parseFloat(searchTerm) : null, limit) : Promise.resolve([]),
      (!entityType || entityType === 'campaigns') ? this.searchCampaigns(searchTerm, limit, filters) : Promise.resolve([]),
    ];

    const [donors, beneficiaries, donations, campaigns] = await Promise.all(promises);
    return { donors, beneficiaries, donations, campaigns };
  }

  private async searchDonors(searchTerm: string, limit: number, filters: SearchFilters = {}) {
    const where: any = { deletedAt: null };
    const andConditions: any[] = [];

    if (searchTerm) {
      andConditions.push({
        OR: [
          { firstName: { contains: searchTerm, mode: 'insensitive' } },
          { lastName: { contains: searchTerm, mode: 'insensitive' } },
          { donorCode: { contains: searchTerm, mode: 'insensitive' } },
          { primaryPhone: { contains: searchTerm, mode: 'insensitive' } },
          { whatsappPhone: { contains: searchTerm, mode: 'insensitive' } },
          { personalEmail: { contains: searchTerm, mode: 'insensitive' } },
          { officialEmail: { contains: searchTerm, mode: 'insensitive' } },
        ],
      });
    }

    if (filters.donorCategory && Object.values(DonorCategory).includes(filters.donorCategory as DonorCategory)) {
      andConditions.push({ category: filters.donorCategory as DonorCategory });
    }

    if (filters.donorCity) {
      andConditions.push({ city: { contains: filters.donorCity, mode: 'insensitive' } });
    }

    if (andConditions.length > 0) {
      where.AND = andConditions;
    }

    if (!searchTerm && andConditions.length === 0) return [];

    const donors = await this.prisma.donor.findMany({
      where,
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
      orderBy: { firstName: 'asc' },
    });

    return donors.map((d) => ({
      id: d.id,
      donorCode: d.donorCode,
      name: [d.firstName, d.middleName, d.lastName].filter(Boolean).join(' '),
      phone: d.primaryPhone,
      email: d.personalEmail,
      city: d.city,
      category: d.category,
    }));
  }

  private async searchBeneficiaries(searchTerm: string, limit: number, filters: SearchFilters = {}) {
    const where: any = { deletedAt: null };
    const andConditions: any[] = [];

    if (searchTerm) {
      const termUpper = searchTerm.toUpperCase().replace(/\s+/g, '_');
      const matchingHomeTypes = Object.values(HomeType).filter(
        (ht) => ht.includes(termUpper) || ht.replace(/_/g, ' ').toLowerCase().includes(searchTerm.toLowerCase()),
      );

      const orConditions: any[] = [
        { fullName: { contains: searchTerm, mode: 'insensitive' } },
        { code: { contains: searchTerm, mode: 'insensitive' } },
      ];
      if (matchingHomeTypes.length > 0) {
        orConditions.push({ homeType: { in: matchingHomeTypes } });
      }
      andConditions.push({ OR: orConditions });
    }

    if (filters.beneficiaryHomeType && Object.values(HomeType).includes(filters.beneficiaryHomeType as HomeType)) {
      andConditions.push({ homeType: filters.beneficiaryHomeType as HomeType });
    }

    if (filters.beneficiaryStatus && Object.values(BeneficiaryStatus).includes(filters.beneficiaryStatus as BeneficiaryStatus)) {
      andConditions.push({ status: filters.beneficiaryStatus as BeneficiaryStatus });
    }

    if (filters.beneficiaryAgeGroup) {
      const ageRange = this.getAgeRange(filters.beneficiaryAgeGroup);
      if (ageRange) {
        andConditions.push({
          OR: [
            { approxAge: { gte: ageRange.min, lte: ageRange.max } },
          ],
        });
      }
    }

    if (filters.beneficiarySponsored === 'true') {
      andConditions.push({
        sponsorships: {
          some: {
            status: 'ACTIVE',
          },
        },
      });
    } else if (filters.beneficiarySponsored === 'false') {
      andConditions.push({
        sponsorships: {
          none: {
            status: 'ACTIVE',
          },
        },
      });
    }

    if (andConditions.length > 0) {
      where.AND = andConditions;
    }

    if (!searchTerm && andConditions.length === 0) return [];

    const beneficiaries = await this.prisma.beneficiary.findMany({
      where,
      select: {
        id: true,
        code: true,
        fullName: true,
        homeType: true,
        status: true,
        approxAge: true,
        sponsorships: {
          where: { status: 'ACTIVE' },
          select: { id: true },
          take: 1,
        },
      },
      take: limit,
      orderBy: { fullName: 'asc' },
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
      case '0-10': return { min: 0, max: 10 };
      case '11-18': return { min: 11, max: 18 };
      case '19-30': return { min: 19, max: 30 };
      case '31-50': return { min: 31, max: 50 };
      case '51-70': return { min: 51, max: 70 };
      case '71+': return { min: 71, max: 200 };
      default: return null;
    }
  }

  private async searchDonations(searchTerm: string, numericValue: number | null, limit: number) {
    if (!searchTerm) return [];

    const orConditions: any[] = [
      { receiptNumber: { contains: searchTerm, mode: 'insensitive' } },
      { transactionId: { contains: searchTerm, mode: 'insensitive' } },
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
      orderBy: { donationDate: 'desc' },
    });

    return donations.map((d) => ({
      id: d.id,
      receiptNumber: d.receiptNumber,
      amount: Number(d.donationAmount),
      donorName: [d.donor?.firstName, d.donor?.lastName].filter(Boolean).join(' '),
      donorId: d.donorId,
      date: d.donationDate,
      type: d.donationType,
    }));
  }

  private async searchCampaigns(searchTerm: string, limit: number, filters: SearchFilters = {}) {
    const where: any = { deletedAt: null };
    const andConditions: any[] = [];

    if (searchTerm) {
      andConditions.push({
        OR: [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { description: { contains: searchTerm, mode: 'insensitive' } },
        ],
      });
    }

    if (filters.campaignStatus && Object.values(CampaignStatus).includes(filters.campaignStatus as CampaignStatus)) {
      andConditions.push({ status: filters.campaignStatus as CampaignStatus });
    }

    if (filters.campaignStartFrom) {
      andConditions.push({ startDate: { gte: new Date(filters.campaignStartFrom) } });
    }
    if (filters.campaignStartTo) {
      andConditions.push({ startDate: { lte: new Date(filters.campaignStartTo) } });
    }

    if (andConditions.length > 0) {
      where.AND = andConditions;
    }

    if (!searchTerm && andConditions.length === 0) return [];

    const campaigns = await this.prisma.campaign.findMany({
      where,
      select: {
        id: true,
        name: true,
        status: true,
        goalAmount: true,
        startDate: true,
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
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
