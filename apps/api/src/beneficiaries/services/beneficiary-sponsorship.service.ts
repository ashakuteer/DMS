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
    return this.prisma.sponsorship.create({
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
  }

  async getSponsorshipSummary() {
    return this.prisma.sponsorship.count();
  }

}
