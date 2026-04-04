-- Meals Module Phase 1 + Phase 1.5 — Safe Additive Migration
-- All statements use IF NOT EXISTS / DO $$ blocks for idempotency.
-- Safe to re-run. No destructive changes. No existing data is modified.
-- Run PART A alone first (ALTER TYPE cannot share a transaction with table DDL on PG < 12).

-- ═══════════════════════════════════════════════════════════════════════
-- PART A — Run this statement ALONE first, then run PART B separately
-- ═══════════════════════════════════════════════════════════════════════

ALTER TYPE "DonationPurpose" ADD VALUE IF NOT EXISTS 'MEAL_DONATION';

-- ═══════════════════════════════════════════════════════════════════════
-- PART B — Run after PART A completes
-- ═══════════════════════════════════════════════════════════════════════

-- Phase 1 enums ─────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE "MealSponsorshipType" AS ENUM ('ENTIRE_DAY', 'SELECTED_MEALS');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "MealFoodType" AS ENUM ('VEG', 'NON_VEG');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "MealPaymentType" AS ENUM ('ADVANCE', 'FULL');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "MealOccasionType" AS ENUM ('NONE', 'BIRTHDAY', 'WEDDING_ANNIVERSARY', 'MEMORIAL', 'OTHER');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "MealOccasionFor" AS ENUM ('SELF', 'OTHER');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Phase 1.5 enum ────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE "MealPaymentStatus" AS ENUM ('ADVANCE', 'PARTIAL', 'FULL', 'AFTER_SERVICE');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Phase 1 table ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "meal_sponsorships" (
    "id"                   TEXT          NOT NULL,
    "donorId"              TEXT          NOT NULL,
    "homes"                "DonationHomeType"[],
    "sponsorshipType"      "MealSponsorshipType" NOT NULL,
    "breakfast"            BOOLEAN       NOT NULL DEFAULT false,
    "lunch"                BOOLEAN       NOT NULL DEFAULT false,
    "dinner"               BOOLEAN       NOT NULL DEFAULT false,
    "foodType"             "MealFoodType" NOT NULL,
    "mealNotes"            TEXT,
    "donationReceivedDate" TIMESTAMP(3)  NOT NULL,
    "mealServiceDate"      TIMESTAMP(3)  NOT NULL,
    "paymentType"          "MealPaymentType",
    "amount"               DECIMAL(15,2) NOT NULL,
    "occasionType"         "MealOccasionType" NOT NULL DEFAULT 'NONE',
    "occasionFor"          "MealOccasionFor",
    "occasionPersonName"   TEXT,
    "occasionNotes"        TEXT,
    "internalNotes"        TEXT,
    "donationId"           TEXT,
    "createdById"          TEXT          NOT NULL,
    "createdAt"            TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"            TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "meal_sponsorships_pkey" PRIMARY KEY ("id")
);

-- Phase 1 constraints / indexes ─────────────────────────────────────────

DO $$ BEGIN
  ALTER TABLE "meal_sponsorships" ADD CONSTRAINT "meal_sponsorships_donationId_key" UNIQUE ("donationId");
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE INDEX IF NOT EXISTS "meal_sponsorships_donorId_idx" ON "meal_sponsorships"("donorId");
CREATE INDEX IF NOT EXISTS "meal_sponsorships_mealServiceDate_idx" ON "meal_sponsorships"("mealServiceDate");
CREATE INDEX IF NOT EXISTS "meal_sponsorships_donationReceivedDate_idx" ON "meal_sponsorships"("donationReceivedDate");

DO $$ BEGIN
  ALTER TABLE "meal_sponsorships" ADD CONSTRAINT "meal_sponsorships_donorId_fkey"
    FOREIGN KEY ("donorId") REFERENCES "donors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "meal_sponsorships" ADD CONSTRAINT "meal_sponsorships_donationId_fkey"
    FOREIGN KEY ("donationId") REFERENCES "donations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "meal_sponsorships" ADD CONSTRAINT "meal_sponsorships_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Phase 1.5 columns (additive, all nullable / have defaults) ────────────

ALTER TABLE "meal_sponsorships"
  ADD COLUMN IF NOT EXISTS "selectedMenuItems"  TEXT[]               DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS "specialMenuItem"    TEXT,
  ADD COLUMN IF NOT EXISTS "telecallerName"     TEXT,
  ADD COLUMN IF NOT EXISTS "totalAmount"        DECIMAL(15,2),
  ADD COLUMN IF NOT EXISTS "amountReceived"     DECIMAL(15,2)        NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "paymentStatus"      "MealPaymentStatus",
  ADD COLUMN IF NOT EXISTS "transactionId"      TEXT;

-- Make paymentType optional so old records keep value, new records may omit it
DO $$ BEGIN
  ALTER TABLE "meal_sponsorships" ALTER COLUMN "paymentType" DROP NOT NULL;
EXCEPTION WHEN OTHERS THEN null; END $$;

-- Phase 1.6 — Evening Snacks slot ──────────────────────────────────────

ALTER TABLE "meal_sponsorships"
  ADD COLUMN IF NOT EXISTS "eveningSnacks" BOOLEAN NOT NULL DEFAULT false;

-- Phase 1.6 — Backfill legacy full-paid records ────────────────────────
-- Rule: records where totalAmount IS NULL (pre-Phase-1.5), paymentType = FULL,
-- and amountReceived = 0 are old entries that were fully paid but had no
-- Phase 1.5 tracking fields filled. Backfill so they display correctly.

UPDATE meal_sponsorships
SET
  "totalAmount" = amount,
  "amountReceived" = amount,
  "paymentStatus" = 'FULL'::"MealPaymentStatus"
WHERE
  "totalAmount" IS NULL
  AND "paymentType" = 'FULL'::"MealPaymentType"
  AND "amountReceived" = 0;

-- Phase 1.8 — Occasion Relationship field ──────────────────────────────

ALTER TABLE "meal_sponsorships"
  ADD COLUMN IF NOT EXISTS "occasionRelationship" TEXT;

-- Phase 2A — Per-slot homes (slotHomes JSON) ─────────────────────────

ALTER TABLE "meal_sponsorships"
  ADD COLUMN IF NOT EXISTS "slotHomes" JSONB;

-- ═══════════════════════════════════════════════════════════════════════
-- VERIFICATION (uncomment and run to confirm)
-- ═══════════════════════════════════════════════════════════════════════
-- SELECT EXISTS (
--   SELECT 1 FROM information_schema.tables
--   WHERE table_schema = 'public' AND table_name = 'meal_sponsorships'
-- ) AS table_exists;
--
-- SELECT EXISTS (
--   SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
--   WHERE t.typname = 'DonationPurpose' AND e.enumlabel = 'MEAL_DONATION'
-- ) AS meal_donation_exists;
--
-- SELECT column_name, data_type FROM information_schema.columns
-- WHERE table_name = 'meal_sponsorships' ORDER BY ordinal_position;
