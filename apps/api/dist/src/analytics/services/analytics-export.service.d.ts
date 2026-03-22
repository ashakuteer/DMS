export declare class AnalyticsExportService {
    exportSummaryPdf(data: any): Promise<Buffer>;
    exportDonationsXlsx(data?: any[]): Promise<Buffer>;
    exportDonationsDetailXlsx(filters: any): Promise<Buffer>;
    exportRiskXlsx(data?: any[]): Promise<Buffer>;
    exportBoardSummaryPdf(data?: any): Promise<Buffer>;
    exportHomeTotalsXlsx(data?: any[]): Promise<Buffer>;
}
