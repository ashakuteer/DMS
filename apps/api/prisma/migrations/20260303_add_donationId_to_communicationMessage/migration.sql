-- AlterTable: Add donationId column to communication_messages
-- Safe for production: nullable column, no data loss, no default required
ALTER TABLE "communication_messages" ADD COLUMN IF NOT EXISTS "donationId" TEXT;

-- CreateIndex: Add index on donationId for fast lookups (idempotent)
CREATE INDEX IF NOT EXISTS "communication_messages_donationId_idx" ON "communication_messages"("donationId");
