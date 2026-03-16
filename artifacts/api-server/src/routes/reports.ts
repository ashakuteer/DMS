import { Router, type IRouter } from "express";
import { eq, count, sum, desc } from "drizzle-orm";
import { db, donorsTable, donationsTable, beneficiariesTable, sponsorshipsTable, communicationsTable } from "@workspace/db";
import { GetReportSummaryResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/reports/summary", async (_req, res): Promise<void> => {
  const [donorStats] = await db
    .select({ total: count(), active: count() })
    .from(donorsTable);

  const activeDonorCount = await db
    .select({ count: count() })
    .from(donorsTable)
    .where(eq(donorsTable.status, "Active"));

  const [donationStats] = await db
    .select({ total: sum(donationsTable.amount) })
    .from(donationsTable);

  const [benTotal] = await db.select({ count: count() }).from(beneficiariesTable);
  const [benActive] = await db
    .select({ count: count() })
    .from(beneficiariesTable)
    .where(eq(beneficiariesTable.status, "Active"));

  const [sponsorActive] = await db
    .select({ count: count() })
    .from(sponsorshipsTable)
    .where(eq(sponsorshipsTable.status, "Active"));

  const [commTotal] = await db.select({ count: count() }).from(communicationsTable);

  const recentDonations = await db
    .select()
    .from(donationsTable)
    .orderBy(desc(donationsTable.donationDate))
    .limit(5);

  const summary = {
    totalDonors: donorStats.total ?? 0,
    activeDonors: activeDonorCount[0]?.count ?? 0,
    totalDonations: parseFloat((donationStats.total as unknown as string) ?? "0"),
    totalBeneficiaries: benTotal.count ?? 0,
    activeBeneficiaries: benActive.count ?? 0,
    activeSponsorships: sponsorActive.count ?? 0,
    totalCommunications: commTotal.count ?? 0,
    recentDonations: recentDonations.map((d) => ({
      ...d,
      amount: parseFloat(d.amount as unknown as string),
    })),
  };

  res.json(GetReportSummaryResponse.parse(summary));
});

export default router;
