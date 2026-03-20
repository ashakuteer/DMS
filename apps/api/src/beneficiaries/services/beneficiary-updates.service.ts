import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CommunicationsService } from "../../communications/communications.service";
import { CommunicationLogService } from "../../communication-log/communication-log.service";
import { EmailService } from "../../email/email.service";
import { CommunicationType } from "@prisma/client";

@Injectable()
export class BeneficiaryUpdatesService {
  private readonly logger = new Logger(BeneficiaryUpdatesService.name);

  constructor(
    private prisma: PrismaService,
    private communicationsService: CommunicationsService,
    private communicationLogService: CommunicationLogService,
    private emailService: EmailService,
  ) {}

async getUpdates(beneficiaryId: string) {
  return this.prisma.beneficiaryUpdate.findMany({
    where: { beneficiaryId },
    include: {
      createdBy: { select: { id: true, name: true } },
      attachments: {
        include: {
          document: {
            select: { id: true, title: true, storagePath: true, mimeType: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

async addUpdate(user: any, beneficiaryId: string, dto: any) {
  const beneficiary = await this.prisma.beneficiary.findFirst({
    where: { id: beneficiaryId, isDeleted: false },
    select: { id: true, fullName: true },
  });
  if (!beneficiary) throw new NotFoundException("Beneficiary not found");

  const update = await this.prisma.beneficiaryUpdate.create({
    data: {
      beneficiaryId,
      title: dto.title,
      content: dto.content,
      updateType: dto.updateType || "GENERAL",
      isPrivate: dto.isPrivate ?? false,
      createdById: user.id,
    },
    include: {
      createdBy: { select: { id: true, name: true } },
    },
  });

  if (!dto.isPrivate) {
    this.notifySponsors(
      beneficiary.fullName,
      beneficiaryId,
      dto.title,
      dto.content,
      user.id,
    ).catch((err) =>
      this.logger.error(`Sponsor notification failed for beneficiary ${beneficiaryId}: ${err?.message}`),
    );
  }

  return update;
}

private async notifySponsors(
  beneficiaryName: string,
  beneficiaryId: string,
  title: string,
  content: string,
  userId: string,
) {
  const sponsorships = await this.prisma.sponsorship.findMany({
    where: { beneficiaryId, isActive: true, status: "ACTIVE" },
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
    },
  });

  if (sponsorships.length === 0) {
    this.logger.log(`No active sponsors for beneficiary ${beneficiaryId}, skipping notifications`);
    return;
  }

  const { normalizeToE164 } = await import("../../common/phone-utils");

  const emailSubject = `Update about ${beneficiaryName}: ${title}`;

  for (const { donor } of sponsorships) {
    const donorName = [donor.firstName, donor.lastName].filter(Boolean).join(" ") || "Valued Sponsor";
    const personalizedMessage = `Dear ${donorName},\n\nUpdate about ${beneficiaryName}:\n\n*${title}*\n${content}`;
    const personalizedHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2d6a4f;">Update about ${beneficiaryName}</h2>
        <p>Dear ${donorName},</p>
        <h3>${title}</h3>
        <p style="white-space: pre-wrap;">${content}</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="color: #888; font-size: 12px;">This is an automated notification from the Asha Kuteer Foundation.</p>
      </div>
    `;

    const whatsappPhone = donor.whatsappPhone || donor.primaryPhone;
    if (whatsappPhone) {
      const e164 = normalizeToE164(whatsappPhone, donor.primaryPhoneCode);
      if (e164) {
        try {
          await this.communicationsService.sendFreeform(donor.id, e164, personalizedMessage, "UPDATE_NOTIFICATION", userId);
          this.logger.log(`WhatsApp notification sent to donor ${donor.id} for beneficiary ${beneficiaryId}`);
        } catch (err: any) {
          this.logger.warn(`WhatsApp notification failed for donor ${donor.id}: ${err?.message}`);
        }
      }
    }

    const donorEmail = donor.personalEmail || donor.officialEmail;
    if (donorEmail) {
      try {
        const result = await this.emailService.sendEmail({
          to: donorEmail,
          subject: emailSubject,
          html: personalizedHtml,
          text: personalizedMessage,
          featureType: "AUTO",
        });

        await this.communicationLogService.logEmail({
          donorId: donor.id,
          toEmail: donorEmail,
          subject: emailSubject,
          messagePreview: `Update notification: ${title}`,
          status: result.success ? "SENT" : "FAILED",
          errorMessage: result.error,
          sentById: userId,
          type: CommunicationType.GENERAL,
        });

        this.logger.log(`Email notification sent to donor ${donor.id} (${donorEmail}) for beneficiary ${beneficiaryId}`);
      } catch (err: any) {
        this.logger.warn(`Email notification failed for donor ${donor.id}: ${err?.message}`);
      }
    }

    if (!whatsappPhone && !donorEmail) {
      this.logger.warn(`Donor ${donor.id} has no contact info — notification skipped`);
    }
  }

  this.logger.log(
    `Sponsor notifications dispatched for beneficiary ${beneficiaryId}: ${sponsorships.length} sponsor(s)`,
  );
}

async getUpdateWithBeneficiary(updateId: string) {
  const update = await this.prisma.beneficiaryUpdate.findUnique({
    where: { id: updateId },
    include: {
      beneficiary: { select: { id: true, fullName: true } },
      createdBy: { select: { id: true, name: true } },
    },
  });
  if (!update) throw new NotFoundException("Update not found");
  return update;
}

async sendUpdateToSponsors(user: any, updateId: string) {
  const update = await this.prisma.beneficiaryUpdate.findUnique({
    where: { id: updateId },
  });
  if (!update) throw new NotFoundException("Update not found");

  const sponsorships = await this.prisma.sponsorship.findMany({
    where: {
      beneficiaryId: update.beneficiaryId,
      isActive: true,
      status: "ACTIVE",
    },
    select: { donorId: true },
  });

  if (sponsorships.length === 0) {
    return { success: true, dispatchCount: 0 };
  }

  const dispatches = await this.prisma.sponsorUpdateDispatch.createMany({
    data: sponsorships.map((s) => ({
      updateId,
      donorId: s.donorId,
      channel: "EMAIL" as const,
      status: "QUEUED" as const,
    })),
    skipDuplicates: true,
  });

  return { success: true, dispatchCount: dispatches.count };
}

async deleteUpdate(updateId: string) {
  const existing = await this.prisma.beneficiaryUpdate.findUnique({
    where: { id: updateId },
  });

  if (!existing) {
    throw new NotFoundException("Update not found");
  }

  await this.prisma.beneficiaryUpdate.delete({
    where: { id: updateId },
  });

  return { success: true };
}

async markDispatchCopied(id: string) {
  return this.prisma.sponsorUpdateDispatch.update({
    where: { id },
    data: { status: "SENT" },
  });
}

}
