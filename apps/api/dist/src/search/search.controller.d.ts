import { SearchService } from './search.service';
export declare class SearchController {
    private readonly searchService;
    constructor(searchService: SearchService);
    globalSearch(query: string, limit?: string, entityType?: string, donorCategory?: string, donorCity?: string, beneficiaryHomeType?: string, beneficiaryStatus?: string, beneficiaryAgeGroup?: string, beneficiarySponsored?: string, campaignStatus?: string, campaignStartFrom?: string, campaignStartTo?: string): Promise<import("./search.service").SearchResult>;
}
