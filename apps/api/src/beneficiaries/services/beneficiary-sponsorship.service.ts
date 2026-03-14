import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class BeneficiarySponsorshipService {

  constructor(private prisma: PrismaService) {}

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
    return this.prisma.sponsorship.create({
      data: {
        ...dto,
        beneficiaryId,
        createdById: user.id,
      },
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

  async getSponsorshipSummary() {
    return this.prisma.sponsorship.count();
  }

}
