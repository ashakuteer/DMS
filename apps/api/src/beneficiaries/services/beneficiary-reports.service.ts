import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class BeneficiaryReportsService {

constructor(private prisma: PrismaService) {}

async getReportCampaigns() {

return this.prisma.reportCampaign.findMany({
  include: {
    createdBy: { select: { id: true, name: true } },
  },
  orderBy: { createdAt: "desc" },
});
}

}
