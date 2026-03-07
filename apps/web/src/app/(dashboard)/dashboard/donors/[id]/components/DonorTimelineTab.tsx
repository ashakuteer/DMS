"use client";

import {
  CalendarClock,
  Cake,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  Filter,
  Gift,
  Handshake,
  History,
  IndianRupee,
  Mail,
  MessageSquare,
  X,
} from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { TimelineItem } from "../types";
import { formatDate } from "../utils";

interface DonorTimelineTabProps {
  timelineStartDate: string;
  timelineEndDate: string;
  timelineTypeFilter: string[];
  timelineTypeCounts: Record<string, number>;
  timelineItems: TimelineItem[];
  timelineLoading: boolean;
  timelinePage: number;
  timelineTotal: number;
  timelineTotalPages: number;
  setTimelineStartDate: (value: string) => void;
  setTimelineEndDate: (value: string) => void;
  setTimelineTypeFilter: (value: string[]) => void;
  fetchTimeline: (
    page?: number,
    types?: string[],
    startDate?: string,
    endDate?: string,
  ) => void;
}

export default function DonorTimelineTab({
  timelineStartDate,
  timelineEndDate,
  timelineTypeFilter,
  timelineTypeCounts,
  timelineItems,
  timelineLoading,
  timelinePage,
  timelineTotal,
  timelineTotalPages,
  setTimelineStartDate,
  setTimelineEndDate,
  setTimelineTypeFilter,
  fetchTimeline,
}: DonorTimelineTabProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-primary" />
          <CardTitle>Engagement Timeline</CardTitle>
        </div>
        <CardDescription>
          Complete history of all interactions with this donor
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Input
              type="date"
              value={timelineStartDate}
              onChange={(e) => setTimelineStartDate(e.target.value)}
              className="w-[140px]"
              data-testid="input-timeline-start-date"
            />
            <span className="text-sm text-muted-foreground">to</span>
            <Input
              type="date"
              value={timelineEndDate}
              onChange={(e) => setTimelineEndDate(e.target.value)}
              className="w-[140px]"
              data-testid="input-timeline-end-date"
            />
            {(timelineStartDate || timelineEndDate) && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setTimelineStartDate("");
                  setTimelineEndDate("");
                  fetchTimeline(1, timelineTypeFilter, "", "");
                }}
                data-testid="button-clear-dates"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          <Button
            variant="outline"
            onClick={() =>
              fetchTimeline(
                1,
                timelineTypeFilter,
                timelineStartDate,
                timelineEndDate,
              )
            }
            data-testid="button-apply-timeline-filter"
          >
            <Filter className="h-4 w-4 mr-1" />
            Apply
          </Button>
        </div>

        <div className="flex flex-wrap gap-2" data-testid="timeline-type-filters">
          {[
            {
              key: "DONATION",
              label: "Donations",
              icon: IndianRupee,
              color:
                "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300",
            },
            {
              key: "VISIT",
              label: "Visits",
              icon: Eye,
              color:
                "bg-teal-100 dark:bg-teal-900 text-teal-700 dark:text-teal-300",
            },
            {
              key: "COMMUNICATION",
              label: "Messages",
              icon: MessageSquare,
              color:
                "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300",
            },
            {
              key: "BIRTHDAY_WISH",
              label: "Wishes",
              icon: Cake,
              color:
                "bg-pink-100 dark:bg-pink-900 text-pink-700 dark:text-pink-300",
            },
            {
              key: "PLEDGE",
              label: "Pledges",
              icon: Gift,
              color:
                "bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300",
            },
            {
              key: "FOLLOW_UP",
              label: "Follow-ups",
              icon: CalendarClock,
              color:
                "bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300",
            },
            {
              key: "SPONSORSHIP",
              label: "Sponsorships",
              icon: Handshake,
              color:
                "bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300",
            },
          ].map(({ key, label, icon: Icon, color }) => {
            const isActive = timelineTypeFilter.includes(key);
            const count = timelineTypeCounts[key] || 0;

            return (
              <Badge
                key={key}
                variant={isActive ? "default" : "outline"}
                className={`cursor-pointer ${!isActive ? color : ""}`}
                onClick={() => {
                  const newFilter = isActive
                    ? timelineTypeFilter.filter((t) => t !== key)
                    : [...timelineTypeFilter, key];
                  setTimelineTypeFilter(newFilter);
                  fetchTimeline(
                    1,
                    newFilter,
                    timelineStartDate,
                    timelineEndDate,
                  );
                }}
                data-testid={`badge-filter-${key.toLowerCase()}`}
              >
                <Icon className="h-3 w-3 mr-1" />
                {label}
                {count > 0 && <span className="ml-1 opacity-70">({count})</span>}
              </Badge>
            );
          })}

          {timelineTypeFilter.length > 0 && (
            <Badge
              variant="outline"
              className="cursor-pointer text-destructive"
              onClick={() => {
                setTimelineTypeFilter([]);
                fetchTimeline(1, [], timelineStartDate, timelineEndDate);
              }}
              data-testid="badge-clear-filters"
            >
              <X className="h-3 w-3 mr-1" />
              Clear
            </Badge>
          )}
        </div>

        {timelineLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : timelineItems.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">No activities found</p>
            <p className="text-sm mt-1">
              {timelineTypeFilter.length > 0 || timelineStartDate || timelineEndDate
                ? "Try adjusting your filters"
                : "No interactions have been recorded yet"}
            </p>
          </div>
        ) : (
          <>
            <div className="text-sm text-muted-foreground">
              Showing {timelineItems.length} of {timelineTotal} activities
            </div>

            <div className="relative">
              <div className="absolute left-[19px] top-0 bottom-0 w-px bg-border" />
              <div className="space-y-1">
                {timelineItems.map((item) => {
                  const config = {
                    DONATION: {
                      icon: IndianRupee,
                      bg: "bg-green-100 dark:bg-green-900",
                      text: "text-green-600 dark:text-green-400",
                    },
                    VISIT: {
                      icon: Eye,
                      bg: "bg-teal-100 dark:bg-teal-900",
                      text: "text-teal-600 dark:text-teal-400",
                    },
                    COMMUNICATION: {
                      icon: MessageSquare,
                      bg: "bg-blue-100 dark:bg-blue-900",
                      text: "text-blue-600 dark:text-blue-400",
                    },
                    BIRTHDAY_WISH: {
                      icon: Cake,
                      bg: "bg-pink-100 dark:bg-pink-900",
                      text: "text-pink-600 dark:text-pink-400",
                    },
                    PLEDGE: {
                      icon: Gift,
                      bg: "bg-amber-100 dark:bg-amber-900",
                      text: "text-amber-600 dark:text-amber-400",
                    },
                    FOLLOW_UP: {
                      icon: CalendarClock,
                      bg: "bg-purple-100 dark:bg-purple-900",
                      text: "text-purple-600 dark:text-purple-400",
                    },
                    SPONSORSHIP: {
                      icon: Handshake,
                      bg: "bg-indigo-100 dark:bg-indigo-900",
                      text: "text-indigo-600 dark:text-indigo-400",
                    },
                  }[item.type] || {
                    icon: Clock,
                    bg: "bg-muted",
                    text: "text-muted-foreground",
                  };

                  const IconComp = config.icon;

                  return (
                    <div
                      key={item.id}
                      className="relative flex items-start gap-4 py-3 pl-0"
                      data-testid={`timeline-item-${item.id}`}
                    >
                      <div className={`relative z-10 p-2 rounded-full ${config.bg} shrink-0`}>
                        <IconComp className={`h-4 w-4 ${config.text}`} />
                      </div>

                      <div className="flex-1 min-w-0 pt-0.5">
                        <div className="flex items-start justify-between gap-2 flex-wrap">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm">{item.title}</p>
                            <p className="text-sm text-muted-foreground mt-0.5 break-words">
                              {item.description}
                            </p>

                            {item.metadata?.channel && (
                              <Badge variant="secondary" className="mt-1 text-xs">
                                {item.metadata.channel === "WHATSAPP" ? (
                                  <>
                                    <SiWhatsapp className="h-3 w-3 mr-1" />
                                    {item.metadata.channel}
                                  </>
                                ) : item.metadata.channel === "EMAIL" ? (
                                  <>
                                    <Mail className="h-3 w-3 mr-1" />
                                    {item.metadata.channel}
                                  </>
                                ) : (
                                  item.metadata.channel
                                )}
                              </Badge>
                            )}

                            {item.metadata?.assignedTo && (
                              <span className="text-xs text-muted-foreground ml-2">
                                Assigned to {item.metadata.assignedTo}
                              </span>
                            )}

                            {item.metadata?.beneficiaryName && (
                              <span className="text-xs text-muted-foreground ml-2">
                                for {item.metadata.beneficiaryName}
                              </span>
                            )}

                            {item.metadata?.completedNote && (
                              <p className="text-xs text-muted-foreground mt-1 italic">
                                Completion: {item.metadata.completedNote}
                              </p>
                            )}
                          </div>

                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {formatDate(item.date)}
                            </span>

                            {item.status && (
                              <Badge
                                variant={
                                  item.status === "SENT" ||
                                  item.status === "ACTIVE" ||
                                  item.status === "RECEIPTED" ||
                                  item.status === "COMPLETED" ||
                                  item.status === "FULFILLED"
                                    ? "default"
                                    : item.status === "FAILED" ||
                                        item.status === "CANCELLED" ||
                                        item.status === "INACTIVE"
                                      ? "destructive"
                                      : "secondary"
                                }
                                className="text-xs"
                              >
                                {item.status}
                              </Badge>
                            )}

                            {item.amount != null && item.amount > 0 && (
                              <span className="text-sm font-medium">
                                {item.currency || "INR"} {item.amount.toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {timelineTotalPages > 1 && (
              <div className="flex items-center justify-between pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={timelinePage <= 1}
                  onClick={() =>
                    fetchTimeline(
                      timelinePage - 1,
                      timelineTypeFilter,
                      timelineStartDate,
                      timelineEndDate,
                    )
                  }
                  data-testid="button-timeline-prev"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>

                <span className="text-sm text-muted-foreground">
                  Page {timelinePage} of {timelineTotalPages}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={timelinePage >= timelineTotalPages}
                  onClick={() =>
                    fetchTimeline(
                      timelinePage + 1,
                      timelineTypeFilter,
                      timelineStartDate,
                      timelineEndDate,
                    )
                  }
                  data-testid="button-timeline-next"
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
