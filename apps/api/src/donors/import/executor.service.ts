import { Injectable } from "@nestjs/common";

@Injectable()
export class ExecutorService {
import { PrismaService } from "../../prisma/prisma.service";
import { AuditService } from "../../audit/audit.service";
import { UserContext } from "../donors.types";

@Injectable()
export class DonorsImportExecutorService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async executeBulkImport(
    user: UserContext,
    rows: any[],
    mapping: Record<string, string>,
    actions: Record<number, "skip" | "update" | "create">,
    ip?: string,
    agent?: string,
  ) {

    const results = {
      imported: 0,
      updated: 0,
      skipped: 0,
      failed: 0,
    };

    for (let i = 0; i < rows.length; i++) {

      const row = rows[i];
      const action = actions[i] || "skip";

      try {

        if (action === "skip") {
          results.skipped++;
          continue;
        }

        if (action === "create") {

          await this.prisma.donor.create({
            data: {
              ...row,
              createdById: user.id,
            },
          });

          results.imported++;
        }

      } catch (err) {
        results.failed++;
      }
    }

    await this.auditService.logDataExport(
      user.id,
      "Bulk Import",
      results,
      results.imported + results.updated,
      ip,
      agent,
    );

    return results;
  }

  async bulkUpload() {
    // keep your existing logic here
  }
}
