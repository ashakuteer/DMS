import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class BeneficiaryUpdatesService {

constructor(private prisma: PrismaService) {}

async getUpdates(beneficiaryId: string) {

return this.prisma.beneficiaryUpdate.findMany({
  where: { beneficiaryId },
  include: {
    createdBy: {
      select: { id: true, name: true },
    },
  },
  orderBy: { createdAt: "desc" },
});
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

}
