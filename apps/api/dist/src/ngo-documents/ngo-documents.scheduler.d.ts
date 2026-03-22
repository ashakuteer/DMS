import { NgoDocumentsService } from './ngo-documents.service';
export declare class NgoDocumentsScheduler {
    private ngoDocumentsService;
    private readonly logger;
    constructor(ngoDocumentsService: NgoDocumentsService);
    checkExpiringDocuments(): Promise<void>;
}
