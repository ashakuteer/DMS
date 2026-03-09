import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { getCurrentFY } from "../utils/analytics-date.utils";

@Injectable()
export class AnalyticsSegmentsService {
constructor(private prisma: PrismaService) {}

// simple memory cache
private cache = new Map<string, { data: any; expires: number }>();

async getTopDonorsSegment() {
const cacheKey = "analytics_top_donors";

```
const cached = this.cache.get(cacheKey);

if (cached && cached.expires > Date.now()) {
  return cached.data;
}

const { fyStart, fyEnd } = getCurrentFY();

const top = await this.prisma.donation.groupBy({
  by: ["donorId"],
  _sum: { donationAmount: true },
  _count: { id: true },
  where: {
    deletedAt: null,
    donationDate: { gte: fyStart, lte: fyEnd },
  },
  orderBy: {
    _sum: { donationAmount: "desc" },
  },
  take: 20,
});

const donorIds = top.map((d) => d.donorId);

if (!donorIds.length) {
  return [];
}

const donors = await this.prisma.donor.findMany({
  where: {
    id: { in: donorIds },
    deletedAt: null,
  },
  select: {
    id: true,
    donorCode: true,
    firstName: true,
    lastName: true,
  },
});

const donorMap = new Map(donors.map((d) => [d.id, d]));

const result = top.map((t) => {
  const donor = donorMap.get(t.donorId);

  return {
    donorId: t.donorId,
    donorCode: donor?.donorCode ?? "",
    donorName: donor
      ? `${donor.firstName} ${donor.lastName ?? ""}`.trim()
      : "Unknown",
    totalAmount: Number(t._sum.donationAmount) || 0,
    donationCount: t._count.id || 0,
  };
});

// cache for 5 minutes
this.cache.set(cacheKey, {
  data: result,
  expires: Date.now() + 5 * 60 * 1000,
});

return result;
```

}
}
