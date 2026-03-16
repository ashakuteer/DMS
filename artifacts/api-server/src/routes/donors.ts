import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import multer from "multer";
import { db, donorsTable } from "@workspace/db";
import {
  ListDonorsResponse,
  CreateDonorBody,
  GetDonorParams,
  GetDonorResponse,
  UpdateDonorParams,
  UpdateDonorBody,
  UpdateDonorResponse,
  DeleteDonorParams,
  UploadDonorPhotoParams,
  UploadDonorPhotoResponse,
} from "@workspace/api-zod";
import { uploadFile } from "../lib/supabase.js";

const router: IRouter = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get("/donors", async (_req, res): Promise<void> => {
  const donors = await db.select().from(donorsTable).orderBy(donorsTable.createdAt);
  res.json(ListDonorsResponse.parse(donors));
});

router.post("/donors", async (req, res): Promise<void> => {
  const parsed = CreateDonorBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [donor] = await db.insert(donorsTable).values(parsed.data).returning();
  res.status(201).json(GetDonorResponse.parse(donor));
});

router.get("/donors/:id", async (req, res): Promise<void> => {
  const params = GetDonorParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [donor] = await db.select().from(donorsTable).where(eq(donorsTable.id, params.data.id));
  if (!donor) {
    res.status(404).json({ error: "Donor not found" });
    return;
  }
  res.json(GetDonorResponse.parse(donor));
});

router.patch("/donors/:id", async (req, res): Promise<void> => {
  const params = UpdateDonorParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateDonorBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [donor] = await db
    .update(donorsTable)
    .set(parsed.data)
    .where(eq(donorsTable.id, params.data.id))
    .returning();
  if (!donor) {
    res.status(404).json({ error: "Donor not found" });
    return;
  }
  res.json(UpdateDonorResponse.parse(donor));
});

router.delete("/donors/:id", async (req, res): Promise<void> => {
  const params = DeleteDonorParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  await db.delete(donorsTable).where(eq(donorsTable.id, params.data.id));
  res.sendStatus(204);
});

router.post("/donors/:id/photo", upload.single("photo"), async (req, res): Promise<void> => {
  const params = UploadDonorPhotoParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  if (!req.file) {
    res.status(400).json({ error: "No photo file provided" });
    return;
  }
  const [existing] = await db.select().from(donorsTable).where(eq(donorsTable.id, params.data.id));
  if (!existing) {
    res.status(404).json({ error: "Donor not found" });
    return;
  }
  const filename = `${params.data.id}-${Date.now()}-${req.file.originalname}`;
  const photoUrl = await uploadFile("donors", filename, req.file.buffer, req.file.mimetype);
  await db.update(donorsTable).set({ photoUrl }).where(eq(donorsTable.id, params.data.id));
  res.json(UploadDonorPhotoResponse.parse({ photoUrl }));
});

export default router;
