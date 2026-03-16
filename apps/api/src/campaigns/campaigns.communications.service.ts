import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailJobsService } from '../email-jobs/email-jobs.service';
import { OrganizationProfileService } from '../organization-profile/organization-profile.service';
import { CommunicationType, SponsorDispatchChannel, SponsorDispatchStatus } from '@prisma/client';
import { CampaignsAnalyticsService } from './campaigns.analytics.service';
import { UserContext } from './campaigns.types';

@Injectable()
export class CampaignsCommunicationsService {
  constructor(
    private prisma: PrismaService,
    private emailJobsService: EmailJobsService,
    private orgProfileService: OrganizationProfileService,
    private analyticsService: CampaignsAnalyticsService,
  ) {}

  async generateWhatsAppAppeal(campaign: any): Promise<string> {
    const goalStr = campaign.goalAmount
      ? `Rs. ${Number(campaign.goalAmount).toLocaleString('en-IN')}`
      : 'our goal';
    const totalRaisedStr =
      campaign.totalRaised !== undefined
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

  async getWhatsAppAppeal(campaign: any) {
    return { text: await this.generateWhatsAppAppeal(campaign) };
  }

  async sendEmailAppeal(campaign: any, donorIds: string[], user: UserContext) {
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

  async broadcastUpdate(
    campaignId: string,
    updateId: string,
    donorIds: string[],
    user: UserContext,
  ) {
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

    const totalRaised = await this.analyticsService.getCampaignTotalRaised(campaignId);
    const goalAmount = campaign.goalAmount ? Number(campaign.goalAmount) : 0;
    const progressPercent =
      goalAmount > 0 ? Math.min(100, Math.round((totalRaised / goalAmount) * 100)) : 0;

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

      const progressBarHtml =
        goalAmount > 0
          ? `
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
      </div>`
          : '';

      const photoHtml =
        update.photoUrls && update.photoUrls.length > 0
          ? `<div style="margin: 16px 0;">${update.photoUrls
              .map(
                (url) =>
                  `<img src="${url}" alt="Campaign update" style="max-width: 100%; border-radius: 8px; margin-bottom: 8px;" />`,
              )
              .join('')}</div>`
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
          metadata: {
            campaignId: campaign.id,
            campaignName: campaign.name,
            campaignUpdateId: update.id,
          },
          sentById: user.id,
        },
      });

      queued++;
    }

    return { queued, skipped, total: donors.length };
  }

  async logWhatsAppBroadcast(
    campaignId: string,
    updateId: string,
    donorId: string,
    user: UserContext,
  ) {
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

    const totalRaised = await this.analyticsService.getCampaignTotalRaised(campaignId);
    const goalAmount = campaign.goalAmount ? Number(campaign.goalAmount) : 0;
    const progressPercent =
      goalAmount > 0 ? Math.min(100, Math.round((totalRaised / goalAmount) * 100)) : 0;

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
}
