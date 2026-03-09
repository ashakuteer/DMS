import { Injectable } from "@nestjs/common";
import { DonorsImportParserService } from "./donors-import-parser.service";
import { DuplicatesService } from "./duplicates.service";
import { ExecutorService } from "./executor.service";

@Injectable()
export class DonorsImportService {
  constructor(
    private parser: DonorsImportParserService,
    private duplicates: DuplicatesService,
    private executor: ExecutorService,
  ) {}

  async parseImportFile(file: Express.Multer.File) {
    return this.parser.parseImportFile(file);
  }

  async detectDuplicates(rows: any[], mapping: Record<string, string>) {
    return this.duplicates.detectDuplicatesInBatch(rows, mapping);
  }

  async executeBulkImport(
    user: any,
    rows: any[],
    mapping: Record<string, string>,
    actions: Record<number, "skip" | "update" | "create">,
  ) {
    return this.executor.executeBulkImport(user, rows, mapping, actions);
  }

  async bulkUpload(file: Express.Multer.File, user: any) {
    return this.executor.bulkUpload(file, user);
  }

  async generateBulkTemplate() {
    return this.parser.generateBulkTemplate();
  }
}
