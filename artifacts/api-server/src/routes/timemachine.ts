import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import multer from "multer";
import { db, timeMachineTable } from "@workspace/db";
import {
  ListTimeMachineEntriesResponse,
  CreateTimeMachineEntryBody,
  GetTimeMachineEntryParams,
  GetTimeMachineEntryResponse,
  UpdateTimeMachineEntryParams,
  UpdateTimeMachineEntryBody,
  UpdateTimeMachineEntryResponse,
  DeleteTimeMachineEntryParams,
  UploadTimeMachinePhotosParams,
  UploadTimeMachinePhotosResponse,
} from "@workspace/api-zod";
import { uploadFile } from "../lib/supabase.js";

const router: IRouter = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get("/timemachine", async (_req, res): Promise<void> => {
  const rows = await db.select().from(timeMachineTable).orderBy(desc(timeMachineTable.eventDate));
  res.json(ListTimeMachineEntriesResponse.parse(rows));
});

router.post("/timemachine", async (req, res): Promise<void> => {
  const parsed = CreateTimeMachineEntryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [entry] = await db.insert(timeMachineTable).values({
    ...parsed.data,
    eventDate: new Date(parsed.data.eventDate),
    photos: [],
  }).returning();
  res.status(201).json(GetTimeMachineEntryResponse.parse(entry));
});

router.get("/timemachine/:id", async (req, res): Promise<void> => {
  const params = GetTimeMachineEntryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [entry] = await db.select().from(timeMachineTable).where(eq(timeMachineTable.id, params.data.id));
  if (!entry) {
    res.status(404).json({ error: "Entry not found" });
    return;
  }
  res.json(GetTimeMachineEntryResponse.parse(entry));
});

router.patch("/timemachine/:id", async (req, res): Promise<void> => {
  const params = UpdateTimeMachineEntryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateTimeMachineEntryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const updateData: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.eventDate) updateData.eventDate = new Date(parsed.data.eventDate);
  const [entry] = await db
    .update(timeMachineTable)
    .set(updateData)
    .where(eq(timeMachineTable.id, params.data.id))
    .returning();
  if (!entry) {
    res.status(404).json({ error: "Entry not found" });
    return;
  }
  res.json(UpdateTimeMachineEntryResponse.parse(entry));
});

router.delete("/timemachine/:id", async (req, res): Promise<void> => {
  const params = DeleteTimeMachineEntryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  await db.delete(timeMachineTable).where(eq(timeMachineTable.id, params.data.id));
  res.sendStatus(204);
});

router.post("/timemachine/:id/photos", upload.array("photos", 10), async (req, res): Promise<void> => {
  const params = UploadTimeMachinePhotosParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const files = req.files as Express.Multer.File[] | undefined;
  if (!files || files.length === 0) {
    res.status(400).json({ error: "No photo files provided" });
    return;
  }
  const [existing] = await db.select().from(timeMachineTable).where(eq(timeMachineTable.id, params.data.id));
  if (!existing) {
    res.status(404).json({ error: "Entry not found" });
    return;
  }
  const uploadedUrls: string[] = [];
  for (const file of files) {
    const filename = `${params.data.id}-${Date.now()}-${file.originalname}`;
    const url = await uploadFile("timemachine", filename, file.buffer, file.mimetype);
    uploadedUrls.push(url);
  }
  const newPhotos = [...(existing.photos ?? []), ...uploadedUrls];
  await db.update(timeMachineTable).set({ photos: newPhotos }).where(eq(timeMachineTable.id, params.data.id));
  res.json(UploadTimeMachinePhotosResponse.parse({ photoUrls: uploadedUrls }));
});

export default router;
