-- Normalize existing donor phone numbers to a canonical 10-digit form,
-- then add a partial UNIQUE index on donors.primaryPhone for non-deleted rows.
--
-- Safe & non-destructive:
--   * Only updates rows where normalization actually changes the value.
--   * Skips creating the unique index if duplicates remain after normalization
--     (logs a NOTICE so we can clean them up manually before retrying).
--   * IF NOT EXISTS guards make this re-runnable.

-- ---------------------------------------------------------------------------
-- Step 1: Normalize existing values in primaryPhone, whatsappPhone, alternatePhone
--   Rules: strip non-digits, drop leading "91" (country code), drop leading "0",
--          keep the last 10 digits.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION pg_temp.normalize_phone(p text) RETURNS text AS $$
DECLARE
  d text;
BEGIN
  IF p IS NULL THEN RETURN NULL; END IF;
  d := regexp_replace(p, '\D', '', 'g');
  IF d IS NULL OR length(d) = 0 THEN RETURN NULL; END IF;
  IF length(d) > 10 AND left(d, 2) = '91' THEN
    d := substring(d FROM 3);
  END IF;
  IF length(d) > 10 AND left(d, 1) = '0' THEN
    d := substring(d FROM 2);
  END IF;
  IF length(d) > 10 THEN
    d := right(d, 10);
  END IF;
  IF length(d) < 10 THEN RETURN NULL; END IF;
  RETURN d;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

UPDATE "donors"
SET "primaryPhone" = pg_temp.normalize_phone("primaryPhone")
WHERE "primaryPhone" IS NOT NULL
  AND pg_temp.normalize_phone("primaryPhone") IS NOT NULL
  AND pg_temp.normalize_phone("primaryPhone") <> "primaryPhone";

UPDATE "donors"
SET "whatsappPhone" = pg_temp.normalize_phone("whatsappPhone")
WHERE "whatsappPhone" IS NOT NULL
  AND pg_temp.normalize_phone("whatsappPhone") IS NOT NULL
  AND pg_temp.normalize_phone("whatsappPhone") <> "whatsappPhone";

UPDATE "donors"
SET "alternatePhone" = pg_temp.normalize_phone("alternatePhone")
WHERE "alternatePhone" IS NOT NULL
  AND pg_temp.normalize_phone("alternatePhone") IS NOT NULL
  AND pg_temp.normalize_phone("alternatePhone") <> "alternatePhone";

-- ---------------------------------------------------------------------------
-- Step 2: Conditionally create a partial UNIQUE index on primaryPhone for
--         non-deleted donors. If duplicates still exist, skip and log them
--         so the migration does not fail.
-- ---------------------------------------------------------------------------

DO $$
DECLARE
  dup_count integer;
  dup_record record;
BEGIN
  SELECT COUNT(*) INTO dup_count
  FROM (
    SELECT "primaryPhone"
    FROM "donors"
    WHERE "isDeleted" = false AND "primaryPhone" IS NOT NULL
    GROUP BY "primaryPhone"
    HAVING COUNT(*) > 1
  ) d;

  IF dup_count > 0 THEN
    RAISE NOTICE 'donors_primary_phone_unique: % duplicate primaryPhone group(s) found among non-deleted donors. Skipping unique index creation. Resolve duplicates and re-run.', dup_count;
    FOR dup_record IN
      SELECT "primaryPhone", COUNT(*) AS cnt
      FROM "donors"
      WHERE "isDeleted" = false AND "primaryPhone" IS NOT NULL
      GROUP BY "primaryPhone"
      HAVING COUNT(*) > 1
      ORDER BY cnt DESC
      LIMIT 20
    LOOP
      RAISE NOTICE '  duplicate primaryPhone=% count=%', dup_record."primaryPhone", dup_record.cnt;
    END LOOP;
  ELSE
    EXECUTE 'CREATE UNIQUE INDEX IF NOT EXISTS "donors_primary_phone_unique" ON "donors"("primaryPhone") WHERE "isDeleted" = false AND "primaryPhone" IS NOT NULL';
  END IF;
END $$;
