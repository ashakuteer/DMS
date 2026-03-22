export declare class BeneficiaryHealthService {
    getMetrics(beneficiaryId: string): Promise<any[]>;
    addMetric(user: any, beneficiaryId: string, dto: any): Promise<{
        status: string;
    }>;
    addHealthEvent(user: any, beneficiaryId: string, dto: any): Promise<{
        status: string;
    }>;
    sendHealthEventToSponsors(user: any, eventId: string): Promise<{
        status: string;
    }>;
    getHealthEvents(beneficiaryId: string): Promise<any[]>;
    getHealthTimeline(beneficiaryId: string): Promise<any[]>;
    exportHealthHistoryPdf(beneficiaryId: string): Promise<any[]>;
}
