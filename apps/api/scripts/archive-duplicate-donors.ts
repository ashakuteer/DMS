/**
 * archive-duplicate-donors.ts
 *
 * Production-safe script to soft-delete (archive) confirmed duplicate donors.
 * Run with: npx ts-node scripts/archive-duplicate-donors.ts
 *
 * These donor codes were confirmed as duplicates by the foundation on 2026-04-10.
 * The script:
 *  1. Looks up each donor by donorCode
 *  2. Skips if not found or already archived
 *  3. Soft-deletes (sets isDeleted=true, deletedAt=now()) without touching donations/meals/etc.
 *  4. Logs every action for audit trail
 */

import { PrismaClient } from "@prisma/client";

const DUPLICATE_DONOR_CODES = [
  "AKF-DNR-1775735208206",
  "AKF-DNR-1775732529397",
  "AKF-DNR-1775727024061",
  "AKF-DNR-1775727006808",
  "AKF-DNR-1775717270679",
  "AKF-DNR-1775717249257",
  "AKF-DNR-1775716895840",
];

async function main() {
  const prisma = new PrismaClient();

  console.log("=== Duplicate Donor Archival Script ===");
  console.log(`Date: ${new Date().toISOString()}`);
  console.log(`Donor codes to process: ${DUPLICATE_DONOR_CODES.length}`);
  console.log("");

  const results: Array<{
    donorCode: string;
    status: string;
    details: string;
    donationCount?: number;
    mealCount?: number;
  }> = [];

  for (const code of DUPLICATE_DONOR_CODES) {
    const donor = await prisma.donor.findFirst({
      where: { donorCode: code },
      select: {
        id: true,
        donorCode: true,
        firstName: true,
        lastName: true,
        primaryPhone: true,
        isDeleted: true,
        deletedAt: true,
        createdAt: true,
        _count: {
          select: {
            donations: true,
            meals: true,
          },
        },
      },
    });

    if (!donor) {
      console.log(`[SKIP] ${code} — not found in database`);
      results.push({ donorCode: code, status: "NOT_FOUND", details: "Not in database" });
      continue;
    }

    if (donor.isDeleted) {
      console.log(`[SKIP] ${code} — already archived (deletedAt: ${donor.deletedAt})`);
      results.push({
        donorCode: code,
        status: "ALREADY_ARCHIVED",
        details: `Previously archived at ${donor.deletedAt}`,
        donationCount: donor._count.donations,
        mealCount: donor._count.meals,
      });
      continue;
    }

    // Log linked data before archiving
    console.log(
      `[INFO] ${code} — ${donor.firstName} ${donor.lastName ?? ""} | ` +
        `Phone: ${donor.primaryPhone ?? "n/a"} | ` +
        `Donations: ${donor._count.donations} | ` +
        `Meals: ${donor._count.meals} | ` +
        `Created: ${donor.createdAt.toISOString()}`
    );

    // Perform soft-delete — linked records (donations, meals, etc.) are preserved
    await prisma.donor.update({
      where: { id: donor.id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });

    console.log(`[ARCHIVED] ${code} — soft-deleted successfully`);
    results.push({
      donorCode: code,
      status: "ARCHIVED",
      details: `Archived ${donor.firstName} ${donor.lastName ?? ""} (${donor.id})`,
      donationCount: donor._count.donations,
      mealCount: donor._count.meals,
    });
  }

  console.log("\n=== Summary ===");
  console.table(results);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("Script failed:", e);
  process.exit(1);
});
