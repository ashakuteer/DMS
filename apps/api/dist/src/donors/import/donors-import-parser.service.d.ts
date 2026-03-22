export declare class DonorsImportParserService {
    parseImportFile(file: Express.Multer.File): Promise<{
        headers: string[];
        rows: any[][];
        totalRows: number;
    }>;
    generateBulkTemplate(): Promise<Buffer>;
}
