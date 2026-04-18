"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { fetchWithAuth } from "@/lib/auth";
import { apiClient } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Utensils, Plus, Calendar, Home, CheckCircle, Clock, Loader2 } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { format } from "date-fns";

interface MealEntry {
  id: string;
  mealServiceDate: string;
  homes: string[];
  breakfast: boolean;
  lunch: boolean;
  eveningSnacks: boolean;
  dinner: boolean;
  amount: string;
  totalAmount?: string | null;
  bookingStatus?: string;
  occasionType: string;
  occasionFor?: string;
  paymentStatus?: string;
  mealCompleted?: boolean | null;
  createdAt?: string;
}

interface Props {
  donorId: string;
  donorName: string;
}

const SLOT_LABELS: Record<string, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  eveningSnacks: "Evening Snacks",
  dinner: "Dinner",
};

const BOOKING_STATUS_COLOR: Record<string, string> = {
  CONFIRMED: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  HOLD: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

const HOME_DISPLAY: Record<string, string> = {
  GIRLS_HOME: "Girls Home",
  BLIND_BOYS_HOME: "Blind Boys Home",
  OLD_AGE_HOME: "Old Age Home",
};

export default function DonorMealSponsorshipsTab({ donorId, donorName }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [sendingId, setSendingId] = useState<string | null>(null);

  const handleResendWhatsApp = async (mealId: string) => {
    if (sendingId) return;
    setSendingId(mealId);
    try {
      const result = await apiClient<{ success: boolean; message?: string; status?: string }>(
        `/api/meals/${mealId}/resend-whatsapp`,
        { method: "POST" },
      );
      toast({
        title: result?.success ? "WhatsApp Sent" : "WhatsApp Send Failed",
        description: result?.message || (result?.success ? "Message has been sent." : "Could not send WhatsApp."),
        variant: result?.success ? "default" : "destructive",
      });
    } catch (err: any) {
      toast({
        title: "Failed to Send WhatsApp",
        description: err?.message || "An error occurred while sending the WhatsApp message.",
        variant: "destructive",
      });
    } finally {
      setSendingId(null);
    }
  };

  const { data, isLoading } = useQuery<{ items: MealEntry[]; total: number; totalPages: number }>({
    queryKey: ["/api/meals", { donorId, page }],
    queryFn: async () => {
      const params = new URLSearchParams({ donorId, page: String(page), limit: "20" });
      const res = await fetchWithAuth(`/api/meals?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch meals");
      return res.json();
    },
  });

  const meals = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const slots = (meal: MealEntry) =>
    (["breakfast", "lunch", "eveningSnacks", "dinner"] as const)
      .filter((s) => meal[s])
      .map((s) => SLOT_LABELS[s])
      .join(", ");

  const handleAddMeal = () => {
    router.push(`/dashboard/meals?prefillDonorId=${donorId}&prefillDonorName=${encodeURIComponent(donorName)}`);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div className="flex items-center gap-2">
          <Utensils className="h-5 w-5 text-muted-foreground" />
          <CardTitle>Meals Sponsorship</CardTitle>
          {!isLoading && (
            <Badge variant="secondary" className="ml-2" data-testid="meals-total-count">
              {total} record{total !== 1 ? "s" : ""}
            </Badge>
          )}
        </div>
        <Button size="sm" onClick={handleAddMeal} data-testid="button-add-meal-sponsorship">
          <Plus className="h-4 w-4 mr-1" />
          Add Meal Sponsorship
        </Button>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : meals.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Utensils className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">No meal sponsorships recorded for this donor.</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={handleAddMeal} data-testid="button-add-first-meal">
              Book First Meal Sponsorship
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {meals.map((meal) => (
                <div
                  key={meal.id}
                  className="flex items-start justify-between p-4 rounded-lg border bg-muted/30 hover:bg-muted/50 transition"
                  data-testid={`meal-card-${meal.id}`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-sm">
                        {format(new Date(meal.mealServiceDate), "dd MMM yyyy")}
                      </span>
                      {meal.bookingStatus && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${BOOKING_STATUS_COLOR[meal.bookingStatus] ?? ""}`}>
                          {meal.bookingStatus}
                        </span>
                      )}
                      {meal.mealCompleted && (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      )}
                    </div>

                    <div className="flex items-center gap-1 flex-wrap">
                      <Home className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {meal.homes.map((h) => HOME_DISPLAY[h] ?? h).join(", ")}
                      </span>
                    </div>

                    {slots(meal) && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        {slots(meal)}
                      </div>
                    )}

                    {meal.occasionType && meal.occasionType !== "GENERAL" && (
                      <p className="text-xs text-muted-foreground">
                        Occasion: {meal.occasionType}
                        {meal.occasionFor ? ` · ${meal.occasionFor}` : ""}
                      </p>
                    )}
                  </div>

                  <div className="flex items-start gap-2 shrink-0 ml-4">
                    <div className="text-right">
                      <p className="text-sm font-semibold">
                        ₹{Number(meal.totalAmount ?? meal.amount).toLocaleString("en-IN")}
                      </p>
                      {meal.paymentStatus && (
                        <p className="text-xs text-muted-foreground mt-0.5">{meal.paymentStatus}</p>
                      )}
                    </div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="text-green-600 border-green-600 hover:bg-green-50 dark:hover:bg-green-950"
                            onClick={() => handleResendWhatsApp(meal.id)}
                            disabled={sendingId === meal.id}
                            data-testid={`button-whatsapp-meal-${meal.id}`}
                          >
                            {sendingId === meal.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <SiWhatsapp className="h-4 w-4" />
                            )}
                          </Button>
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>Send / resend WhatsApp for this meal sponsorship</TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-6">
                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </span>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
