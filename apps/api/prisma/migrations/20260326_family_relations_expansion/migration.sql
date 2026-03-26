-- Expand FamilyRelationType enum with granular relation values
ALTER TYPE "FamilyRelationType" ADD VALUE IF NOT EXISTS 'SON';
ALTER TYPE "FamilyRelationType" ADD VALUE IF NOT EXISTS 'DAUGHTER';
ALTER TYPE "FamilyRelationType" ADD VALUE IF NOT EXISTS 'BROTHER';
ALTER TYPE "FamilyRelationType" ADD VALUE IF NOT EXISTS 'SISTER';
ALTER TYPE "FamilyRelationType" ADD VALUE IF NOT EXISTS 'FATHER_IN_LAW';
ALTER TYPE "FamilyRelationType" ADD VALUE IF NOT EXISTS 'MOTHER_IN_LAW';
ALTER TYPE "FamilyRelationType" ADD VALUE IF NOT EXISTS 'GRANDFATHER';
ALTER TYPE "FamilyRelationType" ADD VALUE IF NOT EXISTS 'GRANDMOTHER';
ALTER TYPE "FamilyRelationType" ADD VALUE IF NOT EXISTS 'GRANDSON';
ALTER TYPE "FamilyRelationType" ADD VALUE IF NOT EXISTS 'GRANDDAUGHTER';
ALTER TYPE "FamilyRelationType" ADD VALUE IF NOT EXISTS 'GRANDCHILD';
ALTER TYPE "FamilyRelationType" ADD VALUE IF NOT EXISTS 'FIANCE';
ALTER TYPE "FamilyRelationType" ADD VALUE IF NOT EXISTS 'FIANCEE';
ALTER TYPE "FamilyRelationType" ADD VALUE IF NOT EXISTS 'FRIEND';
ALTER TYPE "FamilyRelationType" ADD VALUE IF NOT EXISTS 'COLLEAGUE';
ALTER TYPE "FamilyRelationType" ADD VALUE IF NOT EXISTS 'BOSS';
ALTER TYPE "FamilyRelationType" ADD VALUE IF NOT EXISTS 'MENTOR';

-- Add sourceFamilyMemberId to tasks for deduplication of family birthday tasks
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "sourceFamilyMemberId" TEXT;

-- Index for fast dedup lookups
CREATE INDEX IF NOT EXISTS "tasks_sourceFamilyMemberId_idx" ON "tasks"("sourceFamilyMemberId");

-- Foreign key to donor_family_members
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_sourceFamilyMemberId_fkey"
  FOREIGN KEY ("sourceFamilyMemberId") REFERENCES "donor_family_members"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
