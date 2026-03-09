import { Injectable } from "@nestjs/common";

import { AnalyticsSummaryService } from "./analytics-summary.service";
import { AnalyticsChartsService } from "./analytics-charts.service";
import { AnalyticsSegmentsService } from "./analytics-segments.service";
import { AnalyticsRiskService } from "./analytics-risk.service";

@Injectable()
export class AnalyticsDashboardService {
constructor(
private readonly summaryService: AnalyticsSummaryService,
private readonly chartsService: AnalyticsChartsService,
private readonly segmentsService: AnalyticsSegmentsService,
private readonly riskService: AnalyticsRiskService,
) {}

async getManagementDashboard() {
const [
summary,
monthlyDonations,
topDonors,
atRiskDonors,
] = await Promise.all([
this.summaryService.getSummary(),
this.chartsService.getMonthlyDonationSeries(),
this.segmentsService.getTopDonorsSegment(),
this.riskService.computeAtRiskDonors(),
]);

```
return {
  summary,

  charts: {
    monthlyDonations,
  },

  segments: {
    topDonors,
  },

  risks: {
    atRiskDonors,
  },

  generatedAt: new Date(),
};
```

}
}
