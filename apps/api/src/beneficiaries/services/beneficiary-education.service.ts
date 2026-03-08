import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class BeneficiaryEducationService {

constructor(private prisma: PrismaService) {}

async getProgressCards(beneficiaryId: string) {

return this.prisma.progressCard.findMany({
  where: { beneficiaryId },
  include: {
    createdBy: { select: { id: true, name: true } },
  },
  orderBy: [{ academicYear: "desc" }],
});
}

}
