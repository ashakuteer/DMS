"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import {
  CalendarClock,
  Check,
  Edit,
  Gift,
  Loader2,
  Mail,
  Plus,
  Receipt,
  Copy,
  Trash2,
  X,
} from "lucide-react";
import type { Pledge, PledgeFormData } from "../types";
import { formatCurrency, formatDate, getPledgeStatusColor, getPledgeTypeLabel } from "../utils";
import PledgeDialog from "../dialogs/PledgeDialog";

interface DonorPledgesTabProps {
  pledges: Pledge[];
  pledgesLoading: boolean;
  canEdit: boolean;
  pledgeActionLoading: string | null;
  onAdd: () => void;
  onEdit: (pledge: Pledge) => void;
  onFulfill: (pledgeId: string) => void;
  onPostpone: (pledgeId: string, newDate: string, notes?: string) => void;
  onCancel: (pledgeId: string, reason: string) => void;
  onWhatsApp: (pledgeId: string) => void;
  onEmail: (pledgeId: string) => void;
  onDeletePledge: (pledgeId: string) => void;
  deletingPledgeId: string | null;
  showPledgeDialog: boolean;
  setShowPledgeDialog: (open: boolean) => void;
  editingPledge: boolean;
  pledgeForm: PledgeFormData;
  setPledgeForm: (form: PledgeFormData) => void;
  savingPledge: boolean;
  handlePledgeSubmit: (e: React.FormEvent) => void;
}

