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
    // Dashboard runs ~48 parallel queries; pool of 5 causes severe queuing.
    // 15 connections handles peak concurrent load without overloading the DB.
    url.searchParams.set('connection_limit', '15');
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
      `ALTER TABLE "donors" ADD COLUMN IF NOT EXISTS "donorSince" TIMESTAMP(3)`,
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

      // ── staff_tasks missing-column patches (idempotent ADD COLUMN) ─────────
      // These are needed when staff_tasks was created before these columns were added.
      `ALTER TABLE "staff_tasks" ADD COLUMN IF NOT EXISTS "parentTaskId"   TEXT`,
      `ALTER TABLE "staff_tasks" ADD COLUMN IF NOT EXISTS "checklist"      JSONB`,
      `ALTER TABLE "staff_tasks" ADD COLUMN IF NOT EXISTS "deletedAt"      TIMESTAMP(3)`,
      `ALTER TABLE "staff_tasks" ADD COLUMN IF NOT EXISTS "isRecurring"    BOOLEAN NOT NULL DEFAULT false`,
      `ALTER TABLE "staff_tasks" ADD COLUMN IF NOT EXISTS "recurrenceType" TEXT NOT NULL DEFAULT 'NONE'`,
      `ALTER TABLE "staff_tasks" ADD COLUMN IF NOT EXISTS "linkedDonorId"  TEXT`,
      `ALTER TABLE "staff_tasks" ADD COLUMN IF NOT EXISTS "startedAt"      TIMESTAMP(3)`,
      `ALTER TABLE "staff_tasks" ADD COLUMN IF NOT EXISTS "completedAt"    TIMESTAMP(3)`,

      // ── SourceOfDonor enum extension ──────────────────────────────────────
      `ALTER TYPE "SourceOfDonor" ADD VALUE IF NOT EXISTS 'GOOGLE'`,

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
      `DO $$ BEGIN ALTER TABLE "staff_performance" ADD CONSTRAINT "staff_performance_userId_month_year_key" UNIQUE ("userId","month","year"); EXCEPTION WHEN duplicate_object THEN null; END $$`,

      // ── staff_performance indexes ─────────────────────────────────────────
      `CREATE INDEX IF NOT EXISTS "staff_performance_userId_idx" ON "staff_performance"("userId")`,
      `CREATE INDEX IF NOT EXISTS "staff_performance_year_month_idx" ON "staff_performance"("year","month")`,

      // ── Performance indexes for dashboard queries ─────────────────────────
      // beneficiaries: needed for GROUP BY createdAt and deletedAt filters
      `CREATE INDEX IF NOT EXISTS "beneficiaries_createdAt_idx" ON "beneficiaries"("createdAt")`,
      `CREATE INDEX IF NOT EXISTS "beneficiaries_deletedAt_createdAt_idx" ON "beneficiaries"("deletedAt","createdAt")`,
      // sponsorships: needed for GROUP BY createdAt and status+createdAt queries
      `CREATE INDEX IF NOT EXISTS "sponsorships_createdAt_idx" ON "sponsorships"("createdAt")`,
      `CREATE INDEX IF NOT EXISTS "sponsorships_status_createdAt_idx" ON "sponsorships"("status","createdAt")`,
      // donors: compound index for deletedAt + createdAt (impact monthly queries)
      `CREATE INDEX IF NOT EXISTS "donors_deletedAt_createdAt_idx" ON "donors"("deletedAt","createdAt")`,

      // ── Role-based donor profile upgrade (2025) ───────────────────────────
      // Step 1: PersonRole enum
      `DO $$ BEGIN CREATE TYPE "PersonRole" AS ENUM ('INDIVIDUAL','CSR','VOLUNTEER','INFLUENCER'); EXCEPTION WHEN duplicate_object THEN null; END $$`,

      // Step 2: Extend DonationFrequency enum with new values
      `ALTER TYPE "DonationFrequency" ADD VALUE IF NOT EXISTS 'BI_WEEKLY'`,
      `ALTER TYPE "DonationFrequency" ADD VALUE IF NOT EXISTS 'BI_MONTHLY'`,
      `ALTER TYPE "DonationFrequency" ADD VALUE IF NOT EXISTS 'FESTIVAL_BASED'`,

      // Step 3: Extend SupportPreference enum with new values
      `ALTER TYPE "SupportPreference" ADD VALUE IF NOT EXISTS 'SNACKS_SWEETS'`,
      `ALTER TYPE "SupportPreference" ADD VALUE IF NOT EXISTS 'IN_KIND'`,
      `ALTER TYPE "SupportPreference" ADD VALUE IF NOT EXISTS 'CASH'`,

      // Step 4: New columns on donors table
      `ALTER TABLE "donors" ADD COLUMN IF NOT EXISTS "primaryRole" "PersonRole" NOT NULL DEFAULT 'INDIVIDUAL'`,
      `ALTER TABLE "donors" ADD COLUMN IF NOT EXISTS "additionalRoles" "PersonRole"[] NOT NULL DEFAULT ARRAY[]::"PersonRole"[]`,
      `ALTER TABLE "donors" ADD COLUMN IF NOT EXISTS "donorTags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[]`,
      `ALTER TABLE "donors" ADD COLUMN IF NOT EXISTS "communicationChannels" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[]`,
      `ALTER TABLE "donors" ADD COLUMN IF NOT EXISTS "preferredCommunicationMethod" TEXT`,
      `ALTER TABLE "donors" ADD COLUMN IF NOT EXISTS "communicationNotes" TEXT`,

      // Step 5: Index on donors.primaryRole
      `CREATE INDEX IF NOT EXISTS "donors_primaryRole_idx" ON "donors"("primaryRole")`,

      // Step 6: individual_donor_profiles table
      `CREATE TABLE IF NOT EXISTS "individual_donor_profiles" (
        "id"                TEXT                  NOT NULL DEFAULT gen_random_uuid()::text,
        "donorId"           TEXT                  NOT NULL,
        "donationFrequency" "DonationFrequency",
        "supportTypes"      "SupportPreference"[] NOT NULL DEFAULT ARRAY[]::"SupportPreference"[],
        "donorTags"         TEXT[]                NOT NULL DEFAULT ARRAY[]::TEXT[],
        "createdAt"         TIMESTAMP(3)          NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt"         TIMESTAMP(3)          NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "individual_donor_profiles_pkey" PRIMARY KEY ("id")
      )`,
      `DO $$ BEGIN ALTER TABLE "individual_donor_profiles" ADD CONSTRAINT "individual_donor_profiles_donorId_fkey" FOREIGN KEY ("donorId") REFERENCES "donors"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$`,
      `DO $$ BEGIN ALTER TABLE "individual_donor_profiles" ADD CONSTRAINT "individual_donor_profiles_donorId_key" UNIQUE ("donorId"); EXCEPTION WHEN duplicate_object THEN null; END $$`,
      `CREATE INDEX IF NOT EXISTS "individual_donor_profiles_donorId_idx" ON "individual_donor_profiles"("donorId")`,

      // Step 7: volunteer_profiles table
      `CREATE TABLE IF NOT EXISTS "volunteer_profiles" (
        "id"               TEXT         NOT NULL DEFAULT gen_random_uuid()::text,
        "donorId"          TEXT         NOT NULL,
        "volunteerType"    TEXT,
        "workMode"         TEXT,
        "skills"           TEXT[]       NOT NULL DEFAULT ARRAY[]::TEXT[],
        "areasOfInterest"  TEXT[]       NOT NULL DEFAULT ARRAY[]::TEXT[],
        "availabilityType" TEXT,
        "timePreference"   TEXT,
        "engagementLevel"  TEXT,
        "willingToDonate"  BOOLEAN      NOT NULL DEFAULT false,
        "lastActivityDate" TIMESTAMP(3),
        "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "volunteer_profiles_pkey" PRIMARY KEY ("id")
      )`,
      `DO $$ BEGIN ALTER TABLE "volunteer_profiles" ADD CONSTRAINT "volunteer_profiles_donorId_fkey" FOREIGN KEY ("donorId") REFERENCES "donors"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$`,
      `DO $$ BEGIN ALTER TABLE "volunteer_profiles" ADD CONSTRAINT "volunteer_profiles_donorId_key" UNIQUE ("donorId"); EXCEPTION WHEN duplicate_object THEN null; END $$`,
      `CREATE INDEX IF NOT EXISTS "volunteer_profiles_donorId_idx" ON "volunteer_profiles"("donorId")`,

      // Step 8: influencer_profiles table
      `CREATE TABLE IF NOT EXISTS "influencer_profiles" (
        "id"                   TEXT         NOT NULL DEFAULT gen_random_uuid()::text,
        "donorId"              TEXT         NOT NULL,
        "influenceTypes"       TEXT[]       NOT NULL DEFAULT ARRAY[]::TEXT[],
        "audienceSize"         INTEGER,
        "engagementLevel"      TEXT,
        "contributionTypes"    TEXT[]       NOT NULL DEFAULT ARRAY[]::TEXT[],
        "contributionPattern"  TEXT,
        "totalReferrals"       INTEGER      NOT NULL DEFAULT 0,
        "estimatedFunds"       DECIMAL(15,2),
        "lastCampaignDate"     TIMESTAMP(3),
        "relationshipStrength" TEXT,
        "createdAt"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "influencer_profiles_pkey" PRIMARY KEY ("id")
      )`,
      `DO $$ BEGIN ALTER TABLE "influencer_profiles" ADD CONSTRAINT "influencer_profiles_donorId_fkey" FOREIGN KEY ("donorId") REFERENCES "donors"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$`,
      `DO $$ BEGIN ALTER TABLE "influencer_profiles" ADD CONSTRAINT "influencer_profiles_donorId_key" UNIQUE ("donorId"); EXCEPTION WHEN duplicate_object THEN null; END $$`,
      `CREATE INDEX IF NOT EXISTS "influencer_profiles_donorId_idx" ON "influencer_profiles"("donorId")`,

      // Step 9: csr_profiles table
      `CREATE TABLE IF NOT EXISTS "csr_profiles" (
        "id"                   TEXT         NOT NULL DEFAULT gen_random_uuid()::text,
        "donorId"              TEXT         NOT NULL,
        "companyName"          TEXT,
        "designation"          TEXT,
        "industry"             TEXT,
        "companySize"          TEXT,
        "csrBudget"            DECIMAL(15,2),
        "focusAreas"           TEXT[]       NOT NULL DEFAULT ARRAY[]::TEXT[],
        "supportTypes"         TEXT[]       NOT NULL DEFAULT ARRAY[]::TEXT[],
        "decisionRole"         TEXT,
        "relationshipStrength" TEXT,
        "lastContactDate"      TIMESTAMP(3),
        "nextFollowUpDate"     TIMESTAMP(3),
        "meetingStatus"        TEXT,
        "expectedContribution" DECIMAL(15,2),
        "proposalShared"       BOOLEAN      NOT NULL DEFAULT false,
        "createdAt"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "csr_profiles_pkey" PRIMARY KEY ("id")
      )`,
      `DO $$ BEGIN ALTER TABLE "csr_profiles" ADD CONSTRAINT "csr_profiles_donorId_fkey" FOREIGN KEY ("donorId") REFERENCES "donors"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$`,
      `DO $$ BEGIN ALTER TABLE "csr_profiles" ADD CONSTRAINT "csr_profiles_donorId_key" UNIQUE ("donorId"); EXCEPTION WHEN duplicate_object THEN null; END $$`,
      `CREATE INDEX IF NOT EXISTS "csr_profiles_donorId_idx" ON "csr_profiles"("donorId")`,

      // Step 10: new CSR profile columns
      `ALTER TABLE "csr_profiles" ADD COLUMN IF NOT EXISTS "companyAddress" TEXT`,
      `ALTER TABLE "csr_profiles" ADD COLUMN IF NOT EXISTS "csrAltName" TEXT`,
      `ALTER TABLE "csr_profiles" ADD COLUMN IF NOT EXISTS "csrAltPhone" TEXT`,
      `ALTER TABLE "csr_profiles" ADD COLUMN IF NOT EXISTS "csrAltEmail" TEXT`,
      `ALTER TABLE "csr_profiles" ADD COLUMN IF NOT EXISTS "csrOfficialEmailPrimary" TEXT`,
      `ALTER TABLE "csr_profiles" ADD COLUMN IF NOT EXISTS "csrOfficialEmailSecondary" TEXT`,
      `ALTER TABLE "csr_profiles" ADD COLUMN IF NOT EXISTS "csrSupportType" TEXT`,

      // Step 11: new Volunteer profile columns
      `ALTER TABLE "volunteer_profiles" ADD COLUMN IF NOT EXISTS "inmatesSupport" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[]`,
      `ALTER TABLE "volunteer_profiles" ADD COLUMN IF NOT EXISTS "adminSupport" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[]`,

      // Step 12: new Influencer profile columns
      `ALTER TABLE "influencer_profiles" ADD COLUMN IF NOT EXISTS "groupName" TEXT`,
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
