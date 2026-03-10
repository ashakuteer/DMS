import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class AnalyticsRiskService {
constructor(private prisma: PrismaService) {}

async computeAtRiskDonors() {
const donors = await this.prisma.donor.findMany({
where: { deletedAt: null },
select: {
id: true,
donorCode: true,
firstName: true,
lastName: true,
personalEmail: true,
primaryPhone: true,
donations: {
where: { deletedAt: null },
orderBy: { donationDate: "desc" },
take: 1,
select: {
donationDate: true,
donationAmount: true,
},
},
},
});

```
const now = new Date();

return donors
  .filter((d) => {
    if (!d.donations.length) return false;

    const lastDonation = new Date(d.donations[0].donationDate);
    const diffDays =
      (now.getTime() - lastDonation.getTime()) / (1000 * 60 * 60 * 24);

    return diffDays > 90;
  })
  .map((d) => {
    const lastDonation = d.donations[0];
    const lastDate = new Date(lastDonation.donationDate);

    const diffDays = Math.round(
      (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    return {
      donorId: d.id,
      donorCode: d.donorCode,
      donorName: `${d.firstName} ${d.lastName ?? ""}`.trim(),
      lastDonationDate: lastDate,
      lastDonationAmount: Number(lastDonation.donationAmount) || 0,
      daysSinceLastDonation: diffDays,
      hasEmail: !!d.personalEmail,
      hasPhone: !!d.primaryPhone,
    };
  });
```

}
}
