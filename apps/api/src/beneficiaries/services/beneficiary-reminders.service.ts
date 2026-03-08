import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class BeneficiaryRemindersService {

constructor(private prisma: PrismaService) {}

async getDueSponsorships() {

return this.prisma.sponsorship.findMany({
  where: {
    isActive: true,
    status: "ACTIVE",
  },
  include: {
    donor: true,
    beneficiary: true,
  },
});
}

}
