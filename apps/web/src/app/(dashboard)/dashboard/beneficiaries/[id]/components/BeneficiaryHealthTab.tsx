"use client";

import { format } from "date-fns";
import {
  Activity,
  Clock,
  Copy,
  Download,
  Loader2,
  Mail,
  Paperclip,
  Plus,
  Ruler,
  Scale,
  Stethoscope,
  TrendingUp,
} from "lucide-react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import type {
  BeneficiaryMetric,
  HealthEvent,
  HealthTimelineItem,
} from "../types";
import {
  getHealthStatusBadgeClass,
  getHealthStatusLabel,
  getSeverityBadgeClass,
} from "../utils";

interface GrowthChartItem {
  date: string;
  dateLabel: string;
  heightCm?: number;
  weightKg?: number;
}

interface BeneficiaryHealthTabProps {
  metrics: BeneficiaryMetric[];
  metricsLoading: boolean;
  healthEvents: HealthEvent[];
  healthEventsLoading: boolean;
  healthTimeline: HealthTimelineItem[];
  healthTimelineLoading: boolean;
  growthChartData: GrowthChartItem[];
  exportingPdf: boolean;
  beneficiaryName: string;
  onOpenAddMetric: () => void;
  onOpenAddHealthEvent: () => void;
  onExportHealthPdf: () => void;
  onNotifySponsors: (eventId: string) => void;
  onCopyHealthWhatsApp: (event: HealthEvent) => void;
}

