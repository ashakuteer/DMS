import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { Decimal } from "@prisma/client/runtime/library";

@Injectable()
export class BeneficiarySponsorshipService {

constructor(private prisma: PrismaService) {}

async getSponsors(beneficiaryId: string) { 

const beneficiary = await this.prisma.beneficiary.findFirst({
  where: { id: beneficiaryId, isDeleted: false },
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

async getSponsorshipHistory(sponsorshipId: string) {

return this.prisma.sponsorshipStatusHistory.findMany({
  where: { sponsorshipId },
  include: {
    changedBy: { select: { id: true, name: true } },
  },
  orderBy: { changedAt: "desc" },
});
}

}
