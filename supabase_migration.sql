-- ============================================================
-- SAFE ADDITIVE MIGRATION FOR SUPABASE
-- Run this in Supabase SQL Editor (Settings → SQL Editor)
-- All statements are idempotent — safe to run multiple times
-- ============================================================

-- ============================================================
-- STEP 1: Create missing enum types (safe — no error if exists)
-- ============================================================

DO $$ BEGIN CREATE TYPE "SupportPreference" AS ENUM ('GROCERIES','EDUCATION','MEDICINES','TOILETRIES','SPONSORSHIP','GENERAL','SNACKS_SWEETS','IN_KIND','CASH'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "KindCategory" AS ENUM ('GROCERIES','MEDICINES','TOILETRIES','STATIONERY','CLOTHES','OTHER'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "DonationCategory" AS ENUM ('GROCERIES','MEDICINES','EDUCATION','SPONSOR','OTHER'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "DonationOccasion" AS ENUM ('BIRTHDAY','ANNIVERSARY','FESTIVAL','MEMORIAL','GENERAL'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "DonationSchedule" AS ENUM ('ONE_TIME','MONTHLY','QUARTERLY'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "TaskType" AS ENUM ('BIRTHDAY','FOLLOW_UP','PLEDGE','REMINDER','MANUAL','GENERAL','INTERNAL'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "TaskStatus" AS ENUM ('PENDING','IN_PROGRESS','COMPLETED','OVERDUE','MISSED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "TaskPriority" AS ENUM ('LOW','MEDIUM','HIGH','URGENT'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "TaskCategory" AS ENUM ('GENERAL','DONOR_FOLLOWUP','BENEFICIARY_UPDATE','DATA_ENTRY','REPORTING','COMMUNICATION','EVENT','OTHER'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "RecurrenceType" AS ENUM ('NONE','DAILY','WEEKLY','MONTHLY','QUARTERLY','HALF_YEARLY','ANNUAL'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "DonorEngagement" AS ENUM ('HOT','WARM','COLD'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "HealthStatus" AS ENUM ('GREEN','YELLOW','RED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "PersonRole" AS ENUM ('INDIVIDUAL','CSR','VOLUNTEER','INFLUENCER'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "DonationHomeType" AS ENUM ('GIRLS_HOME','BLIND_BOYS_HOME','OLD_AGE_HOME','GENERAL'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "DonationMode" AS ENUM ('CASH','UPI','GPAY','PHONEPE','CHEQUE','ONLINE','BANK_TRANSFER','IN_KIND'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "DonationPurpose" AS ENUM ('FESTIVAL_DONATION','SPONSORSHIP','GENERAL_SUPPORT','EMERGENCY','MEMORIAL','CELEBRATION'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "StaffStatus" AS ENUM ('ACTIVE','INACTIVE'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "StaffDocumentType" AS ENUM ('PHOTO','AADHAR','PAN','APPOINTMENT','EXPERIENCE','OTHER'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "TimeMachineCategory" AS ENUM ('SUCCESS_STORY','INSPIRING_STORY','RECOGNITION','DONOR_SUPPORT','EVENT_BY_KIDS','VISITOR_VISIT','CHALLENGE_PROBLEM','GENERAL_UPDATE'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "TimeMachineHome" AS ENUM ('ALL_HOMES','GIRLS_HOME_UPPAL','BLIND_HOME_BEGUMPET','OLD_AGE_HOME_PEERZADIGUDA'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "CommChannel" AS ENUM ('WHATSAPP','EMAIL'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "CommProvider" AS ENUM ('TWILIO','SMTP'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "CommStatus" AS ENUM ('QUEUED','SENT','DELIVERED','READ','FAILED','UNDELIVERED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "Profession" AS ENUM ('DOCTOR','BUSINESS','IT','GOVT','OTHER'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "FollowUpPriority" AS ENUM ('LOW','NORMAL','HIGH','URGENT'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "FollowUpStatus" AS ENUM ('PENDING','COMPLETED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "NgoDocCategory" AS ENUM ('CERTIFICATE','COMPLIANCE','MOU','LEGAL','FINANCIAL','POLICY','REPORT','OTHER'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "EmailJobType" AS ENUM ('SPECIAL_DAY','PLEDGE_REMINDER','FOLLOW_UP','DONOR_BIRTHDAY','BENEFICIARY_BIRTHDAY','SPONSORSHIP_REMINDER','REPORT_CAMPAIGN','DONOR_UPDATE','BENEFICIARY_PROGRESS_REPORT'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "EmailJobStatus" AS ENUM ('QUEUED','SENT','FAILED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "ReminderTaskStatus" AS ENUM ('OPEN','DONE','SNOOZED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "BeneficiaryHealthStatus" AS ENUM ('NORMAL','SICK','HOSPITALIZED','UNDER_TREATMENT'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "HealthEventSeverity" AS ENUM ('LOW','MEDIUM','HIGH','CRITICAL'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "ProgressTerm" AS ENUM ('TERM_1','TERM_2','TERM_3','ANNUAL'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "SponsorshipReminderType" AS ENUM ('MONTHLY_DUE','UPCOMING_BENEFICIARY_BDAY','UPCOMING_DONOR_BDAY'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "SponsorshipReminderStatus" AS ENUM ('PENDING','DONE','SKIPPED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "SponsorDispatchChannel" AS ENUM ('EMAIL','WHATSAPP'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "SponsorDispatchStatus" AS ENUM ('QUEUED','SENT','FAILED','COPIED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "BeneficiaryUpdateType" AS ENUM ('GENERAL','MILESTONE','ACADEMIC','HEALTH','EDUCATION','ACHIEVEMENT','PHOTO','EVENT','THANK_YOU'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "MessageChannel" AS ENUM ('EMAIL','WHATSAPP'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "OutboundMessageType" AS ENUM ('DONOR_BIRTHDAY','BENEFICIARY_BIRTHDAY','REPORT_CAMPAIGN','DONOR_UPDATE'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "OutboundMessageStatus" AS ENUM ('QUEUED','SENT','COPIED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "DonorReportType" AS ENUM ('QUARTERLY','ANNUAL','CUSTOM'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "DonorReportStatus" AS ENUM ('GENERATING','READY','FAILED','SHARED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "ProgressReportStatus" AS ENUM ('GENERATING','READY','SHARED','FAILED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "DocumentOwnerType" AS ENUM ('BENEFICIARY','ORGANIZATION'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "DocumentType" AS ENUM ('PHOTO','BENEFICIARY_PHOTO','HOME_PHOTO','REPORT_CARD','MEDICAL_REPORT','AADHAAR','GOVT_ID','PRESCRIPTION','CERTIFICATE','OTHER'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "ReportCampaignType" AS ENUM ('QUARTERLY','ANNUAL','AUDIT','EVENT'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "ReportTarget" AS ENUM ('ALL_DONORS','SPONSORS_ONLY','CUSTOM'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "ReportCampaignStatus" AS ENUM ('DRAFT','QUEUED','SENT'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "CommunicationStatus" AS ENUM ('SENT','FAILED','OPENED','TRIGGERED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- STEP 2: Add missing columns to existing tables (IF NOT EXISTS)
-- ============================================================

-- donors: newer fields
ALTER TABLE "donors" ADD COLUMN IF NOT EXISTS "primaryRole" "PersonRole";
ALTER TABLE "donors" ADD COLUMN IF NOT EXISTS "additionalRoles" "PersonRole"[] DEFAULT ARRAY[]::"PersonRole"[];
ALTER TABLE "donors" ADD COLUMN IF NOT EXISTS "donorTags" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "donors" ADD COLUMN IF NOT EXISTS "communicationChannels" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "donors" ADD COLUMN IF NOT EXISTS "preferredCommunicationMethod" TEXT;
ALTER TABLE "donors" ADD COLUMN IF NOT EXISTS "communicationNotes" TEXT;
ALTER TABLE "donors" ADD COLUMN IF NOT EXISTS "supportPreferences" "SupportPreference"[] DEFAULT ARRAY[]::"SupportPreference"[];
ALTER TABLE "donors" ADD COLUMN IF NOT EXISTS "healthScore" INTEGER;
ALTER TABLE "donors" ADD COLUMN IF NOT EXISTS "healthStatus" "HealthStatus";
ALTER TABLE "donors" ADD COLUMN IF NOT EXISTS "lastHealthCheck" TIMESTAMP(3);
ALTER TABLE "donors" ADD COLUMN IF NOT EXISTS "engagementLevel" "DonorEngagement";
ALTER TABLE "donors" ADD COLUMN IF NOT EXISTS "assignedToUserId" TEXT;
ALTER TABLE "donors" ADD COLUMN IF NOT EXISTS "dobDay" INTEGER;
ALTER TABLE "donors" ADD COLUMN IF NOT EXISTS "dobMonth" INTEGER;
ALTER TABLE "donors" ADD COLUMN IF NOT EXISTS "donorSince" TIMESTAMP(3);
ALTER TABLE "donors" ADD COLUMN IF NOT EXISTS "profilePicUrl" TEXT;
ALTER TABLE "donors" ADD COLUMN IF NOT EXISTS "profilePicPath" TEXT;
ALTER TABLE "donors" ADD COLUMN IF NOT EXISTS "isUnder18Helper" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "donors" ADD COLUMN IF NOT EXISTS "isSeniorCitizen" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "donors" ADD COLUMN IF NOT EXISTS "isSingleParent" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "donors" ADD COLUMN IF NOT EXISTS "isDisabled" BOOLEAN NOT NULL DEFAULT false;

-- donations: newer fields
ALTER TABLE "donations" ADD COLUMN IF NOT EXISTS "donationCategory" "DonationCategory";
ALTER TABLE "donations" ADD COLUMN IF NOT EXISTS "donationOccasion" "DonationOccasion";
ALTER TABLE "donations" ADD COLUMN IF NOT EXISTS "scheduleType" "DonationSchedule";
ALTER TABLE "donations" ADD COLUMN IF NOT EXISTS "kindCategory" "KindCategory";
ALTER TABLE "donations" ADD COLUMN IF NOT EXISTS "kindDescription" TEXT;
ALTER TABLE "donations" ADD COLUMN IF NOT EXISTS "donationHomeType" "DonationHomeType";
ALTER TABLE "donations" ADD COLUMN IF NOT EXISTS "homeId" TEXT;
ALTER TABLE "donations" ADD COLUMN IF NOT EXISTS "visitedHome" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "donations" ADD COLUMN IF NOT EXISTS "servedFood" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "donations" ADD COLUMN IF NOT EXISTS "receiptNumber" TEXT;
ALTER TABLE "donations" ADD COLUMN IF NOT EXISTS "financialYear" TEXT;
ALTER TABLE "donations" ADD COLUMN IF NOT EXISTS "receiptPdfUrl" TEXT;
ALTER TABLE "donations" ADD COLUMN IF NOT EXISTS "attachmentUrl" TEXT;
ALTER TABLE "donations" ADD COLUMN IF NOT EXISTS "campaignId" TEXT;
ALTER TABLE "donations" ADD COLUMN IF NOT EXISTS "donationMode" "DonationMode";
ALTER TABLE "donations" ADD COLUMN IF NOT EXISTS "donationPurpose" "DonationPurpose";
ALTER TABLE "donations" ADD COLUMN IF NOT EXISTS "quantity" DECIMAL(10,2);
ALTER TABLE "donations" ADD COLUMN IF NOT EXISTS "unit" TEXT;
ALTER TABLE "donations" ADD COLUMN IF NOT EXISTS "itemDescription" TEXT;
ALTER TABLE "donations" ADD COLUMN IF NOT EXISTS "isDeleted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "donations" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

-- ============================================================
-- STEP 3: Create missing tables (IF NOT EXISTS)
-- ============================================================

CREATE TABLE IF NOT EXISTS "staff_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "homeId" TEXT,
    "fullName" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "role" TEXT,
    "department" TEXT,
    "designation" TEXT,
    "joinDate" TIMESTAMP(3),
    "status" "StaffStatus" NOT NULL DEFAULT 'ACTIVE',
    "photoUrl" TEXT,
    "photoPath" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "staff_profiles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "staff_documents" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "type" "StaffDocumentType" NOT NULL,
    "url" TEXT NOT NULL,
    "path" TEXT,
    "label" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "staff_documents_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "staff_bank_details" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "ifscCode" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "accountHolderName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "staff_bank_details_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "staff_bank_details_staffId_key" UNIQUE ("staffId")
);

CREATE TABLE IF NOT EXISTS "staff_salary" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "basicSalary" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "hra" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "da" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "otherAllowances" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "providentFund" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "professionalTax" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "otherDeductions" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "staff_salary_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "staff_salary_staffId_key" UNIQUE ("staffId")
);

CREATE TABLE IF NOT EXISTS "salary_payments" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "grossSalary" DECIMAL(15,2) NOT NULL,
    "totalDeductions" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "netSalary" DECIMAL(15,2) NOT NULL,
    "paidOn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paymentMethod" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "salary_payments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "staff_leaves" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "leaveType" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "days" DECIMAL(5,1) NOT NULL DEFAULT 1,
    "reason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "approvedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "staff_leaves_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "staff_attendance" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PRESENT',
    "inTime" TEXT,
    "outTime" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "staff_attendance_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "staff_attendance_staffId_date_key" ON "staff_attendance"("staffId", "date");

CREATE TABLE IF NOT EXISTS "task_templates" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "TaskType" NOT NULL DEFAULT 'MANUAL',
    "category" "TaskCategory" NOT NULL DEFAULT 'GENERAL',
    "priority" "TaskPriority" NOT NULL DEFAULT 'MEDIUM',
    "recurrenceType" "RecurrenceType" NOT NULL DEFAULT 'NONE',
    "recurrenceDays" INTEGER,
    "estimatedMinutes" INTEGER,
    "assignedToId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "task_templates_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "task_template_items" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "task_template_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "staff_tasks" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "TaskType" NOT NULL DEFAULT 'MANUAL',
    "category" "TaskCategory" NOT NULL DEFAULT 'GENERAL',
    "status" "TaskStatus" NOT NULL DEFAULT 'PENDING',
    "priority" "TaskPriority" NOT NULL DEFAULT 'MEDIUM',
    "dueDate" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "estimatedMinutes" INTEGER,
    "actualMinutes" INTEGER,
    "assignedToId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "linkedDonorId" TEXT,
    "templateId" TEXT,
    "parentTaskId" TEXT,
    "recurrenceType" "RecurrenceType" NOT NULL DEFAULT 'NONE',
    "recurrenceDays" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "staff_tasks_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "staff_tasks_assignedToId_idx" ON "staff_tasks"("assignedToId");
CREATE INDEX IF NOT EXISTS "staff_tasks_status_idx" ON "staff_tasks"("status");
CREATE INDEX IF NOT EXISTS "staff_tasks_dueDate_idx" ON "staff_tasks"("dueDate");
CREATE INDEX IF NOT EXISTS "staff_tasks_createdById_idx" ON "staff_tasks"("createdById");

CREATE TABLE IF NOT EXISTS "follow_ups" (
    "id" TEXT NOT NULL,
    "donorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "priority" "FollowUpPriority" NOT NULL DEFAULT 'NORMAL',
    "status" "FollowUpStatus" NOT NULL DEFAULT 'PENDING',
    "dueDate" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "assignedToId" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "follow_ups_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ngo_documents" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" "NgoDocCategory" NOT NULL DEFAULT 'OTHER',
    "description" TEXT,
    "fileUrl" TEXT NOT NULL,
    "filePath" TEXT,
    "fileName" TEXT,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "expiresAt" TIMESTAMP(3),
    "isConfidential" BOOLEAN NOT NULL DEFAULT false,
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ngo_documents_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ngo_document_access_logs" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL DEFAULT 'VIEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ngo_document_access_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "time_machine_entries" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" "TimeMachineCategory" NOT NULL DEFAULT 'GENERAL_UPDATE',
    "home" "TimeMachineHome" NOT NULL DEFAULT 'ALL_HOMES',
    "eventDate" TIMESTAMP(3) NOT NULL,
    "photos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdById" TEXT NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "time_machine_entries_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "email_jobs" (
    "id" TEXT NOT NULL,
    "donorId" TEXT,
    "toEmail" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "type" "EmailJobType" NOT NULL,
    "relatedId" TEXT,
    "status" "EmailJobStatus" NOT NULL DEFAULT 'QUEUED',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "email_jobs_pkey" PRIMARY KEY ("id")
);

-- ============================================================
-- STEP 4: Add missing foreign key constraints (safe via DO)
-- ============================================================

DO $$ BEGIN
  ALTER TABLE "donations" ADD CONSTRAINT "donations_homeId_fkey"
    FOREIGN KEY ("homeId") REFERENCES "beneficiaries"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "donations" ADD CONSTRAINT "donations_campaignId_fkey"
    FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "donors" ADD CONSTRAINT "donors_assignedToUserId_fkey"
    FOREIGN KEY ("assignedToUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "staff_tasks" ADD CONSTRAINT "staff_tasks_assignedToId_fkey"
    FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "staff_tasks" ADD CONSTRAINT "staff_tasks_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "staff_tasks" ADD CONSTRAINT "staff_tasks_linkedDonorId_fkey"
    FOREIGN KEY ("linkedDonorId") REFERENCES "donors"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "staff_salary" ADD CONSTRAINT "staff_salary_staffId_fkey"
    FOREIGN KEY ("staffId") REFERENCES "staff_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "staff_leaves" ADD CONSTRAINT "staff_leaves_staffId_fkey"
    FOREIGN KEY ("staffId") REFERENCES "staff_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "staff_attendance" ADD CONSTRAINT "staff_attendance_staffId_fkey"
    FOREIGN KEY ("staffId") REFERENCES "staff_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; END $$;

-- ============================================================
-- STEP 5: Add missing indexes on existing tables
-- ============================================================

CREATE INDEX IF NOT EXISTS "donations_donationHomeType_idx" ON "donations"("donationHomeType");
CREATE INDEX IF NOT EXISTS "donations_donationMode_idx" ON "donations"("donationMode");
CREATE INDEX IF NOT EXISTS "donations_donationType_idx" ON "donations"("donationType");
CREATE INDEX IF NOT EXISTS "donations_isDeleted_donationDate_idx" ON "donations"("isDeleted", "donationDate");
CREATE INDEX IF NOT EXISTS "donations_donorId_isDeleted_donationDate_idx" ON "donations"("donorId", "isDeleted", "donationDate");
CREATE INDEX IF NOT EXISTS "donations_deletedAt_idx" ON "donations"("deletedAt");
CREATE INDEX IF NOT EXISTS "donations_deletedAt_donationDate_idx" ON "donations"("deletedAt", "donationDate");
CREATE INDEX IF NOT EXISTS "donations_donorId_deletedAt_donationDate_idx" ON "donations"("donorId", "deletedAt", "donationDate");
CREATE INDEX IF NOT EXISTS "donors_primaryRole_idx" ON "donors"("primaryRole");
CREATE INDEX IF NOT EXISTS "donors_primaryPhone_idx" ON "donors"("primaryPhone");
CREATE INDEX IF NOT EXISTS "donors_assignedToUserId_idx" ON "donors"("assignedToUserId");

-- ============================================================
-- Done. All changes applied safely.
-- ============================================================
