import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, communicationsTable } from "@workspace/db";
import {
  ListCommunicationsResponse,
  CreateCommunicationBody,
  GetCommunicationParams,
  GetCommunicationResponse,
  DeleteCommunicationParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/communications", async (_req, res): Promise<void> => {
  const rows = await db.select().from(communicationsTable).orderBy(desc(communicationsTable.createdAt));
  res.json(ListCommunicationsResponse.parse(rows));
});

router.post("/communications", async (req, res): Promise<void> => {
  const parsed = CreateCommunicationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const values: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.sentAt) values.sentAt = new Date(parsed.data.sentAt);
  const [comm] = await db.insert(communicationsTable).values(values as typeof communicationsTable.$inferInsert).returning();
  res.status(201).json(GetCommunicationResponse.parse(comm));
});

router.get("/communications/:id", async (req, res): Promise<void> => {
  const params = GetCommunicationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [comm] = await db.select().from(communicationsTable).where(eq(communicationsTable.id, params.data.id));
  if (!comm) {
    res.status(404).json({ error: "Communication not found" });
    return;
  }
  res.json(GetCommunicationResponse.parse(comm));
});

router.delete("/communications/:id", async (req, res): Promise<void> => {
  const params = DeleteCommunicationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  await db.delete(communicationsTable).where(eq(communicationsTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
