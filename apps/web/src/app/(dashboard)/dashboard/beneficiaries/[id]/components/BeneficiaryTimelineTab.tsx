"use client";

import { format } from "date-fns";
import { Clock } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import type { TimelineEvent } from "../types";

interface BeneficiaryTimelineTabProps {
  timelineEvents: TimelineEvent[];
  loading: boolean;
}

export default function BeneficiaryTimelineTab({
  timelineEvents,
  loading,
}: BeneficiaryTimelineTabProps) {
  if (loading) {
    return (
      <div className="flex justify-center py-10 text-muted-foreground">
        Loading timeline...
      </div>
    );
  }

  if (!timelineEvents || timelineEvents.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-10 text-muted-foreground">
          <Clock className="h-6 w-6 mb-2 opacity-50" />
          No timeline events recorded
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {timelineEvents.map((event) => (
        <Card key={event.id}>
          <CardContent className="pt-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="text-xs">
                    {event.eventType}
                  </Badge>

                  <span className="text-xs text-muted-foreground">
                    {format(new Date(event.eventDate), "dd MMM yyyy")}
                  </span>
                </div>

                <p className="mt-2 text-sm">{event.description}</p>
              </div>

              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {format(new Date(event.createdAt), "dd MMM yyyy")}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
