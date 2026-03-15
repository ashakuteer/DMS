-- Create staff_tasks and staff_performance tables
-- These tables were added to the schema without a migration file.
-- All statements use IF NOT EXISTS / exception-safe DO blocks so this
-- migration is safe to replay on databases that already have these tables.

-- ─── Enum types ──────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE "TaskStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "TaskPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "TaskCategory" AS ENUM (
    'GENERAL', 'DONOR_FOLLOWUP', 'BENEFICIARY_UPDATE',
    'DATA_ENTRY', 'REPORTING', 'COMMUNICATION', 'EVENT', 'OTHER'
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "RecurrenceType" AS ENUM ('NONE', 'DAILY', 'WEEKLY', 'MONTHLY');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- ─── staff_tasks ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "staff_tasks" (
  "id"             TEXT          NOT NULL DEFAULT gen_random_uuid()::text,
  "title"          TEXT          NOT NULL,
  "description"    TEXT,
  "status"         "TaskStatus"  NOT NULL DEFAULT 'PENDING',
  "priority"       "TaskPriority" NOT NULL DEFAULT 'MEDIUM',
  "category"       "TaskCategory" NOT NULL DEFAULT 'GENERAL',
  "assignedToId"   TEXT          NOT NULL,
  "createdById"    TEXT          NOT NULL,
  "linkedDonorId"  TEXT,
  "dueDate"        TIMESTAMP(3),
  "startedAt"      TIMESTAMP(3),
  "completedAt"    TIMESTAMP(3),
  "notes"          TEXT,
  "isRecurring"    BOOLEAN       NOT NULL DEFAULT false,
  "recurrenceType" "RecurrenceType" NOT NULL DEFAULT 'NONE',
  "parentTaskId"   TEXT,
  "checklist"      JSONB,
  "createdAt"      TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt"      TIMESTAMP(3),
  CONSTRAINT "staff_tasks_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "staff_tasks"
    ADD CONSTRAINT "staff_tasks_assignedToId_fkey"
    FOREIGN KEY ("assignedToId") REFERENCES "users"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "staff_tasks"
    ADD CONSTRAINT "staff_tasks_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "users"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "staff_tasks"
    ADD CONSTRAINT "staff_tasks_linkedDonorId_fkey"
    FOREIGN KEY ("linkedDonorId") REFERENCES "donors"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "staff_tasks"
    ADD CONSTRAINT "staff_tasks_parentTaskId_fkey"
    FOREIGN KEY ("parentTaskId") REFERENCES "staff_tasks"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS "staff_tasks_assignedToId_idx" ON "staff_tasks"("assignedToId");
CREATE INDEX IF NOT EXISTS "staff_tasks_status_idx"       ON "staff_tasks"("status");
CREATE INDEX IF NOT EXISTS "staff_tasks_dueDate_idx"      ON "staff_tasks"("dueDate");
CREATE INDEX IF NOT EXISTS "staff_tasks_createdById_idx"  ON "staff_tasks"("createdById");
CREATE INDEX IF NOT EXISTS "staff_tasks_parentTaskId_idx" ON "staff_tasks"("parentTaskId");

-- ─── staff_performance ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "staff_performance" (
  "id"             TEXT    NOT NULL DEFAULT gen_random_uuid()::text,
  "userId"         TEXT    NOT NULL,
  "month"          INTEGER NOT NULL,
  "year"           INTEGER NOT NULL,
  "tasksAssigned"  INTEGER NOT NULL DEFAULT 0,
  "tasksCompleted" INTEGER NOT NULL DEFAULT 0,
  "tasksOnTime"    INTEGER NOT NULL DEFAULT 0,
  "tasksOverdue"   INTEGER NOT NULL DEFAULT 0,
  "followUpsDone"  INTEGER NOT NULL DEFAULT 0,
  "donorResponses" INTEGER NOT NULL DEFAULT 0,
  "score"          DOUBLE PRECISION NOT NULL DEFAULT 0,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "staff_performance_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "staff_performance"
    ADD CONSTRAINT "staff_performance_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'staff_performance_userId_month_year_key'
  ) THEN
    ALTER TABLE "staff_performance"
      ADD CONSTRAINT "staff_performance_userId_month_year_key"
      UNIQUE ("userId", "month", "year");
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "staff_performance_userId_idx"    ON "staff_performance"("userId");
CREATE INDEX IF NOT EXISTS "staff_performance_year_month_idx" ON "staff_performance"("year", "month");
