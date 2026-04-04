-- Meals Module Phase 1 — Safe Additive Migration
-- All statements use IF NOT EXISTS / DO $$ blocks for idempotency.
-- Safe to re-run. No destructive changes. No existing data is modified.

-- ─── Step 1: Add MEAL_DONATION to existing DonationPurpose enum ───────────────
-- NOTE: ALTER TYPE ... ADD VALUE cannot run inside a transaction block in older PG.
-- This statement must execute first, before any table changes reference the new value.
ALTER TYPE "DonationPurpose" ADD VALUE IF NOT EXISTS 'MEAL_DONATION';

-- ─── Step 2: Create new enum types (guarded with DO $$ to be idempotent) ───────

DO $$ BEGIN
  CREATE TYPE "MealSponsorshipType" AS ENUM ('ENTIRE_DAY', 'SELECTED_MEALS');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "MealFoodType" AS ENUM ('VEG', 'NON_VEG');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "MealPaymentType" AS ENUM ('ADVANCE', 'FULL');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "MealOccasionType" AS ENUM ('NONE', 'BIRTHDAY', 'WEDDING_ANNIVERSARY', 'MEMORIAL', 'OTHER');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "MealOccasionFor" AS ENUM ('SELF', 'OTHER');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ─── Step 3: Create meal_sponsorships table ────────────────────────────────────

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
    "paymentType"          "MealPaymentType" NOT NULL,
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

-- ─── Step 4: Unique constraint on donationId ────────────────────────────────────

DO $$ BEGIN
  ALTER TABLE "meal_sponsorships"
    ADD CONSTRAINT "meal_sponsorships_donationId_key" UNIQUE ("donationId");
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ─── Step 5: Indexes ─────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS "meal_sponsorships_donorId_idx"
  ON "meal_sponsorships"("donorId");

CREATE INDEX IF NOT EXISTS "meal_sponsorships_mealServiceDate_idx"
  ON "meal_sponsorships"("mealServiceDate");

CREATE INDEX IF NOT EXISTS "meal_sponsorships_donationReceivedDate_idx"
  ON "meal_sponsorships"("donationReceivedDate");

-- ─── Step 6: Foreign keys ────────────────────────────────────────────────────────

DO $$ BEGIN
  ALTER TABLE "meal_sponsorships"
    ADD CONSTRAINT "meal_sponsorships_donorId_fkey"
    FOREIGN KEY ("donorId") REFERENCES "donors"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "meal_sponsorships"
    ADD CONSTRAINT "meal_sponsorships_donationId_fkey"
    FOREIGN KEY ("donationId") REFERENCES "donations"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "meal_sponsorships"
    ADD CONSTRAINT "meal_sponsorships_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "users"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
