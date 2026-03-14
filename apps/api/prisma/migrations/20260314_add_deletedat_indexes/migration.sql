-- Phase 2: Add deletedAt indexes
-- Root cause: dashboard services filter by `deletedAt: null` but Phase 1 indexes
-- were on `isDeleted` (boolean). The query planner cannot use isDeleted indexes
-- when the WHERE clause filters on deletedAt. These indexes fix that mismatch.

-- Donor table: dashboard queries use deletedAt: null as the primary soft-delete filter
CREATE INDEX IF NOT EXISTS "donors_deletedAt_idx" ON "donors"("deletedAt");
CREATE INDEX IF NOT EXISTS "donors_deletedAt_donationFrequency_idx" ON "donors"("deletedAt", "donationFrequency");

-- Donation table: all dashboard aggregate/findMany queries filter deletedAt: null + donationDate
CREATE INDEX IF NOT EXISTS "donations_deletedAt_idx" ON "donations"("deletedAt");
CREATE INDEX IF NOT EXISTS "donations_deletedAt_donationDate_idx" ON "donations"("deletedAt", "donationDate");
CREATE INDEX IF NOT EXISTS "donations_donorId_deletedAt_donationDate_idx" ON "donations"("donorId", "deletedAt", "donationDate");

-- CommunicationMessage: getInsightCards queries by donorId + createdAt (CommunicationLog already had this)
CREATE INDEX IF NOT EXISTS "communication_messages_donorId_createdAt_idx" ON "communication_messages"("donorId", "createdAt");

-- ReminderTask: getDailyActions filters status=OPEN AND dueDate<=15days (composite helps both filters)
CREATE INDEX IF NOT EXISTS "reminder_tasks_status_dueDate_idx" ON "reminder_tasks"("status", "dueDate");
