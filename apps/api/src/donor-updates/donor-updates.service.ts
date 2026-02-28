import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailJobsService } from '../email-jobs/email-jobs.service';
import { CommunicationLogService } from '../communication-log/communication-log.service';
import { EmailJobType, CommunicationType, HomeType } from '@prisma/client';

interface CreateDonorUpdateDto {
  title: string;
  content: string;
  photos?: string[];
  relatedBeneficiaryIds?: string[];
  relatedHomeTypes?: HomeType[];
  isDraft?: boolean;
}

interface SendDonorUpdateDto {
  donorIds: string[];
  channel: 'EMAIL' | 'WHATSAPP';
}

interface UserContext {
  id: string;
  email: string;
  role: string;
  name?: string;
}

@Injectable()
export class DonorUpdatesService {
  private readonly logger = new Logger(DonorUpdatesService.name);

  constructor(
    private prisma: PrismaService,
    private emailJobsService: EmailJobsService,
    private communicationLogService: CommunicationLogService,
  ) {}

  async create(dto: CreateDonorUpdateDto, user: UserContext) {
    const update = await this.prisma.donorUpdate.create({
      data: {
        title: dto.title,
        content: dto.content,
        photos: dto.photos || [],
        relatedBeneficiaryIds: dto.relatedBeneficiaryIds || [],
        relatedHomeTypes: dto.relatedHomeTypes || [],
        isDraft: dto.isDraft !== false,
        createdById: user.id,
      },
      include: {
        createdBy: { select: { name: true } },
      },
    });

    return update;
  }

