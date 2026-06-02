-- Add permanent/receipt address fields and present/current address fields to donors table
ALTER TABLE "donors" ADD COLUMN IF NOT EXISTS "permanentStreetAddress" TEXT;
ALTER TABLE "donors" ADD COLUMN IF NOT EXISTS "permanentCity" TEXT;
ALTER TABLE "donors" ADD COLUMN IF NOT EXISTS "permanentState" TEXT;
ALTER TABLE "donors" ADD COLUMN IF NOT EXISTS "permanentCountry" TEXT;
ALTER TABLE "donors" ADD COLUMN IF NOT EXISTS "permanentPincode" TEXT;
ALTER TABLE "donors" ADD COLUMN IF NOT EXISTS "currentStreetAddress" TEXT;
ALTER TABLE "donors" ADD COLUMN IF NOT EXISTS "currentCity" TEXT;
ALTER TABLE "donors" ADD COLUMN IF NOT EXISTS "currentState" TEXT;
ALTER TABLE "donors" ADD COLUMN IF NOT EXISTS "currentCountry" TEXT;
ALTER TABLE "donors" ADD COLUMN IF NOT EXISTS "currentPincode" TEXT;
ALTER TABLE "donors" ADD COLUMN IF NOT EXISTS "currentSameAsPermanent" BOOLEAN NOT NULL DEFAULT false;
