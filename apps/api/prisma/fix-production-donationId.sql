-- ============================================================
-- FIX: Add missing donationId column to communication_messages
-- Safe for production: nullable, no data loss, idempotent
-- Run against Supabase DIRECT connection (port 5432, not 6543)
-- ============================================================

-- 1. Add the column (IF NOT EXISTS prevents errors if already applied)
ALTER TABLE "communication_messages" ADD COLUMN IF NOT EXISTS "donationId" TEXT;

-- 2. Add index for fast lookups
CREATE INDEX IF NOT EXISTS "communication_messages_donationId_idx" ON "communication_messages"("donationId");

-- 3. Verify the fix
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'communication_messages' AND column_name = 'donationId';
