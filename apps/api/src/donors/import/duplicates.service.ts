import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class DuplicatesService {
  constructor(private prisma: PrismaService) {}

  async detectDuplicates(
    rows: any[],
    mapping: Record<string, string>
  ) {
    const phones: string[] = [];
    const emails: string[] = [];

    for (const row of rows) {
      const phoneKey = mapping["primaryPhone"];
      const emailKey = mapping["personalEmail"];

      if (phoneKey && row[phoneKey]) {
        phones.push(row[phoneKey]);
      }

      if (emailKey && row[emailKey]) {
        emails.push(row[emailKey]);
      }
    }

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
        lastName: true,
        primaryPhone: true,
        personalEmail: true,
      },
    });

    return donors;
  }
}
