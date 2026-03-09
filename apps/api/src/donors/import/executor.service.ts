import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditService } from "../../audit/audit.service";

@Injectable()
export class ExecutorService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService
  ) {}

  async executeBulkImport(
    user: any,
    rows: any[],
    mapping: Record<string, string>,
    actions: Record<number, "skip" | "update" | "create">,
    ip?: string,
    agent?: string
  ) {
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const action = actions[i] || "skip";

      if (action === "skip") continue;

      const data: any = {};

      Object.keys(mapping).forEach((key) => {
        data[key] = row[mapping[key]];
      });

      if (action === "create") {
        await this.prisma.donor.create({
          data: {
            ...data,
            createdById: user.id,
          },
        });
      }
    }

    await this.auditService.logDataExport(
      user.id,
      "Bulk Import",
      { rows: rows.length },
      rows.length,
      ip,
      agent
    );

    return { success: true };
  }

  async bulkUpload(file: any, user: any) {
    return {
      message: "Bulk upload started",
      user: user.id,
    };
  }
}
