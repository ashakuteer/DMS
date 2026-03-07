"use client";

import { format } from "date-fns";
import { Book, Clock, Download, GraduationCap, Loader2, Plus, Send } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import type { EducationTimelineItem, ProgressCard } from "../types";
import { getTermLabel } from "../utils";

interface BeneficiaryAcademicsTabProps {
  progressCards: ProgressCard[];
  progressCardsLoading: boolean;
  educationTimeline: EducationTimelineItem[];
  educationTimelineLoading: boolean;
  educationExporting: boolean;
  hasSponsors: boolean;
  onExportEducationPdf: () => void;
  onOpenAddProgressCard: () => void;
  onShareProgressCard: (card: ProgressCard) => void;
}

export default function BeneficiaryAcademicsTab({
  progressCards,
  progressCardsLoading,
  educationTimeline,
  educationTimelineLoading,
  educationExporting,
  hasSponsors,
  onExportEducationPdf,
  onOpenAddProgressCard,
  onShareProgressCard,
}: BeneficiaryAcademicsTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <GraduationCap className="h-5 w-5" />
          Progress Cards
        </h3>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            onClick={onExportEducationPdf}
            disabled={educationExporting}
            data-testid="button-export-education-pdf"
          >
            {educationExporting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Export PDF
          </Button>

          <Button onClick={onOpenAddProgressCard} data-testid="button-add-progress-card">
            <Plus className="h-4 w-4 mr-2" />
            Add Progress Card
          </Button>
        </div>
      </div>

      {progressCardsLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : progressCards.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-40">
            <GraduationCap className="h-8 w-8 mb-2 opacity-50 text-muted-foreground" />
            <p className="text-muted-foreground">No progress cards yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {progressCards.map((card) => (
            <Card key={card.id} data-testid={`card-progress-${card.id}`}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg">{card.academicYear}</CardTitle>
                  <Badge variant="outline">{getTermLabel(card.term)}</Badge>
                </div>

                <CardDescription>
                  {card.classGrade}
                  {card.school ? ` - ${card.school}` : ""}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-2">
                {card.overallPercentage != null && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Overall:</span>
                    <span className="font-semibold text-lg">{card.overallPercentage}%</span>
                  </div>
                )}

                {card.remarks && (
                  <p className="text-sm text-muted-foreground">{card.remarks}</p>
                )}

                {card.fileDocument && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(card.fileDocument!.storagePath, "_blank")}
                    data-testid={`button-download-report-${card.id}`}
                  >
                    <Download className="h-3 w-3 mr-1" />
                    View Report Card
                  </Button>
                )}

                <p className="text-xs text-muted-foreground">
                  Added by {card.createdBy?.name || "Unknown"} on{" "}
                  {format(new Date(card.createdAt), "MMM d, yyyy")}
                </p>

                {hasSponsors && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onShareProgressCard(card)}
                    data-testid={`button-share-progress-${card.id}`}
                  >
                    <Send className="h-3 w-3 mr-1" />
                    Share with Sponsors
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Education Timeline
        </h3>

        {educationTimelineLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : educationTimeline.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center h-40">
              <Book className="h-8 w-8 mb-2 opacity-50 text-muted-foreground" />
              <p className="text-muted-foreground">No education timeline events yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="relative space-y-0">
            <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />

            {educationTimeline.map((item) => (
              <div
                key={item.id}
                className="relative pl-10 pb-6"
                data-testid={`education-timeline-${item.id}`}
              >
                <div
                  className={`absolute left-2.5 top-1 w-3 h-3 rounded-full border-2 ${
                    item.type === "PROGRESS_CARD"
                      ? "bg-primary border-primary"
                      : "bg-muted border-muted-foreground"
                  }`}
                />

                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium">{item.title}</span>

                    <Badge
                      variant={item.type === "PROGRESS_CARD" ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {item.type === "PROGRESS_CARD" ? "Report Card" : "Event"}
                    </Badge>

                    {item.overallPercentage != null && (
                      <Badge variant="outline" className="text-xs">
                        {item.overallPercentage}%
                      </Badge>
                    )}
                  </div>

                  <p className="text-sm text-muted-foreground">{item.summary}</p>

                  {item.classGrade && (
                    <p className="text-xs text-muted-foreground">
                      {item.classGrade}
                      {item.school ? ` - ${item.school}` : ""}
                    </p>
                  )}

                  {item.fileDocument && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(item.fileDocument!.storagePath, "_blank")}
                    >
                      <Download className="h-3 w-3 mr-1" />
                      View Document
                    </Button>
                  )}

                  <p className="text-xs text-muted-foreground">
                    {format(new Date(item.date), "MMM d, yyyy")} by{" "}
                    {item.createdBy?.name || "Unknown"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
