-- Add donorSince field to donors table
-- Tracks when a donor first started supporting the organization

ALTER TABLE "donors" ADD COLUMN IF NOT EXISTS "donorSince" TIMESTAMP(3);

-- Backfill existing donors: set donorSince = createdAt where not yet set
UPDATE "donors" SET "donorSince" = "createdAt" WHERE "donorSince" IS NULL;
