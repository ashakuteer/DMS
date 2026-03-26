-- Add failed-attempt counter to OTPs for brute-force protection.
-- MAX_OTP_ATTEMPTS = 5: after 5 wrong codes the OTP is burned and
-- the user must request a new one.
ALTER TABLE "otps" ADD COLUMN IF NOT EXISTS "failedAttempts" INTEGER NOT NULL DEFAULT 0;