export default function DonorPledgesTab({
  pledges,
  pledgesLoading,
  canEdit,
  pledgeActionLoading,
  onAdd,
  onEdit,
  onFulfill,
  onPostpone,
  onCancel,
  onWhatsApp,
  onEmail,
  onDeletePledge,
  deletingPledgeId,
  showPledgeDialog,
  setShowPledgeDialog,
  editingPledge,
  pledgeForm,
  setPledgeForm,
  savingPledge,
  handlePledgeSubmit,
}: DonorPledgesTabProps) {
  const { t } = useTranslation();

  // Postpone dialog state
  const [postponeDialog, setPostponeDialog] = useState<{ pledgeId: string; newDate: string; notes: string } | null>(null);
  // Cancel dialog state
  const [cancelDialog, setCancelDialog] = useState<{ pledgeId: string; reason: string } | null>(null);

  const handlePostponeConfirm = () => {
    if (!postponeDialog || !postponeDialog.newDate) return;
    onPostpone(postponeDialog.pledgeId, postponeDialog.newDate, postponeDialog.notes || undefined);
    setPostponeDialog(null);
  };

  const handleCancelConfirm = () => {
    if (!cancelDialog || !cancelDialog.reason.trim()) return;
    onCancel(cancelDialog.pledgeId, cancelDialog.reason.trim());
    setCancelDialog(null);
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
          <div>
            <CardTitle>{t("donor_profile.tab_pledges")}</CardTitle>
            <CardDescription>
              {t("donor_profile.pledges_description")}
            </CardDescription>
          </div>

          {canEdit && (
            <Button onClick={onAdd} data-testid="button-add-pledge">
              <Plus className="h-4 w-4 mr-2" />
              {t("donor_profile.add_pledge")}
            </Button>
          )}
        </CardHeader>

        <CardContent>
          {pledgesLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : pledges.length > 0 ? (
            <div className="space-y-3">
              {pledges.map((pledge) => (
                <div
                  key={pledge.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-3"
                  data-testid={`pledge-item-${pledge.id}`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium">
                        {pledge.pledgeType === "MONEY" && pledge.amount
                          ? formatCurrency(pledge.amount.toString(), pledge.currency)
                          : pledge.quantity || getPledgeTypeLabel(pledge.pledgeType)}
                      </p>

                      <Badge
                        variant={
                          getPledgeStatusColor(pledge.status) as
                            | "default"
                            | "secondary"
                            | "destructive"
                            | "outline"
                        }
                      >
                        {pledge.status}
                      </Badge>
                    </div>

                    <p className="text-sm text-muted-foreground">
                      {pledge.pledgeTypeLabel || getPledgeTypeLabel(pledge.pledgeType)}
                      {pledge.notes && ` - ${pledge.notes}`}
                    </p>

                    <p className="text-xs text-muted-foreground mt-1">
                      {t("donor_profile.expected")}: {formatDate(pledge.expectedFulfillmentDate)}
                      {pledge.createdBy && ` | ${t("donor_profile.added_by")} ${pledge.createdBy.name}`}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {(pledge.status === "PENDING" || pledge.status === "POSTPONED") &&
                      canEdit && (
                        <>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => onFulfill(pledge.id)}
                            disabled={!!pledgeActionLoading}
                            data-testid={`button-fulfill-pledge-${pledge.id}`}
                          >
                            {pledgeActionLoading === pledge.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Check className="h-4 w-4 mr-1" />
                            )}
                            {t("donor_profile.fulfill")}
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPostponeDialog({ pledgeId: pledge.id, newDate: "", notes: "" })}
                            disabled={!!pledgeActionLoading}
                            data-testid={`button-postpone-pledge-${pledge.id}`}
                          >
                            <CalendarClock className="h-4 w-4 mr-1" />
                            {t("donor_profile.postpone")}
                          </Button>

                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setCancelDialog({ pledgeId: pledge.id, reason: "" })}
                            disabled={!!pledgeActionLoading}
                            data-testid={`button-cancel-pledge-${pledge.id}`}
                          >
                            {t("common.cancel")}
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onWhatsApp(pledge.id)}
                            data-testid={`button-pledge-whatsapp-${pledge.id}`}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onEmail(pledge.id)}
                            disabled={pledgeActionLoading === `email-${pledge.id}`}
                            data-testid={`button-pledge-email-${pledge.id}`}
                          >
                            {pledgeActionLoading === `email-${pledge.id}` ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Mail className="h-4 w-4" />
                            )}
                          </Button>
                        </>
                      )}

                    {pledge.status === "FULFILLED" && pledge.fulfilledDonation && (
                      <Badge variant="outline" className="text-green-600">
                        <Receipt className="h-3 w-3 mr-1" />
                        {pledge.fulfilledDonation.receiptNumber}
                      </Badge>
                    )}

                    {canEdit &&
                      (pledge.status === "PENDING" || pledge.status === "POSTPONED") && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEdit(pledge)}
                          data-testid={`button-edit-pledge-${pledge.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                    {canEdit && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDeletePledge(pledge.id)}
                        disabled={deletingPledgeId === pledge.id}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        data-testid={`button-delete-pledge-${pledge.id}`}
                      >
                        {deletingPledgeId === pledge.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Gift className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>{t("donor_profile.no_pledges")}</p>

              {canEdit && (
                <Button variant="outline" className="mt-4" onClick={onAdd}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t("donor_profile.add_first_pledge")}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <PledgeDialog
        open={showPledgeDialog}
        onOpenChange={setShowPledgeDialog}
        editingPledge={editingPledge}
        pledgeForm={pledgeForm}
        setPledgeForm={setPledgeForm}
        savingPledge={savingPledge}
        onSubmit={handlePledgeSubmit}
      />

      {/* Postpone Dialog */}
      {postponeDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-background rounded-lg shadow-lg p-6 w-full max-w-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold">Postpone Pledge</h3>
              <button onClick={() => setPostponeDialog(null)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium mb-1 block">New Expected Date <span className="text-destructive">*</span></label>
                <input
                  type="date"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  value={postponeDialog.newDate}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setPostponeDialog({ ...postponeDialog, newDate: e.target.value })}
                  data-testid="input-postpone-date"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Notes (optional)</label>
                <textarea
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                  rows={2}
                  value={postponeDialog.notes}
                  onChange={(e) => setPostponeDialog({ ...postponeDialog, notes: e.target.value })}
                  placeholder="Reason for postponing..."
                  data-testid="input-postpone-notes"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setPostponeDialog(null)}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handlePostponeConfirm}
                disabled={!postponeDialog.newDate || !!pledgeActionLoading}
                data-testid="button-postpone-confirm"
              >
                {pledgeActionLoading === postponeDialog.pledgeId ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <CalendarClock className="h-4 w-4 mr-1" />
                )}
                Postpone
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Dialog */}
      {cancelDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-background rounded-lg shadow-lg p-6 w-full max-w-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold">Cancel Pledge</h3>
              <button onClick={() => setCancelDialog(null)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Reason for cancellation <span className="text-destructive">*</span></label>
              <textarea
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                rows={3}
                value={cancelDialog.reason}
                onChange={(e) => setCancelDialog({ ...cancelDialog, reason: e.target.value })}
                placeholder="Please provide a reason..."
                data-testid="input-cancel-reason"
                autoFocus
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setCancelDialog(null)}>
                Go Back
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleCancelConfirm}
                disabled={!cancelDialog.reason.trim() || !!pledgeActionLoading}
                data-testid="button-cancel-confirm"
              >
                {pledgeActionLoading === cancelDialog.pledgeId ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : null}
                Confirm Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
