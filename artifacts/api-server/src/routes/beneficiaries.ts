import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import multer from "multer";
import { db, beneficiariesTable } from "@workspace/db";
import {
  ListBeneficiariesResponse,
  CreateBeneficiaryBody,
  GetBeneficiaryParams,
  GetBeneficiaryResponse,
  UpdateBeneficiaryParams,
  UpdateBeneficiaryBody,
  UpdateBeneficiaryResponse,
  DeleteBeneficiaryParams,
  UploadBeneficiaryPhotoParams,
  UploadBeneficiaryPhotoResponse,
} from "@workspace/api-zod";
import { uploadFile } from "../lib/supabase.js";

const router: IRouter = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get("/beneficiaries", async (_req, res): Promise<void> => {
  const rows = await db.select().from(beneficiariesTable).orderBy(beneficiariesTable.name);
  res.json(ListBeneficiariesResponse.parse(rows));
});

router.post("/beneficiaries", async (req, res): Promise<void> => {
  const parsed = CreateBeneficiaryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const values: typeof parsed.data & { dateOfBirth?: Date; admissionDate?: Date } = { ...parsed.data };
  if (parsed.data.dateOfBirth) values.dateOfBirth = new Date(parsed.data.dateOfBirth);
  const [ben] = await db.insert(beneficiariesTable).values(values).returning();
  res.status(201).json(GetBeneficiaryResponse.parse(ben));
});

router.get("/beneficiaries/:id", async (req, res): Promise<void> => {
  const params = GetBeneficiaryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [ben] = await db.select().from(beneficiariesTable).where(eq(beneficiariesTable.id, params.data.id));
  if (!ben) {
    res.status(404).json({ error: "Beneficiary not found" });
    return;
  }
  res.json(GetBeneficiaryResponse.parse(ben));
});

router.patch("/beneficiaries/:id", async (req, res): Promise<void> => {
  const params = UpdateBeneficiaryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateBeneficiaryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const updateData: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.dateOfBirth) updateData.dateOfBirth = new Date(parsed.data.dateOfBirth);
  const [ben] = await db
    .update(beneficiariesTable)
    .set(updateData)
    .where(eq(beneficiariesTable.id, params.data.id))
    .returning();
  if (!ben) {
    res.status(404).json({ error: "Beneficiary not found" });
    return;
  }
  res.json(UpdateBeneficiaryResponse.parse(ben));
});

router.delete("/beneficiaries/:id", async (req, res): Promise<void> => {
  const params = DeleteBeneficiaryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  await db.delete(beneficiariesTable).where(eq(beneficiariesTable.id, params.data.id));
  res.sendStatus(204);
});

router.post("/beneficiaries/:id/photo", upload.single("photo"), async (req, res): Promise<void> => {
  const params = UploadBeneficiaryPhotoParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  if (!req.file) {
    res.status(400).json({ error: "No photo file provided" });
    return;
  }
  const [existing] = await db.select().from(beneficiariesTable).where(eq(beneficiariesTable.id, params.data.id));
  if (!existing) {
    res.status(404).json({ error: "Beneficiary not found" });
    return;
  }
  const filename = `${params.data.id}-${Date.now()}-${req.file.originalname}`;
  const photoUrl = await uploadFile("beneficiaries", filename, req.file.buffer, req.file.mimetype);
  await db.update(beneficiariesTable).set({ photoUrl }).where(eq(beneficiariesTable.id, params.data.id));
  res.json(UploadBeneficiaryPhotoResponse.parse({ photoUrl }));
});

export default router;
