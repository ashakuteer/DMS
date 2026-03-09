import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class DuplicatesService {
  constructor(private prisma: PrismaService) {}

  async detectDuplicatesInBatch(
    rows: any[],
    mapping: Record<string, string>
  ) {
    const phones: string[] = [];
    const emails: string[] = [];

    rows.forEach((row) => {
      if (mapping["primaryPhone"] && row[mapping["primaryPhone"]]) {
        phones.push(row[mapping["primaryPhone"]]);
      }

      if (mapping["personalEmail"] && row[mapping["personalEmail"]]) {
        emails.push(row[mapping["personalEmail"]]);
      }
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
        firstName: true,
        primaryPhone: true,
        personalEmail: true,
      },
    });

    return donors;
  }
}
