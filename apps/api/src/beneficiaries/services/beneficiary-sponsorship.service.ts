import { Injectable, NotFoundException, ConflictException, BadRequestException, Logger } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class BeneficiarySponsorshipService {

  private readonly logger = new Logger(BeneficiarySponsorshipService.name);

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

}
