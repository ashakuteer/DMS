"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  onPostpone: (pledgeId: string) => void;
  onCancel: (pledgeId: string) => void;
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
  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
          <div>
            <CardTitle>Pledges</CardTitle>
            <CardDescription>
              Promised donations from this donor
            </CardDescription>
          </div>

          {canEdit && (
            <Button onClick={onAdd} data-testid="button-add-pledge">
              <Plus className="h-4 w-4 mr-2" />
              Add Pledge
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
                      Expected: {formatDate(pledge.expectedFulfillmentDate)}
                      {pledge.createdBy && ` | Added by ${pledge.createdBy.name}`}
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
                            Fulfill
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onPostpone(pledge.id)}
                            disabled={!!pledgeActionLoading}
                            data-testid={`button-postpone-pledge-${pledge.id}`}
                          >
                            <CalendarClock className="h-4 w-4 mr-1" />
                            Postpone
                          </Button>

                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => onCancel(pledge.id)}
                            disabled={!!pledgeActionLoading}
                            data-testid={`button-cancel-pledge-${pledge.id}`}
                          >
                            Cancel
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
              <p>No pledges recorded</p>

              {canEdit && (
                <Button variant="outline" className="mt-4" onClick={onAdd}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Pledge
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
    </>
  );
}
