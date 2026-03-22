import { ImportNormalizerService } from "./import-normalizer.service";
import { DuplicatesService } from "./duplicates.service";
import { ExecutorService } from "./executor.service";
import { DonorsImportParserService } from "./donors-import-parser.service";
export declare class DonorsImportService {
    private parser;
    private normalizer;
    private duplicates;
    private executor;
    constructor(parser: DonorsImportParserService, normalizer: ImportNormalizerService, duplicates: DuplicatesService, executor: ExecutorService);
    parseImportFile(file: Express.Multer.File): Promise<{
        headers: string[];
        rows: any[][];
        totalRows: number;
    }>;
    detectDuplicates(rows: any[], mapping: Record<string, string>): Promise<{
        id: string;
        donorCode: string;
        firstName: string;
        lastName: string;
        primaryPhone: string;
        personalEmail: string;
    }[]>;
    executeBulkImport(user: any, rows: any[], mapping: Record<string, string>, actions: Record<number, "skip" | "update" | "create">): Promise<{
        success: boolean;
    }>;
    bulkUpload(file: Express.Multer.File, user: any): Promise<{
        message: string;
        user: any;
    }>;
}
