import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, sponsorshipsTable } from "@workspace/db";
import {
  ListSponsorshipsResponse,
  CreateSponsorshipBody,
  GetSponsorshipParams,
  GetSponsorshipResponse,
  UpdateSponsorshipParams,
  UpdateSponsorshipBody,
  UpdateSponsorshipResponse,
  DeleteSponsorshipParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function parseSponsorship(raw: typeof sponsorshipsTable.$inferSelect) {
  return {
    ...raw,
    monthlyAmount: parseFloat(raw.monthlyAmount as unknown as string),
  };
}

router.get("/sponsorships", async (_req, res): Promise<void> => {
  const rows = await db.select().from(sponsorshipsTable).orderBy(sponsorshipsTable.createdAt);
  res.json(ListSponsorshipsResponse.parse(rows.map(parseSponsorship)));
});

router.post("/sponsorships", async (req, res): Promise<void> => {
  const parsed = CreateSponsorshipBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const values: Record<string, unknown> = {
    ...parsed.data,
    startDate: new Date(parsed.data.startDate),
  };
  if (parsed.data.endDate) values.endDate = new Date(parsed.data.endDate);
  const [sponsorship] = await db.insert(sponsorshipsTable).values(values as typeof sponsorshipsTable.$inferInsert).returning();
  res.status(201).json(GetSponsorshipResponse.parse(parseSponsorship(sponsorship)));
});

router.get("/sponsorships/:id", async (req, res): Promise<void> => {
  const params = GetSponsorshipParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [s] = await db.select().from(sponsorshipsTable).where(eq(sponsorshipsTable.id, params.data.id));
  if (!s) {
    res.status(404).json({ error: "Sponsorship not found" });
    return;
  }
  res.json(GetSponsorshipResponse.parse(parseSponsorship(s)));
});

router.patch("/sponsorships/:id", async (req, res): Promise<void> => {
  const params = UpdateSponsorshipParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateSponsorshipBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const updateData: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.endDate) updateData.endDate = new Date(parsed.data.endDate);
  const [s] = await db
    .update(sponsorshipsTable)
    .set(updateData)
    .where(eq(sponsorshipsTable.id, params.data.id))
    .returning();
  if (!s) {
    res.status(404).json({ error: "Sponsorship not found" });
    return;
  }
  res.json(UpdateSponsorshipResponse.parse(parseSponsorship(s)));
});

router.delete("/sponsorships/:id", async (req, res): Promise<void> => {
  const params = DeleteSponsorshipParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  await db.delete(sponsorshipsTable).where(eq(sponsorshipsTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
