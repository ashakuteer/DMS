-- Performance Optimization Indexes
-- Applied: March 7, 2026

-- Donation table indexes for faster queries
CREATE INDEX IF NOT EXISTS "idx_donation_deleted_date" 
  ON "Donation"("deletedAt", "donationDate") 
  WHERE "deletedAt" IS NULL;

CREATE INDEX IF NOT EXISTS "idx_donation_donor_deleted_date" 
  ON "Donation"("donorId", "deletedAt", "donationDate");

CREATE INDEX IF NOT EXISTS "idx_donation_mode" 
  ON "Donation"("donationMode");

CREATE INDEX IF NOT EXISTS "idx_donation_type" 
  ON "Donation"("donationType");

-- Donor table indexes for faster queries
CREATE INDEX IF NOT EXISTS "idx_donor_deleted_frequency" 
  ON "Donor"("deletedAt", "donationFrequency") 
  WHERE "deletedAt" IS NULL;

CREATE INDEX IF NOT EXISTS "idx_donor_deleted_created" 
  ON "Donor"("deletedAt", "createdAt");

-- Sponsorship indexes for donor insights
CREATE INDEX IF NOT EXISTS "idx_sponsorship_donor_status" 
  ON "Sponsorship"("donorId", "status");

-- Pledge indexes for engagement queries
CREATE INDEX IF NOT EXISTS "idx_pledge_donor_deleted_status" 
  ON "Pledge"("donorId", "deletedAt", "status");
