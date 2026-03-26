-- Add extended in-law and extended family relations to FamilyRelationType enum
ALTER TYPE "FamilyRelationType" ADD VALUE IF NOT EXISTS 'BROTHER_IN_LAW';
ALTER TYPE "FamilyRelationType" ADD VALUE IF NOT EXISTS 'SISTER_IN_LAW';
ALTER TYPE "FamilyRelationType" ADD VALUE IF NOT EXISTS 'SON_IN_LAW';
ALTER TYPE "FamilyRelationType" ADD VALUE IF NOT EXISTS 'DAUGHTER_IN_LAW';
ALTER TYPE "FamilyRelationType" ADD VALUE IF NOT EXISTS 'COUSIN';
ALTER TYPE "FamilyRelationType" ADD VALUE IF NOT EXISTS 'UNCLE';
ALTER TYPE "FamilyRelationType" ADD VALUE IF NOT EXISTS 'AUNT';
