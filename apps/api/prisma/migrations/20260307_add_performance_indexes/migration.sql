-- Performance Optimization Indexes
-- Phase 1: Add indexes for frequently queried columns
-- Expected Impact: 2-5x faster queries across the board

-- Donor table indexes for dashboard actions query
CREATE INDEX IF NOT EXISTS "donors_isDeleted_donationFrequency_idx" ON "donors"("isDeleted", "donationFrequency");
CREATE INDEX IF NOT EXISTS "donors_isDeleted_updatedAt_idx" ON "donors"("isDeleted", "updatedAt");

-- Donation table indexes for faster date-based queries
CREATE INDEX IF NOT EXISTS "donations_isDeleted_donationDate_idx" ON "donations"("isDeleted", "donationDate");
CREATE INDEX IF NOT EXISTS "donations_donorId_isDeleted_donationDate_idx" ON "donations"("donorId", "isDeleted", "donationDate");
CREATE INDEX IF NOT EXISTS "donations_donationMode_idx" ON "donations"("donationMode");
CREATE INDEX IF NOT EXISTS "donations_donationType_idx" ON "donations"("donationType");

-- Sponsorship table indexes for reminder queries
CREATE INDEX IF NOT EXISTS "sponsorships_isActive_status_idx" ON "sponsorships"("isActive", "status");
CREATE INDEX IF NOT EXISTS "sponsorships_frequency_dueDayOfMonth_idx" ON "sponsorships"("frequency", "dueDayOfMonth");
CREATE INDEX IF NOT EXISTS "sponsorships_isActive_frequency_idx" ON "sponsorships"("isActive", "frequency");