  async update(id: string, dto: Partial<CreateDonorUpdateDto>) {
    const existing = await this.prisma.donorUpdate.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Update not found');

    return this.prisma.donorUpdate.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.content !== undefined && { content: dto.content }),
        ...(dto.photos !== undefined && { photos: dto.photos }),
        ...(dto.relatedBeneficiaryIds !== undefined && { relatedBeneficiaryIds: dto.relatedBeneficiaryIds }),
        ...(dto.relatedHomeTypes !== undefined && { relatedHomeTypes: dto.relatedHomeTypes }),
        ...(dto.isDraft !== undefined && { isDraft: dto.isDraft }),
      },
      include: {
        createdBy: { select: { name: true } },
      },
    });
  }

  async findAll(page: number = 1, limit: number = 20, draftsOnly?: boolean) {
    const where: any = {};
    if (draftsOnly !== undefined) {
      where.isDraft = draftsOnly;
    }

    const [items, total] = await Promise.all([
      this.prisma.donorUpdate.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          createdBy: { select: { name: true } },
          _count: { select: { dispatches: true } },
        },
      }),
      this.prisma.donorUpdate.count({ where }),
    ]);

    const enriched = await Promise.all(
      items.map(async (item) => {
        let beneficiaries: any[] = [];
        if (item.relatedBeneficiaryIds.length > 0) {
          beneficiaries = await this.prisma.beneficiary.findMany({
            where: { id: { in: item.relatedBeneficiaryIds } },
            select: { id: true, fullName: true, homeType: true, code: true },
          });
        }
        return {
          ...item,
          beneficiaries,
          dispatchCount: item._count.dispatches,
        };
      }),
    );

    return {
      items: enriched,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const update = await this.prisma.donorUpdate.findUnique({
      where: { id },
      include: {
        createdBy: { select: { name: true } },
        dispatches: {
          include: {
            donor: {
              select: {
                id: true,
                donorCode: true,
                firstName: true,
                lastName: true,
                personalEmail: true,
                officialEmail: true,
                whatsappPhone: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!update) throw new NotFoundException('Update not found');

    let beneficiaries: any[] = [];
    if (update.relatedBeneficiaryIds.length > 0) {
      beneficiaries = await this.prisma.beneficiary.findMany({
        where: { id: { in: update.relatedBeneficiaryIds } },
        select: { id: true, fullName: true, homeType: true, code: true, photoUrl: true },
      });
    }

    return { ...update, beneficiaries };
  }

  async delete(id: string) {
    const existing = await this.prisma.donorUpdate.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Update not found');
    await this.prisma.donorUpdate.delete({ where: { id } });
    return { message: 'Update deleted' };
  }

  async preview(id: string) {
    const update = await this.findOne(id);

    const org = await this.prisma.organizationProfile.findFirst();
    const orgName = org?.name || 'Our Organization';

    let beneficiarySection = '';
    if (update.beneficiaries.length > 0) {
      beneficiarySection = update.beneficiaries
        .map((b: any) => `${b.fullName} (${b.homeType.replace(/_/g, ' ')})`)
        .join(', ');
    }

    let homeSection = '';
    if (update.relatedHomeTypes.length > 0) {
      homeSection = update.relatedHomeTypes
        .map((h: string) => h.replace(/_/g, ' '))
        .join(', ');
    }

    const relatedInfo = [beneficiarySection, homeSection].filter(Boolean).join(' | ');

    const photosHtml = update.photos.length > 0
      ? update.photos.map((url: string) => `<img src="${url}" style="max-width: 400px; margin: 10px 0; border-radius: 8px;" />`).join('')
      : '';

    const emailHtml = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
<p>Dear <strong>{{donor_name}}</strong>,</p>
<h2 style="color: #333;">${update.title}</h2>
${relatedInfo ? `<p style="color: #666; font-size: 14px;">Related to: ${relatedInfo}</p>` : ''}
<div style="line-height: 1.6;">${update.content.replace(/\n/g, '<br/>')}</div>
${photosHtml}
<p style="margin-top: 20px;">Warm regards,<br/><strong>${orgName}</strong></p>
</div>`;

    const whatsappText = `Dear {{donor_name}},

*${update.title}*

${relatedInfo ? `_Related to: ${relatedInfo}_\n` : ''}${update.content}

Warm regards,
${orgName}`;

    return {
      update,
      emailHtml,
      whatsappText,
      emailSubject: `${update.title} - ${orgName}`,
    };
  }

  async searchDonors(search: string, limit: number = 20) {
    if (!search || search.length < 2) return [];

    return this.prisma.donor.findMany({
      where: {
        isDeleted: false,
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { donorCode: { contains: search, mode: 'insensitive' } },
          { personalEmail: { contains: search, mode: 'insensitive' } },
          { primaryPhone: { contains: search, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        donorCode: true,
        firstName: true,
        lastName: true,
        personalEmail: true,
        officialEmail: true,
        whatsappPhone: true,
        primaryPhone: true,
      },
      take: limit,
      orderBy: { firstName: 'asc' },
    });
  }

  async send(id: string, dto: SendDonorUpdateDto, user: UserContext) {
    const update = await this.prisma.donorUpdate.findUnique({ where: { id } });
    if (!update) throw new NotFoundException('Update not found');
    if (dto.donorIds.length === 0) throw new BadRequestException('At least one donor must be selected');

    const donors = await this.prisma.donor.findMany({
      where: { id: { in: dto.donorIds }, isDeleted: false },
      select: {
        id: true,
        donorCode: true,
        firstName: true,
        lastName: true,
        personalEmail: true,
        officialEmail: true,
        whatsappPhone: true,
        whatsappPhoneCode: true,
      },
    });

    if (donors.length === 0) throw new BadRequestException('No valid donors found');

    await this.prisma.donorUpdate.update({
      where: { id },
      data: { isDraft: false },
    });

    const previewData = await this.preview(id);
    const results = { sent: 0, failed: 0, errors: [] as string[] };

    for (const donor of donors) {
      const donorName = [donor.firstName, donor.lastName].filter(Boolean).join(' ');
      const email = donor.personalEmail || donor.officialEmail;

      try {
        await this.prisma.donorUpdateDispatch.create({
          data: {
            updateId: id,
            donorId: donor.id,
            channel: dto.channel as any,
            status: 'QUEUED',
          },
        });

        if (dto.channel === 'EMAIL' && email) {
          const personalizedHtml = previewData.emailHtml.replace(/\{\{donor_name\}\}/g, donorName);
          const personalizedSubject = previewData.emailSubject;

          await this.emailJobsService.create({
            donorId: donor.id,
            toEmail: email,
            subject: personalizedSubject,
            body: personalizedHtml,
            type: EmailJobType.DONOR_UPDATE,
            relatedId: id,
            scheduledAt: new Date(),
          });

          await this.communicationLogService.create({
            donorId: donor.id,
            channel: 'EMAIL',
            type: CommunicationType.GENERAL,
            status: 'SENT',
            recipient: email,
            subject: personalizedSubject,
            messagePreview: update.content.substring(0, 200),
            sentById: user.id,
          });

          await this.prisma.donorUpdateDispatch.updateMany({
            where: { updateId: id, donorId: donor.id },
            data: { status: 'SENT', sentAt: new Date() },
          });

          results.sent++;
        } else if (dto.channel === 'WHATSAPP') {
          const personalizedText = previewData.whatsappText.replace(/\{\{donor_name\}\}/g, donorName);

          if (donor.whatsappPhone) {
            await this.communicationLogService.create({
              donorId: donor.id,
              channel: 'WHATSAPP',
              type: CommunicationType.GENERAL,
              status: 'TRIGGERED',
              recipient: donor.whatsappPhone,
              messagePreview: personalizedText.substring(0, 200),
              sentById: user.id,
            });
          }

          await this.prisma.donorUpdateDispatch.updateMany({
            where: { updateId: id, donorId: donor.id },
            data: { status: 'COPIED', sentAt: new Date() },
          });

          results.sent++;
        } else {
          results.failed++;
          results.errors.push(`${donorName}: No ${dto.channel === 'EMAIL' ? 'email' : 'WhatsApp'} available`);
        }
      } catch (error: any) {
        this.logger.error(`Failed to send update to donor ${donor.id}: ${error.message}`);
        results.failed++;
        results.errors.push(`${donorName}: ${error.message}`);
      }
    }

    return {
      message: `Update sent to ${results.sent} donor(s)`,
      ...results,
    };
  }

  async getHistory(page: number = 1, limit: number = 20) {
    const [items, total] = await Promise.all([
      this.prisma.donorUpdateDispatch.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          update: {
            select: { id: true, title: true, content: true },
          },
          donor: {
            select: { id: true, donorCode: true, firstName: true, lastName: true },
          },
        },
      }),
      this.prisma.donorUpdateDispatch.count(),
    ]);

    return {
      items: items.map((d) => ({
        id: d.id,
        updateTitle: d.update.title,
        updateId: d.update.id,
        donorName: [d.donor.firstName, d.donor.lastName].filter(Boolean).join(' '),
        donorCode: d.donor.donorCode,
        donorId: d.donor.id,
        channel: d.channel,
        status: d.status,
        sentAt: d.sentAt,
        createdAt: d.createdAt,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getDonorsByHome(homeTypes: HomeType[]) {
    const sponsorships = await this.prisma.sponsorship.findMany({
      where: {
        status: 'ACTIVE',
        beneficiary: {
          homeType: { in: homeTypes },
        },
      },
      include: {
        donor: {
          select: {
            id: true,
            donorCode: true,
            firstName: true,
            lastName: true,
            personalEmail: true,
            officialEmail: true,
            whatsappPhone: true,
          },
        },
      },
    });

    const uniqueDonors = new Map<string, any>();
    for (const s of sponsorships) {
      if (!uniqueDonors.has(s.donor.id)) {
        uniqueDonors.set(s.donor.id, s.donor);
      }
    }
    return Array.from(uniqueDonors.values());
  }

  async getDonorsByBeneficiaries(beneficiaryIds: string[]) {
    const sponsorships = await this.prisma.sponsorship.findMany({
      where: {
        status: 'ACTIVE',
        beneficiaryId: { in: beneficiaryIds },
      },
      include: {
        donor: {
          select: {
            id: true,
            donorCode: true,
            firstName: true,
            lastName: true,
            personalEmail: true,
            officialEmail: true,
            whatsappPhone: true,
          },
        },
      },
    });

    const uniqueDonors = new Map<string, any>();
    for (const s of sponsorships) {
      if (!uniqueDonors.has(s.donor.id)) {
        uniqueDonors.set(s.donor.id, s.donor);
      }
    }
    return Array.from(uniqueDonors.values());
  }
}
