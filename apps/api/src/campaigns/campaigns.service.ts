import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CampaignStatus } from '@prisma/client';
import { CreateCampaignDto, UpdateCampaignDto, UserContext } from './campaigns.types';
import { CampaignsAnalyticsService } from './campaigns.analytics.service';
import { CampaignsCommunicationsService } from './campaigns.communications.service';

@Injectable()
export class CampaignsService {
  private readonly logger = new Logger(CampaignsService.name);

  constructor(
    private prisma: PrismaService,
    private analyticsService: CampaignsAnalyticsService,
    private communicationsService: CampaignsCommunicationsService,
  ) {}

  async findAll(status?: string) {
    const where: any = { isDeleted: false };
    if (status) {
      where.status = status;
    }

    const campaigns = await this.prisma.campaign.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: { select: { id: true, name: true } },
        donations: {
          where: { isDeleted: false },
          select: {
            id: true,
            donationAmount: true,
            donorId: true,
            donationDate: true,
          },
        },
        _count: {
          select: {
            beneficiaries: true,
            updates: true,
          },
        },
      },
    });

    return campaigns.map((c) => {
      const totalRaised = c.donations.reduce((sum, d) => sum + Number(d.donationAmount), 0);
      const uniqueDonors = new Set(c.donations.map((d) => d.donorId)).size;
      const goalAmount = c.goalAmount ? Number(c.goalAmount) : 0;
      const progressPercent =
        goalAmount > 0 ? Math.min(100, Math.round((totalRaised / goalAmount) * 100)) : 0;

      return {
        id: c.id,
        name: c.name,
        description: c.description,
        startDate: c.startDate,
        endDate: c.endDate,
        goalAmount,
        currency: c.currency,
        status: c.status,
        homeTypes: c.homeTypes,
        createdBy: c.createdBy,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        totalRaised,
        donorCount: uniqueDonors,
        donationCount: c.donations.length,
        progressPercent,
        beneficiaryCount: c._count.beneficiaries,
        updateCount: c._count.updates,
      };
    });
  }

  async findOne(id: string) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, name: true } },
        donations: {
          where: { isDeleted: false },
          orderBy: { donationDate: 'desc' },
          include: {
            donor: {
              select: {
                id: true,
                donorCode: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        beneficiaries: {
          include: {
            beneficiary: {
              select: {
                id: true,
                code: true,
                fullName: true,
                homeType: true,
                photoUrl: true,
                status: true,
                protectPrivacy: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        updates: {
          orderBy: { createdAt: 'desc' },
          include: {
            createdBy: { select: { id: true, name: true } },
            _count: { select: { dispatches: true } },
          },
        },
      },
    });

    if (!campaign || campaign.isDeleted) {
      throw new NotFoundException('Campaign not found');
    }

    const totalRaised = campaign.donations.reduce(
      (sum, d) => sum + Number(d.donationAmount),
      0,
    );
    const uniqueDonors = new Set(campaign.donations.map((d) => d.donorId)).size;
    const goalAmount = campaign.goalAmount ? Number(campaign.goalAmount) : 0;
    const progressPercent =
      goalAmount > 0 ? Math.min(100, Math.round((totalRaised / goalAmount) * 100)) : 0;

    return {
      ...campaign,
      goalAmount,
      totalRaised,
      donorCount: uniqueDonors,
      donationCount: campaign.donations.length,
      progressPercent,
    };
  }

  async create(dto: CreateCampaignDto, user: UserContext) {
    return this.prisma.campaign.create({
      data: {
        name: dto.name,
        description: dto.description,
        goalAmount: dto.goalAmount,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        status: dto.status || CampaignStatus.DRAFT,
        homeTypes: dto.homeTypes || [],
        createdById: user.id,
      },
      include: {
        createdBy: { select: { id: true, name: true } },
      },
    });
  }

  async update(id: string, dto: UpdateCampaignDto) {
    const campaign = await this.prisma.campaign.findUnique({ where: { id } });
    if (!campaign || campaign.isDeleted) {
      throw new NotFoundException('Campaign not found');
    }

    const data: any = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.goalAmount !== undefined) data.goalAmount = dto.goalAmount;
    if (dto.startDate !== undefined) data.startDate = new Date(dto.startDate);
    if (dto.endDate !== undefined) data.endDate = new Date(dto.endDate);
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.homeTypes !== undefined) data.homeTypes = dto.homeTypes;

    return this.prisma.campaign.update({
      where: { id },
      data,
      include: {
        createdBy: { select: { id: true, name: true } },
      },
    });
  }

  async remove(id: string) {
    const campaign = await this.prisma.campaign.findUnique({ where: { id } });
    if (!campaign || campaign.isDeleted) {
      throw new NotFoundException('Campaign not found');
    }

    return this.prisma.campaign.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date() },
    });
  }

  async addBeneficiaries(campaignId: string, beneficiaryIds: string[], notes?: string) {
    const campaign = await this.prisma.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign || campaign.isDeleted) {
      throw new NotFoundException('Campaign not found');
    }

    const results = [];
    for (const beneficiaryId of beneficiaryIds) {
      const beneficiary = await this.prisma.beneficiary.findUnique({
        where: { id: beneficiaryId },
      });
      if (!beneficiary || beneficiary.isDeleted) continue;

      try {
        const cb = await this.prisma.campaignBeneficiary.create({
          data: { campaignId, beneficiaryId, notes },
          include: {
            beneficiary: {
              select: {
                id: true,
                code: true,
                fullName: true,
                homeType: true,
                photoUrl: true,
                status: true,
                protectPrivacy: true,
              },
            },
          },
        });
        results.push(cb);
      } catch (e: any) {
        if (e.code === 'P2002') continue;
        throw e;
      }
    }
    return results;
  }

  async removeBeneficiary(campaignId: string, beneficiaryId: string) {
    const record = await this.prisma.campaignBeneficiary.findUnique({
      where: { campaignId_beneficiaryId: { campaignId, beneficiaryId } },
    });
    if (!record) {
      throw new NotFoundException('Beneficiary not linked to this campaign');
    }
    return this.prisma.campaignBeneficiary.delete({
      where: { id: record.id },
    });
  }

  async getBeneficiaries(campaignId: string) {
    const campaign = await this.prisma.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign || campaign.isDeleted) {
      throw new NotFoundException('Campaign not found');
    }

    return this.prisma.campaignBeneficiary.findMany({
      where: { campaignId },
      include: {
        beneficiary: {
          select: {
            id: true,
            code: true,
            fullName: true,
            homeType: true,
            photoUrl: true,
            status: true,
            protectPrivacy: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createUpdate(
    campaignId: string,
    dto: { title: string; content: string; photoUrls?: string[] },
    user: UserContext,
  ) {
    const campaign = await this.prisma.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign || campaign.isDeleted) {
      throw new NotFoundException('Campaign not found');
    }

    return this.prisma.campaignUpdate.create({
      data: {
        campaignId,
        title: dto.title,
        content: dto.content,
        photoUrls: dto.photoUrls || [],
        createdById: user.id,
      },
      include: {
        createdBy: { select: { id: true, name: true } },
      },
    });
  }

  async getUpdates(campaignId: string) {
    const campaign = await this.prisma.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign || campaign.isDeleted) {
      throw new NotFoundException('Campaign not found');
    }

    return this.prisma.campaignUpdate.findMany({
      where: { campaignId },
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: { select: { id: true, name: true } },
      },
    });
  }

  async deleteUpdate(campaignId: string, updateId: string) {
    const update = await this.prisma.campaignUpdate.findFirst({
      where: { id: updateId, campaignId },
    });
    if (!update) {
      throw new NotFoundException('Campaign update not found');
    }
    return this.prisma.campaignUpdate.delete({ where: { id: updateId } });
  }

  async getDonors(campaignId: string) {
    const campaign = await this.prisma.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign || campaign.isDeleted) {
      throw new NotFoundException('Campaign not found');
    }

    const donations = await this.prisma.donation.findMany({
      where: { campaignId, isDeleted: false },
      include: {
        donor: {
          select: {
            id: true,
            donorCode: true,
            firstName: true,
            lastName: true,
            primaryPhone: true,
            personalEmail: true,
            officialEmail: true,
            city: true,
          },
        },
      },
    });

    const donorMap = new Map<
      string,
      {
        donor: any;
        totalAmount: number;
        donationCount: number;
        lastDonation: Date;
        firstDonation: Date;
      }
    >();

    for (const d of donations) {
      const existing = donorMap.get(d.donorId);
      const amount = Number(d.donationAmount);
      const date = new Date(d.donationDate);
      if (existing) {
        existing.totalAmount += amount;
        existing.donationCount++;
        if (date > existing.lastDonation) existing.lastDonation = date;
        if (date < existing.firstDonation) existing.firstDonation = date;
      } else {
        donorMap.set(d.donorId, {
          donor: d.donor,
          totalAmount: amount,
          donationCount: 1,
          lastDonation: date,
          firstDonation: date,
        });
      }
    }

    return Array.from(donorMap.values()).sort((a, b) => b.totalAmount - a.totalAmount);
  }

  async getAnalytics(campaignId: string) {
    return this.analyticsService.getAnalytics(campaignId);
  }

  async getTimeline(id: string) {
    return this.analyticsService.getTimeline(id);
  }

  async generateWhatsAppAppeal(campaign: any): Promise<string> {
    return this.communicationsService.generateWhatsAppAppeal(campaign);
  }

  async getWhatsAppAppeal(id: string) {
    const campaign = await this.findOne(id);
    return this.communicationsService.getWhatsAppAppeal(campaign);
  }

  async sendEmailAppeal(id: string, donorIds: string[], user: UserContext) {
    const campaign = await this.findOne(id);
    return this.communicationsService.sendEmailAppeal(campaign, donorIds, user);
  }

  async broadcastUpdate(
    campaignId: string,
    updateId: string,
    donorIds: string[],
    user: UserContext,
  ) {
    return this.communicationsService.broadcastUpdate(campaignId, updateId, donorIds, user);
  }

  async logWhatsAppBroadcast(
    campaignId: string,
    updateId: string,
    donorId: string,
    user: UserContext,
  ) {
    return this.communicationsService.logWhatsAppBroadcast(
      campaignId,
      updateId,
      donorId,
      user,
    );
  }

  async getUpdateWhatsAppText(campaignId: string, updateId: string) {
    return this.communicationsService.getUpdateWhatsAppText(campaignId, updateId);
  }

  async getUpdateDispatches(campaignId: string, updateId: string) {
    return this.communicationsService.getUpdateDispatches(campaignId, updateId);
  }
}
