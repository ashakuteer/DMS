import { HealthScoreService } from './health-score.service';
export declare class HealthScoreScheduler {
    private healthScoreService;
    private readonly logger;
    constructor(healthScoreService: HealthScoreService);
    recalculateHealthScores(): Promise<void>;
}
