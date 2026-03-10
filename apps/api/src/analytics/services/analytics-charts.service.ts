import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class AnalyticsChartsService {
constructor(private prisma: PrismaService) {}

async getMonthlyDonationSeries() {
const result = await this.prisma.$queryRaw<
{ month: string; amount: number; count: number }[]
>`       SELECT 
        TO_CHAR(DATE_TRUNC('month', "donationDate"), 'Mon YY') AS month,
        SUM("donationAmount") AS amount,
        COUNT(*) AS count
      FROM "Donation"
      WHERE "deletedAt" IS NULL
      AND "donationDate" >= NOW() - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', "donationDate")
      ORDER BY DATE_TRUNC('month', "donationDate")
    `;

```
return result.map((r) => ({
  month: r.month,
  amount: Number(r.amount) || 0,
  count: Number(r.count) || 0,
}));
```

}
}
