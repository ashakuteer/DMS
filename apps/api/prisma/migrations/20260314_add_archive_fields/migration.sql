-- Add deletedBy and deleteReason fields to donors and beneficiaries
-- Enables admin archive page to track who deleted a record and why

ALTER TABLE "donors"
  ADD COLUMN IF NOT EXISTS "deletedBy" TEXT,
  ADD COLUMN IF NOT EXISTS "deleteReason" TEXT;

ALTER TABLE "beneficiaries"
  ADD COLUMN IF NOT EXISTS "deletedBy" TEXT,
  ADD COLUMN IF NOT EXISTS "deleteReason" TEXT;