export default function BeneficiaryHealthTab({
  metrics,
  metricsLoading,
  healthEvents,
  healthEventsLoading,
  healthTimeline,
  healthTimelineLoading,
  growthChartData,
  exportingPdf,
  beneficiaryName,
  onOpenAddMetric,
  onOpenAddHealthEvent,
  onExportHealthPdf,
  onNotifySponsors,
  onCopyHealthWhatsApp,
}: BeneficiaryHealthTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Health Tracking
        </h3>

        <div className="flex gap-2 flex-wrap">
          <Button onClick={onOpenAddMetric} data-testid="button-add-metric">
            <Plus className="h-4 w-4 mr-2" />
            Add Measurement
          </Button>

          <Button
            variant="outline"
            onClick={onOpenAddHealthEvent}
            data-testid="button-add-health-event"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Health Event
          </Button>

          <Button
            variant="outline"
            onClick={onExportHealthPdf}
            disabled={exportingPdf}
            data-testid="button-export-health-pdf"
          >
            {exportingPdf ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Export PDF
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-base font-semibold flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Growth Measurements
        </h4>

        {metricsLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : metrics.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center h-40">
              <Ruler className="h-8 w-8 mb-2 opacity-50 text-muted-foreground" />
              <p className="text-muted-foreground">No measurements recorded yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {metrics
              .slice()
              .sort(
                (a, b) =>
                  new Date(b.recordedOn).getTime() - new Date(a.recordedOn).getTime()
              )
              .map((metric) => (
                <Card key={metric.id} data-testid={`card-metric-${metric.id}`}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between mb-2 flex-wrap gap-1">
                      <span className="text-sm font-medium text-muted-foreground">
                        {format(new Date(metric.recordedOn), "MMM d, yyyy")}
                      </span>

                      <Badge
                        className={getHealthStatusBadgeClass(
                          metric.healthStatus || "NORMAL"
                        )}
                        data-testid={`badge-health-status-${metric.id}`}
                      >
                        {getHealthStatusLabel(metric.healthStatus || "NORMAL")}
                      </Badge>
                    </div>

                    <div className="flex gap-4">
                      {metric.heightCm != null && (
                        <div className="flex items-center gap-1">
                          <Ruler className="h-4 w-4 text-muted-foreground" />
                          <span className="font-semibold">{metric.heightCm} cm</span>
                        </div>
                      )}

                      {metric.weightKg != null && (
                        <div className="flex items-center gap-1">
                          <Scale className="h-4 w-4 text-muted-foreground" />
                          <span className="font-semibold">{metric.weightKg} kg</span>
                        </div>
                      )}
                    </div>

                    {metric.notes && (
                      <p className="text-sm text-muted-foreground mt-2">
                        {metric.notes}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
          </div>
        )}
      </div>

      {growthChartData.length >= 2 && (
        <Card data-testid="chart-growth">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Growth Chart
            </CardTitle>
          </CardHeader>

          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={growthChartData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="dateLabel" tick={{ fontSize: 12 }} />
                <YAxis
                  yAxisId="height"
                  orientation="left"
                  label={{
                    value: "Height (cm)",
                    angle: -90,
                    position: "insideLeft",
                    style: { fontSize: 12 },
                  }}
                />
                <YAxis
                  yAxisId="weight"
                  orientation="right"
                  label={{
                    value: "Weight (kg)",
                    angle: 90,
                    position: "insideRight",
                    style: { fontSize: 12 },
                  }}
                />
                <Tooltip />
                <Legend />
                <Line
                  yAxisId="height"
                  type="monotone"
                  dataKey="heightCm"
                  stroke="#4f46e5"
                  strokeWidth={2}
                  name="Height (cm)"
                  dot={{ r: 4 }}
                  connectNulls
                />
                <Line
                  yAxisId="weight"
                  type="monotone"
                  dataKey="weightKg"
                  stroke="#e11d48"
                  strokeWidth={2}
                  name="Weight (kg)"
                  dot={{ r: 4 }}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        <h4 className="text-base font-semibold flex items-center gap-2">
          <Stethoscope className="h-4 w-4" />
          Health Events
        </h4>

        {healthEventsLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : healthEvents.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center h-40">
              <Stethoscope className="h-8 w-8 mb-2 opacity-50 text-muted-foreground" />
              <p className="text-muted-foreground">No health events recorded</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {healthEvents.map((event) => (
              <Card key={event.id} data-testid={`card-health-event-${event.id}`}>
                <CardContent className="pt-4">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">{event.title}</span>

                        <Badge className={getSeverityBadgeClass(event.severity)}>
                          {event.severity}
                        </Badge>

                        {event.shareWithDonor && (
                          <Badge variant="outline" className="text-xs">
                            Shared with Donors
                          </Badge>
                        )}
                      </div>

                      <p className="text-sm text-muted-foreground">
                        {format(new Date(event.eventDate), "MMM d, yyyy")}
                      </p>

                      <p className="text-sm mt-1">{event.description}</p>

                      {event.document && (
                        <div className="flex items-center gap-1 mt-2">
                          <Paperclip className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {event.document.title}
                          </span>
                        </div>
                      )}
                    </div>

                    {event.shareWithDonor && (
                      <div className="flex gap-2 flex-shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onNotifySponsors(event.id)}
                          data-testid={`button-notify-sponsors-${event.id}`}
                        >
                          <Mail className="h-3 w-3 mr-1" />
                          Email
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onCopyHealthWhatsApp(event)}
                          data-testid={`button-whatsapp-health-${event.id}`}
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          WhatsApp
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <h4 className="text-base font-semibold flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Health Timeline
        </h4>

        {healthTimelineLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : healthTimeline.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center h-40">
              <Clock className="h-8 w-8 mb-2 opacity-50 text-muted-foreground" />
              <p className="text-muted-foreground">No health records yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

            <div className="space-y-4">
              {healthTimeline.map((item) => (
                <div
                  key={`${item.type}-${item.id}`}
                  className="relative pl-10"
                  data-testid={`timeline-item-${item.type.toLowerCase()}-${item.id}`}
                >
                  <div
                    className={`absolute left-2.5 top-2 h-3 w-3 rounded-full border-2 border-background ${
                      item.type === "METRIC" ? "bg-blue-500" : "bg-amber-500"
                    }`}
                  />

                  <Card>
                    <CardContent className="pt-3 pb-3">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            {item.type === "METRIC" ? (
                              <Ruler className="h-4 w-4 text-blue-500" />
                            ) : (
                              <Stethoscope className="h-4 w-4 text-amber-500" />
                            )}

                            <span className="font-medium text-sm">{item.title}</span>

                            {item.type === "METRIC" && item.healthStatus && (
                              <Badge
                                className={getHealthStatusBadgeClass(item.healthStatus)}
                              >
                                {getHealthStatusLabel(item.healthStatus)}
                              </Badge>
                            )}

                            {item.type === "EVENT" && item.severity && (
                              <Badge className={getSeverityBadgeClass(item.severity)}>
                                {item.severity}
                              </Badge>
                            )}
                          </div>

                          <p className="text-xs text-muted-foreground">
                            {format(new Date(item.date), "MMM d, yyyy")} ·{" "}
                            {item.createdBy.name}
                          </p>

                          <p className="text-sm">{item.summary}</p>

                          {item.notes && (
                            <p className="text-xs text-muted-foreground italic">
                              {item.notes}
                            </p>
                          )}

                          {item.document && (
                            <div className="flex items-center gap-1 mt-1">
                              <Paperclip className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">
                                {item.document.title}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
