import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, donationsTable } from "@workspace/db";
import {
  ListDonationsResponse,
  CreateDonationBody,
  GetDonationParams,
  GetDonationResponse,
  UpdateDonationParams,
  UpdateDonationBody,
  UpdateDonationResponse,
  DeleteDonationParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function parseDonation(raw: typeof donationsTable.$inferSelect) {
  return {
    ...raw,
    amount: parseFloat(raw.amount as unknown as string),
  };
}

router.get("/donations", async (_req, res): Promise<void> => {
  const rows = await db.select().from(donationsTable).orderBy(desc(donationsTable.donationDate));
  res.json(ListDonationsResponse.parse(rows.map(parseDonation)));
});

router.post("/donations", async (req, res): Promise<void> => {
  const parsed = CreateDonationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [donation] = await db.insert(donationsTable).values({
    ...parsed.data,
    donationDate: new Date(parsed.data.donationDate),
  }).returning();
  res.status(201).json(GetDonationResponse.parse(parseDonation(donation)));
});

router.get("/donations/:id", async (req, res): Promise<void> => {
  const params = GetDonationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [donation] = await db.select().from(donationsTable).where(eq(donationsTable.id, params.data.id));
  if (!donation) {
    res.status(404).json({ error: "Donation not found" });
    return;
  }
  res.json(GetDonationResponse.parse(parseDonation(donation)));
});

router.patch("/donations/:id", async (req, res): Promise<void> => {
  const params = UpdateDonationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateDonationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const updateData: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.donationDate) {
    updateData.donationDate = new Date(parsed.data.donationDate);
  }
  const [donation] = await db
    .update(donationsTable)
    .set(updateData)
    .where(eq(donationsTable.id, params.data.id))
    .returning();
  if (!donation) {
    res.status(404).json({ error: "Donation not found" });
    return;
  }
  res.json(UpdateDonationResponse.parse(parseDonation(donation)));
});

router.delete("/donations/:id", async (req, res): Promise<void> => {
  const params = DeleteDonationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  await db.delete(donationsTable).where(eq(donationsTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
