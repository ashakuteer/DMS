import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';

function resolveDbUrl(): string {
  const {
    PGHOST,
    PGPORT,
    PGUSER,
    PGPASSWORD,
    PGDATABASE,
    DATABASE_URL,
  } = process.env;

  if (DATABASE_URL?.trim()) {
    return DATABASE_URL.trim();
  }

  if (PGHOST && PGUSER && PGPASSWORD && PGDATABASE) {
    const port = PGPORT || '5432';
    return `postgresql://${encodeURIComponent(PGUSER)}:${encodeURIComponent(PGPASSWORD)}@${PGHOST}:${port}/${PGDATABASE}`;
  }

  throw new Error(
    'No database connection configured. Set DATABASE_URL or PGHOST/PGUSER/PGPASSWORD/PGDATABASE.',
  );
}

function appendPoolParams(rawUrl: string): string {
  const url = new URL(rawUrl);

  if (!url.searchParams.has('connection_limit')) {
    url.searchParams.set('connection_limit', '5');
  }

  const isSupabasePoolerPort = url.port === '6543';
  if (isSupabasePoolerPort && !url.searchParams.has('pgbouncer')) {
    url.searchParams.set('pgbouncer', 'true');
  }

  return url.toString();
}

function maskDbUrl(rawUrl: string): string {
  try {
    const url = new URL(rawUrl);
    if (url.username) {
      url.username = '***';
    }
    if (url.password) {
      url.password = '***';
    }
    return url.toString();
  } catch {
    return rawUrl.replace(/\/\/(.*?)(:.*)?@/, '//***:***@');
  }
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private isConnected = false;

  constructor() {
    const rawUrl = resolveDbUrl();
    const url = appendPoolParams(rawUrl);

    const prismaOptions: Prisma.PrismaClientOptions = {
      datasources: {
        db: { url },
      },
      log:
        process.env.NODE_ENV === 'development'
          ? ['query', 'info', 'warn', 'error']
          : ['error'],
    };

    super(prismaOptions);

    this.logger.log(`Database target: ${maskDbUrl(url)}`);
  }

  async onModuleInit(): Promise<void> {
    if (this.isConnected) {
      return;
    }

    const maxRetries = 5;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.$connect();
        this.isConnected = true;
        this.logger.log('Database connected successfully');
        await this.applySchemaPatches();
        return;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Unknown database connection error';

        this.logger.warn(`DB connect attempt ${attempt}/${maxRetries} failed: ${message}`);

        if (attempt === maxRetries) {
          this.logger.error('Database connection failed after maximum retries');
          throw error;
        }

        const delayMs = attempt * 2000;
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  private async applySchemaPatches(): Promise<void> {
    const patches = [
      // ── Archive columns (donors + beneficiaries) ──────────────────────────
      `ALTER TABLE "donors" ADD COLUMN IF NOT EXISTS "deletedBy" TEXT`,
      `ALTER TABLE "donors" ADD COLUMN IF NOT EXISTS "deleteReason" TEXT`,
      `ALTER TABLE "beneficiaries" ADD COLUMN IF NOT EXISTS "deletedBy" TEXT`,
      `ALTER TABLE "beneficiaries" ADD COLUMN IF NOT EXISTS "deleteReason" TEXT`,

      // ── Staff task enum types ─────────────────────────────────────────────
      `DO $$ BEGIN CREATE TYPE "TaskStatus" AS ENUM ('PENDING','IN_PROGRESS','COMPLETED','OVERDUE'); EXCEPTION WHEN duplicate_object THEN null; END $$`,
      `DO $$ BEGIN CREATE TYPE "TaskPriority" AS ENUM ('LOW','MEDIUM','HIGH','URGENT'); EXCEPTION WHEN duplicate_object THEN null; END $$`,
      `DO $$ BEGIN CREATE TYPE "TaskCategory" AS ENUM ('GENERAL','DONOR_FOLLOWUP','BENEFICIARY_UPDATE','DATA_ENTRY','REPORTING','COMMUNICATION','EVENT','OTHER'); EXCEPTION WHEN duplicate_object THEN null; END $$`,
      `DO $$ BEGIN CREATE TYPE "RecurrenceType" AS ENUM ('NONE','DAILY','WEEKLY','MONTHLY'); EXCEPTION WHEN duplicate_object THEN null; END $$`,

      // ── staff_tasks table ─────────────────────────────────────────────────
      `CREATE TABLE IF NOT EXISTS "staff_tasks" (
        "id"             TEXT             NOT NULL DEFAULT gen_random_uuid()::text,
        "title"          TEXT             NOT NULL,
        "description"    TEXT,
        "status"         "TaskStatus"     NOT NULL DEFAULT 'PENDING',
        "priority"       "TaskPriority"   NOT NULL DEFAULT 'MEDIUM',
        "category"       "TaskCategory"   NOT NULL DEFAULT 'GENERAL',
        "assignedToId"   TEXT             NOT NULL,
        "createdById"    TEXT             NOT NULL,
        "linkedDonorId"  TEXT,
        "dueDate"        TIMESTAMP(3),
        "startedAt"      TIMESTAMP(3),
        "completedAt"    TIMESTAMP(3),
        "notes"          TEXT,
        "isRecurring"    BOOLEAN          NOT NULL DEFAULT false,
        "recurrenceType" "RecurrenceType" NOT NULL DEFAULT 'NONE',
        "parentTaskId"   TEXT,
        "checklist"      JSONB,
        "createdAt"      TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt"      TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "deletedAt"      TIMESTAMP(3),
        CONSTRAINT "staff_tasks_pkey" PRIMARY KEY ("id")
      )`,

      // ── staff_tasks foreign keys ──────────────────────────────────────────
      `DO $$ BEGIN ALTER TABLE "staff_tasks" ADD CONSTRAINT "staff_tasks_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$`,
      `DO $$ BEGIN ALTER TABLE "staff_tasks" ADD CONSTRAINT "staff_tasks_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$`,
      `DO $$ BEGIN ALTER TABLE "staff_tasks" ADD CONSTRAINT "staff_tasks_linkedDonorId_fkey" FOREIGN KEY ("linkedDonorId") REFERENCES "donors"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$`,
      `DO $$ BEGIN ALTER TABLE "staff_tasks" ADD CONSTRAINT "staff_tasks_parentTaskId_fkey" FOREIGN KEY ("parentTaskId") REFERENCES "staff_tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$`,

      // ── staff_tasks indexes ───────────────────────────────────────────────
      `CREATE INDEX IF NOT EXISTS "staff_tasks_assignedToId_idx" ON "staff_tasks"("assignedToId")`,
      `CREATE INDEX IF NOT EXISTS "staff_tasks_status_idx" ON "staff_tasks"("status")`,
      `CREATE INDEX IF NOT EXISTS "staff_tasks_dueDate_idx" ON "staff_tasks"("dueDate")`,
      `CREATE INDEX IF NOT EXISTS "staff_tasks_createdById_idx" ON "staff_tasks"("createdById")`,
      `CREATE INDEX IF NOT EXISTS "staff_tasks_parentTaskId_idx" ON "staff_tasks"("parentTaskId")`,

      // ── staff_performance table ───────────────────────────────────────────
      `CREATE TABLE IF NOT EXISTS "staff_performance" (
        "id"             TEXT             NOT NULL DEFAULT gen_random_uuid()::text,
        "userId"         TEXT             NOT NULL,
        "month"          INTEGER          NOT NULL,
        "year"           INTEGER          NOT NULL,
        "tasksAssigned"  INTEGER          NOT NULL DEFAULT 0,
        "tasksCompleted" INTEGER          NOT NULL DEFAULT 0,
        "tasksOnTime"    INTEGER          NOT NULL DEFAULT 0,
        "tasksOverdue"   INTEGER          NOT NULL DEFAULT 0,
        "followUpsDone"  INTEGER          NOT NULL DEFAULT 0,
        "donorResponses" INTEGER          NOT NULL DEFAULT 0,
        "score"          DOUBLE PRECISION NOT NULL DEFAULT 0,
        "createdAt"      TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt"      TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "staff_performance_pkey" PRIMARY KEY ("id")
      )`,

      // ── staff_performance foreign key + unique constraint ─────────────────
      `DO $$ BEGIN ALTER TABLE "staff_performance" ADD CONSTRAINT "staff_performance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$`,
      `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'staff_performance_userId_month_year_key') THEN ALTER TABLE "staff_performance" ADD CONSTRAINT "staff_performance_userId_month_year_key" UNIQUE ("userId","month","year"); END IF; END $$`,

      // ── staff_performance indexes ─────────────────────────────────────────
      `CREATE INDEX IF NOT EXISTS "staff_performance_userId_idx" ON "staff_performance"("userId")`,
      `CREATE INDEX IF NOT EXISTS "staff_performance_year_month_idx" ON "staff_performance"("year","month")`,
    ];

    for (const sql of patches) {
      try {
        await this.$executeRawUnsafe(sql);
      } catch (err) {
        this.logger.warn(
          `Schema patch skipped: ${sql} — ${err instanceof Error ? err.message : err}`,
        );
      }
    }

    this.logger.log('Schema patches applied');
  }

  async onModuleDestroy(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    await this.$disconnect();
    this.isConnected = false;
    this.logger.log('Database disconnected');
  }
}
