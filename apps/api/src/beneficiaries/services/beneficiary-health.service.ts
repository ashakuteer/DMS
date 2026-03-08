import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class BeneficiaryHealthService {

constructor(private prisma: PrismaService) {}

async getMetrics(beneficiaryId: string) {

return this.prisma.beneficiaryMetric.findMany({
  where: { beneficiaryId },
  include: {
    createdBy: { select: { id: true, name: true } },
  },
  orderBy: { recordedOn: "desc" },
});
}

async getHealthEvents(beneficiaryId: string) {

return this.prisma.beneficiaryHealthEvent.findMany({
  where: { beneficiaryId },
  include: {
    createdBy: { select: { id: true, name: true } },
  },
  orderBy: { eventDate: "desc" },
});
}

}
