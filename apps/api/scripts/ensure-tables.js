'use strict';

/**
 * ensure-tables.js
 *
 * Runs at Railway startup BEFORE the NestJS app.
 * Creates any tables that might be missing due to migration failures.
 *
 * WHY THIS EXISTS:
 *   Supabase uses pgBouncer on port 6543 (transaction pooling mode).
 *   `prisma migrate deploy` acquires a PostgreSQL advisory lock at the
 *   SESSION level, which pgBouncer in transaction mode cannot forward.
 *   Result: migrate deploy hangs → Railway times it out → table never created.
 *
 *   This script uses PrismaClient.$executeRawUnsafe() which runs plain SQL
 *   with NO advisory locks → works fine through pgBouncer.
 *
 * LONG-TERM FIX:
 *   Set DIRECT_URL in Railway to your Supabase direct connection (port 5432).
 *   Then `prisma migrate deploy` can use a real session and advisory locks work.
 *   schema.prisma already has `directUrl = env("DIRECT_URL")` ready.
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: [],
});

async function ensureTables() {
  console.log('[STARTUP] Running table safety checks...');
  const start = Date.now();

  try {
    // ── report_history ────────────────────────────────────────────────────
    console.log('[STARTUP]   Checking report_history...');
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "report_history" (
        "id"        TEXT          NOT NULL,
        "name"      TEXT          NOT NULL,
        "filters"   JSONB         NOT NULL,
        "groupBy"   TEXT          NOT NULL,
        "createdAt" TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "report_history_pkey" PRIMARY KEY ("id")
      )
    `);
    console.log('[STARTUP]   ✓ report_history table ready');

    // ── verify: count rows to confirm the table actually works ────────────
    const rows = await prisma.$queryRawUnsafe(
      'SELECT COUNT(*) AS cnt FROM "report_history"'
    );
    console.log(`[STARTUP]   ✓ report_history verified (${rows[0].cnt} existing rows)`);

  } catch (err) {
    // Log clearly but do NOT exit — the app has its own try/catch fallbacks.
    console.error('[STARTUP] ✗ Table safety check failed:', err.message);
    console.error('[STARTUP]   App will still start; report history may be unavailable until fixed.');
  } finally {
    await prisma.$disconnect();
    const elapsed = Date.now() - start;
    console.log(`[STARTUP] Safety checks complete (${elapsed}ms)`);
  }
}

ensureTables().catch((err) => {
  console.error('[STARTUP] Unexpected error in ensure-tables:', err);
  // Still exit 0 so the app can start
  process.exit(0);
});
