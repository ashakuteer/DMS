import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class AnalyticsChartsService {
constructor(private prisma: PrismaService) {}

// simple memory cache with TTL
private cache = new Map<string, { data: any; expires: number }>();

async getMonthlyDonationSeries() {
const cacheKey = "analytics_monthly_donations";

```
const cached = this.cache.get(cacheKey);

if (cached && cached.expires > Date.now()) {
  return cached.data;
}

const result = await this.prisma.$queryRaw<
  { month: string; amount: number; count: number }[]
>`
  SELECT 
    TO_CHAR(DATE_TRUNC('month', "donationDate"), 'Mon YY') AS month,
    SUM("donationAmount") AS amount,
    COUNT(*) AS count
  FROM "Donation"
  WHERE "deletedAt" IS NULL
  AND "donationDate" >= NOW() - INTERVAL '12 months'
  GROUP BY DATE_TRUNC('month', "donationDate")
  ORDER BY DATE_TRUNC('month', "donationDate")
`;

const data = result.map((r) => ({
  month: r.month,
  amount: Number(r.amount) || 0,
  count: Number(r.count) || 0,
}));

// cache for 5 minutes
this.cache.set(cacheKey, {
  data,
  expires: Date.now() + 5 * 60 * 1000,
});

return data;
```

}
}
