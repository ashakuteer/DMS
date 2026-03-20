import { Injectable, NotFoundException, ConflictException, BadRequestException, Logger } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CommunicationsService } from "../../communications/communications.service";
import { EmailService } from "../../email/email.service";
import { CommunicationLogService } from "../../communication-log/communication-log.service";
import { CommunicationType } from "@prisma/client";

@Injectable()
export class BeneficiarySponsorshipService {

  private readonly logger = new Logger(BeneficiarySponsorshipService.name);

  constructor(
    private prisma: PrismaService,
    private communicationsService: CommunicationsService,
    private emailService: EmailService,
    private communicationLogService: CommunicationLogService,
  ) {}

  async getSponsors(beneficiaryId: string) {

    const beneficiary = await this.prisma.beneficiary.findFirst({
      where: { id: beneficiaryId, isDeleted: false },
      select: { id: true },
    });

    if (!beneficiary) {
      throw new NotFoundException("Beneficiary not found");
    }

    return this.prisma.sponsorship.findMany({
      where: { beneficiaryId },
      include: {
        donor: {
          select: {
            id: true,
            donorCode: true,
            firstName: true,
            lastName: true,
            primaryPhone: true,
            personalEmail: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async addSponsor(user: any, beneficiaryId: string, dto: any) {
    const { donorId, sponsorshipType, amount, inKindItem, frequency, startDate, status, notes, currency } = dto;
    this.logger.log(`addSponsor: beneficiaryId=${beneficiaryId}, donorId=${donorId}, type=${sponsorshipType}`);
    console.log("Saving sponsorship (from beneficiary side):", { beneficiaryId, ...dto });
    try {
      return await this.prisma.sponsorship.create({
        data: {
          donorId,
          beneficiaryId,
          sponsorshipType: sponsorshipType as any,
          amount: amount ? parseFloat(amount) : null,
          inKindItem: inKindItem || null,
          currency: currency || "INR",
          frequency: (frequency || "ADHOC") as any,
          startDate: startDate ? new Date(startDate) : null,
          status: (status || "ACTIVE") as any,
          isActive: (status || "ACTIVE") === "ACTIVE",
          notes: notes || null,
        },
        include: {
          donor: {
            select: { id: true, donorCode: true, firstName: true, lastName: true, primaryPhone: true, personalEmail: true },
          },
        },
      });
    } catch (err: any) {
      this.logger.error(`addSponsor failed: ${err?.message}`);
      if (err?.code === "P2002") throw new ConflictException(`A ${sponsorshipType} sponsorship already exists for this donor and beneficiary.`);
      if (err?.code === "P2003") throw new BadRequestException("Invalid donorId or beneficiaryId.");
      throw err;
    }
  }

  async getSponsorshipsByBeneficiary(beneficiaryId: string) {
    return this.prisma.sponsorship.findMany({
      where: { beneficiaryId },
      include: {
        donor: {
          select: {
            id: true,
            donorCode: true,
            firstName: true,
            lastName: true,
            primaryPhone: true,
            personalEmail: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async updateSponsorship(user: any, id: string, dto: any) {
    return this.prisma.sponsorship.update({
      where: { id },
      data: dto,
    });
  }

  async deleteSponsorship(id: string) {
    return this.prisma.sponsorship.delete({
      where: { id },
    });
  }

  async getSponsorshipHistory(sponsorshipId: string) {
    return this.prisma.sponsorshipStatusHistory.findMany({
      where: { sponsorshipId },
      include: {
        changedBy: { select: { id: true, name: true } },
      },
      orderBy: { changedAt: "desc" },
    });
  }

  async getSponsorsByDonor(donorId: string) {
    return this.prisma.sponsorship.findMany({
      where: { donorId },
      include: {
        beneficiary: {
          select: {
            id: true,
            code: true,
            fullName: true,
            homeType: true,
            photoUrl: true,
            status: true,
            updates: {
              select: { id: true, title: true, content: true, updateType: true, createdAt: true },
              orderBy: { createdAt: "desc" },
              take: 3,
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async createSponsorshipForDonor(user: any, dto: {
    donorId: string;
    beneficiaryId: string;
    sponsorshipType: string;
    amount?: number;
    currency?: string;
    frequency?: string;
    startDate?: string;
    status?: string;
    notes?: string;
  }) {
    console.log("Saving sponsorship:", JSON.stringify(dto, null, 2));
    this.logger.log(`Creating sponsorship: donorId=${dto.donorId}, beneficiaryId=${dto.beneficiaryId}, type=${dto.sponsorshipType}`);

    if (!dto.donorId) throw new BadRequestException("donorId is required");
    if (!dto.beneficiaryId) throw new BadRequestException("beneficiaryId is required");
    if (!dto.sponsorshipType) throw new BadRequestException("sponsorshipType is required");

    try {
      const result = await this.prisma.sponsorship.create({
        data: {
          donorId: dto.donorId,
          beneficiaryId: dto.beneficiaryId,
          sponsorshipType: dto.sponsorshipType as any,
          amount: dto.amount ?? null,
          currency: dto.currency ?? "INR",
          frequency: (dto.frequency ?? "MONTHLY") as any,
          startDate: dto.startDate ? new Date(dto.startDate) : null,
          status: (dto.status ?? "ACTIVE") as any,
          notes: dto.notes ?? null,
          isActive: (dto.status ?? "ACTIVE") === "ACTIVE",
        },
        include: {
          beneficiary: {
            select: {
              id: true,
              code: true,
              fullName: true,
              homeType: true,
              photoUrl: true,
              status: true,
            },
          },
        },
      });
      this.logger.log(`Sponsorship created successfully: id=${result.id}`);
      return result;
    } catch (err: any) {
      this.logger.error(`Failed to create sponsorship: ${err?.message}`, err?.stack);
      if (err?.code === "P2002") {
        throw new ConflictException(
          `A ${dto.sponsorshipType} sponsorship already exists for this donor and beneficiary. ` +
          `Please choose a different sponsorship type or update the existing one.`
        );
      }
      if (err?.code === "P2003") {
        throw new BadRequestException("Invalid donorId or beneficiaryId — record not found.");
      }
      throw err;
    }
  }

  async getSponsorshipSummary() {
    return this.prisma.sponsorship.count();
  }

  async sendUpdateToSponsor(userId: string, sponsorshipId: string) {
    const sponsorship = await this.prisma.sponsorship.findUnique({
      where: { id: sponsorshipId },
      include: {
        donor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            personalEmail: true,
            officialEmail: true,
            whatsappPhone: true,
            primaryPhone: true,
            primaryPhoneCode: true,
          },
        },
        beneficiary: {
          select: { id: true, fullName: true },
        },
      },
    });

    if (!sponsorship) throw new NotFoundException("Sponsorship not found");

    const latestUpdate = await this.prisma.beneficiaryUpdate.findFirst({
      where: { beneficiaryId: sponsorship.beneficiaryId, isPrivate: false },
      orderBy: { createdAt: "desc" },
      select: { title: true, content: true },
    });

    const { donor, beneficiary } = sponsorship;
    const donorName = [donor.firstName, donor.lastName].filter(Boolean).join(" ") || "Valued Sponsor";
    const beneficiaryName = beneficiary.fullName;

    const updateBody = latestUpdate
      ? `*${latestUpdate.title}*\n${latestUpdate.content}`
      : `Thank you for your continued support for ${beneficiaryName}.`;

    const message = `Dear ${donorName},\n\nUpdate about ${beneficiaryName}:\n\n${updateBody}`;

    const emailSubject = `Update about ${beneficiaryName}`;
    const emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2d6a4f;">Update about ${beneficiaryName}</h2>
        <p>Dear ${donorName},</p>
        ${latestUpdate ? `<h3>${latestUpdate.title}</h3><p style="white-space: pre-wrap;">${latestUpdate.content}</p>` : `<p>Thank you for your continued support for ${beneficiaryName}.</p>`}
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="color: #888; font-size: 12px;">This message was sent from the Asha Kuteer Foundation.</p>
      </div>
    `;

    const results: { whatsapp?: string; email?: string } = {};

    const { normalizeToE164 } = await import("../../common/phone-utils");
    const rawPhone = donor.whatsappPhone || donor.primaryPhone;
    if (rawPhone) {
      const e164 = normalizeToE164(rawPhone, donor.primaryPhoneCode);
      if (e164) {
        try {
          await this.communicationsService.sendFreeform(donor.id, e164, message, "UPDATE_NOTIFICATION", userId);
          results.whatsapp = "sent";
          this.logger.log(`WhatsApp sent to donor ${donor.id} for sponsorship ${sponsorshipId}`);
        } catch (err: any) {
          results.whatsapp = "failed";
          this.logger.warn(`WhatsApp failed for donor ${donor.id}: ${err?.message}`);
        }
      }
    }

    const donorEmail = donor.personalEmail || donor.officialEmail;
    if (donorEmail) {
      try {
        const result = await this.emailService.sendEmail({
          to: donorEmail,
          subject: emailSubject,
          html: emailHtml,
          text: message,
          featureType: "MANUAL",
        });

        await this.communicationLogService.logEmail({
          donorId: donor.id,
          toEmail: donorEmail,
          subject: emailSubject,
          messagePreview: `Manual update notification: ${latestUpdate?.title ?? "(no update)"}`,
          status: result.success ? "SENT" : "FAILED",
          errorMessage: result.error,
          sentById: userId,
          type: CommunicationType.GENERAL,
        });

        results.email = result.success ? "sent" : "failed";
      } catch (err: any) {
        results.email = "failed";
        this.logger.warn(`Email failed for donor ${donor.id}: ${err?.message}`);
      }
    }

    return {
      success: true,
      donorName,
      beneficiaryName,
      results,
      latestUpdateTitle: latestUpdate?.title ?? null,
    };
  }

}
