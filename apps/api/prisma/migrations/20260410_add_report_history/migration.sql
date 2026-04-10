-- report_history table
-- Safe to re-run: uses IF NOT EXISTS.

CREATE TABLE IF NOT EXISTS "report_history" (
  "id"        TEXT NOT NULL,
  "name"      TEXT NOT NULL,
  "filters"   JSONB NOT NULL,
  "groupBy"   TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "report_history_pkey" PRIMARY KEY ("id")
);
