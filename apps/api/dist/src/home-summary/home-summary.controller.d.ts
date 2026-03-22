import { Response } from 'express';
import { HomeSummaryService } from './home-summary.service';
export declare class HomeSummaryController {
    private readonly service;
    constructor(service: HomeSummaryService);
    getSummary(month: string, year: string): Promise<import("./home-summary.service").HomeSummaryData>;
    downloadPdf(month: string, year: string, res: Response): Promise<void>;
    downloadExcel(month: string, year: string, res: Response): Promise<void>;
}
