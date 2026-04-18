-- Add MEALS to the SupportPreference enum.
-- Idempotent and non-destructive. Safe to re-run.

ALTER TYPE "SupportPreference" ADD VALUE IF NOT EXISTS 'MEALS';
