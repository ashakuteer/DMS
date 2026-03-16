import { Injectable, Logger, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailJobsService } from '../email-jobs/email-jobs.service';
import { CommunicationLogService  } from '../communication-log/communication-log.service';
import { OrganizationProfileService } from '../organization-profile/organization-profile.service';
import { CampaignStatus, CommunicationType, HomeType, SponsorDispatchChannel, SponsorDispatchStatus } from '@prisma/client';

interface CreateCampaignDto {
  name: string;
  description?: string;
  goalAmount?: number;
  startDate?: string;
  endDate?: string;
  status?: CampaignStatus;
  homeTypes?: HomeType[];
}

interface UpdateCampaignDto extends Partial<CreateCampaignDto> {}

interface UserContext {
  id: string;
  role: string;
  email: string;
}

@Injectable()
export class CampaignsService {
  private readonly logger = new Logger(CampaignsService.name);

  constructor(
    private prisma: PrismaService,
    private emailJobsService: EmailJobsService,
    private communicationLogService: CommunicationLogService,
    private orgProfileService: OrganizationProfileService,
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
      const totalRaised = c.donations.reduce(
        (sum, d) => sum + Number(d.donationAmount),
        0,
      );
      const uniqueDonors = new Set(c.donations.map((d) => d.donorId)).size;
      const goalAmount = c.goalAmount ? Number(c.goalAmount) : 0;
      const progressPercent = goalAmount > 0 ? Math.min(100, Math.round((totalRaised / goalAmount) * 100)) : 0;

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
    const progressPercent = goalAmount > 0 ? Math.min(100, Math.round((totalRaised / goalAmount) * 100)) : 0;

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
      const beneficiary = await this.prisma.beneficiary.findUnique({ where: { id: beneficiaryId } });
      if (!beneficiary || beneficiary.isDeleted) continue;

      try {
        const cb = await this.prisma.campaignBeneficiary.create({
          data: { campaignId, beneficiaryId, notes },
          include: {
            beneficiary: {
              select: { id: true, code: true, fullName: true, homeType: true, photoUrl: true, status: true, protectPrivacy: true },
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

  async createUpdate(campaignId: string, dto: { title: string; content: string; photoUrls?: string[] }, user: UserContext) {
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

    const donorMap = new Map<string, {
      donor: any;
      totalAmount: number;
      donationCount: number;
      lastDonation: Date;
      firstDonation: Date;
    }>();

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

    const result = Array.from(donorMap.values())
      .sort((a, b) => b.totalAmount - a.totalAmount);

    return result;
  }

  async getAnalytics(campaignId: string) {
    const campaign = await this.prisma.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign || campaign.isDeleted) {
      throw new NotFoundException('Campaign not found');
    }

    const donations = await this.prisma.donation.findMany({
      where: { campaignId, isDeleted: false },
      select: {
        id: true,
        donationAmount: true,
        donationDate: true,
        donationType: true,
        donationMode: true,
        donationHomeType: true,
        donorId: true,
      },
      orderBy: { donationDate: 'asc' },
    });

    const totalRaised = donations.reduce((sum, d) => sum + Number(d.donationAmount), 0);
    const goalAmount = campaign.goalAmount ? Number(campaign.goalAmount) : 0;
    const uniqueDonors = new Set(donations.map((d) => d.donorId)).size;
    const avgDonation = donations.length > 0 ? totalRaised / donations.length : 0;

    const monthlyData: Record<string, { month: string; amount: number; count: number }> = {};
    for (const d of donations) {
      const date = new Date(d.donationDate);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = date.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
      if (!monthlyData[key]) {
        monthlyData[key] = { month: label, amount: 0, count: 0 };
      }
      monthlyData[key].amount += Number(d.donationAmount);
      monthlyData[key].count++;
    }

    const byType: Record<string, { type: string; amount: number; count: number }> = {};
    for (const d of donations) {
      const type = d.donationType || 'OTHER';
      if (!byType[type]) byType[type] = { type, amount: 0, count: 0 };
      byType[type].amount += Number(d.donationAmount);
      byType[type].count++;
    }

    const byMode: Record<string, { mode: string; amount: number; count: number }> = {};
    for (const d of donations) {
      const mode = d.donationMode || 'OTHER';
      if (!byMode[mode]) byMode[mode] = { mode, amount: 0, count: 0 };
      byMode[mode].amount += Number(d.donationAmount);
      byMode[mode].count++;
    }

    const byHome: Record<string, { home: string; amount: number; count: number }> = {};
    for (const d of donations) {
      const home = d.donationHomeType || 'GENERAL';
      if (!byHome[home]) byHome[home] = { home, amount: 0, count: 0 };
      byHome[home].amount += Number(d.donationAmount);
      byHome[home].count++;
    }

    let cumulativeData: { month: string; cumulative: number }[] = [];
    let runningTotal = 0;
    const sortedMonths = Object.keys(monthlyData).sort();
    for (const key of sortedMonths) {
      runningTotal += monthlyData[key].amount;
      cumulativeData.push({ month: monthlyData[key].month, cumulative: runningTotal });
    }

    return {
      summary: {
        totalRaised,
        goalAmount,
        progressPercent: goalAmount > 0 ? Math.min(100, Math.round((totalRaised / goalAmount) * 100)) : 0,
        totalDonations: donations.length,
        uniqueDonors,
        avgDonation: Math.round(avgDonation),
        remaining: Math.max(0, goalAmount - totalRaised),
      },
      monthlyDonations: Object.values(monthlyData),
      cumulativeProgress: cumulativeData,
      byType: Object.values(byType).sort((a, b) => b.amount - a.amount),
      byMode: Object.values(byMode).sort((a, b) => b.amount - a.amount),
      byHome: Object.values(byHome).sort((a, b) => b.amount - a.amount),
    };
  }

  async getTimeline(id: string) {
    const campaign = await this.prisma.campaign.findUnique({ where: { id } });
    if (!campaign || campaign.isDeleted) {
      throw new NotFoundException('Campaign not found');
    }

    const donations = await this.prisma.donation.findMany({
      where: { campaignId: id, isDeleted: false },
      orderBy: { donationDate: 'desc' },
      select: {
        id: true,
        donationAmount: true,
        donationDate: true,
        donationType: true,
        donor: {
          select: {
            id: true,
            donorCode: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    const donationLinkedLogs = await this.prisma.communicationLog.findMany({
      where: {
        donation: { campaignId: id },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        donor: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    const campaignAppealLogs = await this.prisma.communicationLog.findMany({
      where: {
        metadata: { path: ['campaignId'], equals: id },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        donor: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    const seenIds = new Set<string>();
    const communicationLogs = [...donationLinkedLogs, ...campaignAppealLogs].filter((cl) => {
      if (seenIds.has(cl.id)) return false;
      seenIds.add(cl.id);
      return true;
    });

    const timeline: any[] = [];

    for (const d of donations) {
      timeline.push({
        type: 'DONATION',
        date: d.donationDate,
        donorName: `${d.donor.firstName} ${d.donor.lastName || ''}`.trim(),
        donorCode: d.donor.donorCode,
        amount: Number(d.donationAmount),
        donationType: d.donationType,
        id: d.id,
      });
    }

    for (const cl of communicationLogs) {
      timeline.push({
        type: 'MESSAGE',
        date: cl.createdAt,
        channel: cl.channel,
        subject: cl.subject,
        donorName: cl.donor ? `${cl.donor.firstName} ${cl.donor.lastName || ''}`.trim() : 'Unknown',
        id: cl.id,
      });
    }

    timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return timeline;
  }

  async generateWhatsAppAppeal(campaign: any): Promise<string> {
    const goalStr = campaign.goalAmount
      ? `Rs. ${Number(campaign.goalAmount).toLocaleString('en-IN')}`
      : 'our goal';
    const totalRaisedStr = campaign.totalRaised !== undefined
      ? `Rs. ${Number(campaign.totalRaised).toLocaleString('en-IN')}`
      : 'Rs. 0';

    let text = `*${campaign.name}*\n\n`;
    if (campaign.description) {
      text += `${campaign.description}\n\n`;
    }
    text += `Goal: ${goalStr}\n`;
    text += `Raised so far: ${totalRaisedStr}\n\n`;
    text += `Your generous contribution can make a difference! Every rupee counts towards helping those in need.\n\n`;
    text += `To donate, please reach out to us or visit our donation page.\n\n`;
    const org = await this.orgProfileService.getProfile();
    text += `Thank you for your kindness!\n`;
    text += `- ${org.name}`;

    return text;
  }

  async getWhatsAppAppeal(id: string) {
    const campaign = await this.findOne(id);
    return { text: await this.generateWhatsAppAppeal(campaign) };
  }

  async sendEmailAppeal(id: string, donorIds: string[], user: UserContext) {
    const campaign = await this.findOne(id);

    if (!donorIds || donorIds.length === 0) {
      throw new BadRequestException('Please select at least one donor');
    }

    const donors = await this.prisma.donor.findMany({
      where: {
        id: { in: donorIds },
        isDeleted: false,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        personalEmail: true,
        officialEmail: true,
      },
    });

    const orgProfile = await this.orgProfileService.getProfile();
    const orgName = orgProfile.name;

    let queued = 0;
    let skipped = 0;

    for (const donor of donors) {
      const email = donor.personalEmail || donor.officialEmail;
      if (!email) {
        skipped++;
        continue;
      }

      const donorName = `${donor.firstName} ${donor.lastName || ''}`.trim();
      const goalStr = campaign.goalAmount
        ? `Rs. ${Number(campaign.goalAmount).toLocaleString('en-IN')}`
        : 'our target';

      const subject = `Support Our Campaign: ${campaign.name}`;
      const body = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #333;">${campaign.name}</h2>
  <p>Dear ${donorName},</p>
  <p>${campaign.description || 'We are reaching out to invite your support for our ongoing campaign.'}</p>
  <p>Our fundraising goal is <strong>${goalStr}</strong>, and every contribution brings us closer to making a meaningful impact.</p>
  ${campaign.startDate || campaign.endDate ? `<p>Campaign period: ${campaign.startDate ? new Date(campaign.startDate).toLocaleDateString('en-IN') : ''} ${campaign.endDate ? '- ' + new Date(campaign.endDate).toLocaleDateString('en-IN') : ''}</p>` : ''}
  <p>Your generosity has always been a source of strength for us. We humbly request your consideration in supporting this initiative.</p>
  <p>Warm regards,<br/>${orgName}</p>
</div>`;

      await this.emailJobsService.create({
        donorId: donor.id,
        toEmail: email,
        subject,
        body,
        type: 'SPECIAL_DAY' as any,
        relatedId: campaign.id,
        scheduledAt: new Date(),
      });

      await this.prisma.communicationLog.create({
        data: {
          donorId: donor.id,
          channel: 'EMAIL',
          type: CommunicationType.GENERAL,
          status: 'SENT',
          recipient: email,
          subject,
          messagePreview: `Campaign appeal email for "${campaign.name}"`,
          metadata: { campaignId: campaign.id, campaignName: campaign.name },
          sentById: user.id,
        },
      });

      queued++;
    }

    return { queued, skipped, total: donors.length };
  }

  async broadcastUpdate(campaignId: string, updateId: string, donorIds: string[], user: UserContext) {
    const campaign = await this.prisma.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign || campaign.isDeleted) {
      throw new NotFoundException('Campaign not found');
    }

    const update = await this.prisma.campaignUpdate.findFirst({
      where: { id: updateId, campaignId },
    });
    if (!update) {
      throw new NotFoundException('Campaign update not found');
    }

    if (!donorIds || donorIds.length === 0) {
      throw new BadRequestException('Please select at least one donor');
    }

    const donors = await this.prisma.donor.findMany({
      where: { id: { in: donorIds }, isDeleted: false },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        personalEmail: true,
        officialEmail: true,
      },
    });

    const orgProfile = await this.orgProfileService.getProfile();
    const orgName = orgProfile.name;

    const totalRaised = await this.getCampaignTotalRaised(campaignId);
    const goalAmount = campaign.goalAmount ? Number(campaign.goalAmount) : 0;
    const progressPercent = goalAmount > 0 ? Math.min(100, Math.round((totalRaised / goalAmount) * 100)) : 0;

    let queued = 0;
    let skipped = 0;

    for (const donor of donors) {
      const email = donor.personalEmail || donor.officialEmail;
      if (!email) {
        skipped++;
        continue;
      }

      const donorName = `${donor.firstName} ${donor.lastName || ''}`.trim();
      const subject = `Campaign Update: ${campaign.name} - ${update.title}`;

      const progressBarHtml = goalAmount > 0 ? `
      <div style="margin: 20px 0;">
        <div style="display: flex; justify-content: space-between; font-size: 14px; color: #555; margin-bottom: 6px;">
          <span>Progress</span>
          <span>${progressPercent}% of Rs. ${goalAmount.toLocaleString('en-IN')}</span>
        </div>
        <div style="background: #e5e7eb; border-radius: 8px; height: 20px; overflow: hidden;">
          <div style="background: linear-gradient(90deg, #22c55e, #16a34a); height: 100%; width: ${progressPercent}%; border-radius: 8px; transition: width 0.3s;"></div>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 13px; color: #777; margin-top: 4px;">
          <span>Raised: Rs. ${totalRaised.toLocaleString('en-IN')}</span>
          <span>Goal: Rs. ${goalAmount.toLocaleString('en-IN')}</span>
        </div>
      </div>` : '';

      const photoHtml = update.photoUrls && update.photoUrls.length > 0
        ? `<div style="margin: 16px 0;">${update.photoUrls.map(url =>
            `<img src="${url}" alt="Campaign update" style="max-width: 100%; border-radius: 8px; margin-bottom: 8px;" />`
          ).join('')}</div>`
        : '';

      const body = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #333; margin-bottom: 4px;">${campaign.name}</h2>
  <h3 style="color: #555; font-weight: normal; margin-top: 0;">${update.title}</h3>
  <p>Dear ${donorName},</p>
  <div style="white-space: pre-wrap; color: #333; line-height: 1.6;">${update.content}</div>
  ${photoHtml}
  ${progressBarHtml}
  <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
  <p style="color: #666;">Thank you for your continued support.</p>
  <p>Warm regards,<br/>${orgName}</p>
</div>`;

      await this.emailJobsService.create({
        donorId: donor.id,
        toEmail: email,
        subject,
        body,
        type: 'SPECIAL_DAY' as any,
        relatedId: update.id,
        scheduledAt: new Date(),
      });

      await this.prisma.campaignUpdateDispatch.create({
        data: {
          campaignUpdateId: update.id,
          donorId: donor.id,
          channel: SponsorDispatchChannel.EMAIL,
          status: SponsorDispatchStatus.SENT,
          sentAt: new Date(),
        },
      });

      await this.prisma.communicationLog.create({
        data: {
          donorId: donor.id,
          channel: 'EMAIL',
          type: CommunicationType.GENERAL,
          status: 'SENT',
          recipient: email,
          subject,
          messagePreview: `Campaign update: "${update.title}" for "${campaign.name}"`,
          metadata: { campaignId: campaign.id, campaignName: campaign.name, campaignUpdateId: update.id },
          sentById: user.id,
        },
      });

      queued++;
    }

    return { queued, skipped, total: donors.length };
  }

  async logWhatsAppBroadcast(campaignId: string, updateId: string, donorId: string, user: UserContext) {
    const campaign = await this.prisma.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign || campaign.isDeleted) {
      throw new NotFoundException('Campaign not found');
    }

    const update = await this.prisma.campaignUpdate.findFirst({
      where: { id: updateId, campaignId },
    });
    if (!update) {
      throw new NotFoundException('Campaign update not found');
    }

    const donor = await this.prisma.donor.findUnique({ where: { id: donorId } });
    if (!donor || donor.isDeleted) {
      throw new NotFoundException('Donor not found');
    }

    await this.prisma.campaignUpdateDispatch.create({
      data: {
        campaignUpdateId: update.id,
        donorId: donor.id,
        channel: SponsorDispatchChannel.WHATSAPP,
        status: SponsorDispatchStatus.COPIED,
        sentAt: new Date(),
      },
    });

    await this.prisma.communicationLog.create({
      data: {
        donorId: donor.id,
        channel: 'WHATSAPP',
        type: CommunicationType.GENERAL,
        status: 'SENT',
        messagePreview: `Campaign update WhatsApp: "${update.title}" for "${campaign.name}"`,
        metadata: { campaignId: campaign.id, campaignUpdateId: update.id },
        sentById: user.id,
      },
    });

    return { success: true };
  }

  async getUpdateWhatsAppText(campaignId: string, updateId: string) {
    const campaign = await this.prisma.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign || campaign.isDeleted) {
      throw new NotFoundException('Campaign not found');
    }

    const update = await this.prisma.campaignUpdate.findFirst({
      where: { id: updateId, campaignId },
    });
    if (!update) {
      throw new NotFoundException('Campaign update not found');
    }

    const totalRaised = await this.getCampaignTotalRaised(campaignId);
    const goalAmount = campaign.goalAmount ? Number(campaign.goalAmount) : 0;
    const progressPercent = goalAmount > 0 ? Math.min(100, Math.round((totalRaised / goalAmount) * 100)) : 0;

    let text = `*${campaign.name}*\n`;
    text += `_${update.title}_\n\n`;
    text += `${update.content}\n\n`;

    if (goalAmount > 0) {
      const filled = Math.round(progressPercent / 5);
      const empty = 20 - filled;
      const bar = '█'.repeat(filled) + '░'.repeat(empty);
      text += `📊 *Progress:* ${progressPercent}%\n`;
      text += `${bar}\n`;
      text += `Raised: Rs. ${totalRaised.toLocaleString('en-IN')} / Goal: Rs. ${goalAmount.toLocaleString('en-IN')}\n\n`;
    }

    if (update.photoUrls && update.photoUrls.length > 0) {
      text += `📸 Photos: ${update.photoUrls.length} attached\n`;
      for (const url of update.photoUrls) {
        text += `${url}\n`;
      }
      text += '\n';
    }

    const orgForUpdate = await this.orgProfileService.getProfile();
    text += `Your support makes a difference!\n`;
    text += `- ${orgForUpdate.name}`;

    return { text };
  }

  async getUpdateDispatches(campaignId: string, updateId: string) {
    const campaign = await this.prisma.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign || campaign.isDeleted) {
      throw new NotFoundException('Campaign not found');
    }

    const update = await this.prisma.campaignUpdate.findFirst({
      where: { id: updateId, campaignId },
    });
    if (!update) {
      throw new NotFoundException('Campaign update not found');
    }

    return this.prisma.campaignUpdateDispatch.findMany({
      where: { campaignUpdateId: updateId },
      include: {
        donor: {
          select: {
            id: true,
            donorCode: true,
            firstName: true,
            lastName: true,
            personalEmail: true,
            officialEmail: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  private async getCampaignTotalRaised(campaignId: string): Promise<number> {
    const donations = await this.prisma.donation.findMany({
      where: { campaignId, isDeleted: false },
      select: { donationAmount: true },
    });
    return donations.reduce((sum, d) => sum + Number(d.donationAmount), 0);
  }
}
