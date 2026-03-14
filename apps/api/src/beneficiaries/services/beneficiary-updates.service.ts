import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class BeneficiaryUpdatesService {

constructor(private prisma: PrismaService) {}

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
    select: { id: true },
  });
  if (!beneficiary) throw new NotFoundException("Beneficiary not found");

  return this.prisma.beneficiaryUpdate.create({
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
