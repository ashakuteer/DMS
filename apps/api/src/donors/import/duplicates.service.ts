import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class DonorsImportDuplicatesService {
  constructor(private prisma: PrismaService) {}

  async detectDuplicatesInBatch(
    rows: any[],
    mapping: Record<string, string>,
  ) {
    const phones: string[] = [];
    const emails: string[] = [];

    rows.forEach((row) => {
      if (row[mapping["primaryPhone"]]) phones.push(row[mapping["primaryPhone"]]);
      if (row[mapping["personalEmail"]]) emails.push(row[mapping["personalEmail"]]);
    });

    const donors = await this.prisma.donor.findMany({
      where: {
        OR: [
          { primaryPhone: { in: phones } },
          { personalEmail: { in: emails } },
        ],
      },
      select: {
        id: true,
        donorCode: true,
        firstName: true,
      },
    });

    return donors;
  }
}
