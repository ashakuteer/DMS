"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft,
  Calendar,
  User,
  Edit,
  Receipt,
  CreditCard,
  Package,
  Home,
  Loader2,
  ExternalLink
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { fetchWithAuth, authStorage } from "@/lib/auth";
import { canAccessModule } from "@/lib/permissions";
import { AccessDenied } from "@/components/access-denied";
import { format } from "date-fns";

interface Donor {
  id: string;
  donorCode: string;
  firstName: string;
  lastName?: string;
  primaryPhone?: string;
  personalEmail?: string;
  officialEmail?: string;
  whatsappPhone?: string;
  city?: string;
  state?: string;
}

interface DonationDetails {
  id: string;
  donorId: string;
  donationDate: string;
  donationAmount: string;
  currency: string;
  donationType: string;
  donationMode: string | null;
  transactionId?: string;
  remarks?: string;
  quantity?: string;
  unit?: string;
  itemDescription?: string;
  donationHomeType?: string;
  receiptNumber?: string;
  financialYear?: string;
  visitedHome: boolean;
  servedFood: boolean;
  donor: Donor;
  createdBy?: { id: string; name: string };
  home?: { id: string; fullName: string };
  campaign?: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
}

const DONATION_TYPES = [
  { value: "CASH", label: "Cash" },
  { value: "ANNADANAM", label: "Annadanam (Prepared Meals)" },
  { value: "GROCERIES", label: "Groceries" },
  { value: "MEDICINES", label: "Medicines" },
  { value: "RICE_BAGS", label: "Rice Bags" },
  { value: "STATIONERY", label: "Stationery" },
  { value: "SPORTS_KITS", label: "Sports Kits" },
  { value: "USED_ITEMS", label: "Used Items" },
  { value: "OTHER", label: "Other" },
];

const DONATION_MODES = [
  { value: "CASH", label: "Cash" },
  { value: "UPI", label: "UPI" },
  { value: "GPAY", label: "GPay" },
  { value: "PHONEPE", label: "PhonePe" },
  { value: "CHEQUE", label: "Cheque" },
  { value: "ONLINE", label: "Online" },
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
];

const DONATION_HOME_TYPES = [
  { value: "GIRLS_HOME", label: "Girls Home" },
  { value: "BLIND_BOYS_HOME", label: "Blind Boys Home" },
  { value: "OLD_AGE_HOME", label: "Old Age Home" },
  { value: "GENERAL", label: "General" },
];

export default function DonationDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const donationId = params.id as string;

  const [donation, setDonation] = useState<DonationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>("");
  
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editForm, setEditForm] = useState({
    donationAmount: "",
    donationType: "CASH",
    donationMode: "CASH",
    quantity: "",
    unit: "",
    itemDescription: "",
    donationHomeType: "",
    remarks: "",
    kindCategory: "",
    kindDescription: "",
  });

  useEffect(() => {
    const user = authStorage.getUser();
    if (user?.role) {
      setUserRole(user.role);
    }
  }, []);

  const fetchDonation = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetchWithAuth(`/api/donations/${donationId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch donation details");
      }
      const data = await response.json();
      setDonation(data);
    } catch (error) {
      console.error("Failed to fetch donation:", error);
      toast({
        title: "Error",
        description: "Failed to load donation details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [donationId, toast]);

  useEffect(() => {
    fetchDonation();
  }, [fetchDonation]);

  const isInKindDonation = (type: string) => type !== "CASH";

  const openEditDialog = () => {
    if (!donation) return;
    setEditForm({
      donationAmount: donation.donationAmount || "",
      donationType: donation.donationType || "CASH",
      donationMode: donation.donationMode || "CASH",
      quantity: donation.quantity || "",
      unit: donation.unit || "",
      itemDescription: donation.itemDescription || "",
      donationHomeType: donation.donationHomeType || "",
      remarks: donation.remarks || "",
      kindCategory: donation.kindCategory || "",
      kindDescription: donation.kindDescription || "",
    });
    setShowEditDialog(true);
  };

  const handleEditSubmit = async () => {
    setEditLoading(true);
    try {
      const payload: Record<string, any> = {
        remarks: editForm.remarks || null,
        donationType: editForm.donationType,
        donationHomeType: editForm.donationHomeType || null,
      };

      if (editForm.donationType === "CASH") {
        payload.donationAmount = parseFloat(editForm.donationAmount);
        payload.donationMode = editForm.donationMode || "CASH";
        payload.quantity = null;
        payload.unit = null;
        payload.itemDescription = null;
      } else {
        payload.quantity = editForm.quantity ? parseFloat(editForm.quantity) : null;
        payload.unit = editForm.unit || null;
        payload.itemDescription = editForm.itemDescription || null;
        payload.donationMode = editForm.donationMode || null;
        payload.donationAmount = parseFloat(editForm.donationAmount) || 0;
        payload.kindCategory = editForm.kindCategory || null;
        payload.kindDescription = editForm.kindDescription || null;
      }

      const response = await fetchWithAuth(`/api/donations/${donationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update donation");
      }

      toast({
        title: "Success",
        description: "Donation updated successfully",
      });
      setShowEditDialog(false);
      fetchDonation();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update donation",
        variant: "destructive",
      });
    } finally {
      setEditLoading(false);
    }
  };

  const formatAmount = (amount: string, currency: string = "INR") => {
    const num = parseFloat(amount);
    if (isNaN(num)) return "-";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(num);
  };

  const getDonorName = (donor: Donor) => {
    return [donor.firstName, donor.lastName].filter(Boolean).join(" ");
  };

  const getDonationTypeBadgeColor = (type: string) => {
    switch (type) {
      case "CASH": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100";
      case "GROCERIES": return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100";
      case "MEDICINES": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100";
      case "ANNADANAM": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100";
      case "RICE_BAGS": return "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100";
      case "STATIONERY": return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100";
      case "SPORTS_KITS": return "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-100";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100";
    }
  };

  const getTypeLabel = (value: string) => {
    return DONATION_TYPES.find(t => t.value === value)?.label || value.replace(/_/g, " ");
  };

  const getModeLabel = (value: string | null) => {
    if (!value) return "-";
    return DONATION_MODES.find(m => m.value === value)?.label || value.replace(/_/g, " ");
  };

  const getHomeTypeLabel = (value: string | undefined) => {
    if (!value) return "-";
    return DONATION_HOME_TYPES.find(h => h.value === value)?.label || value.replace(/_/g, " ");
  };

  const user = authStorage.getUser();
  if (user && !canAccessModule(user?.role, 'donations')) return <AccessDenied />;

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!donation) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-muted-foreground">Donation not found</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => router.push("/dashboard/donations")}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Donations
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isInKind = isInKindDonation(donation.donationType);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => router.push("/dashboard/donations")}
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Donation Details</h1>
            <p className="text-muted-foreground">
              Receipt: {donation.receiptNumber || "N/A"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {userRole === "ADMIN" && (
            <Button onClick={openEditDialog} data-testid="button-edit-donation">
              <Edit className="h-4 w-4 mr-2" />
              Edit Donation
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Donation Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground text-sm">Date</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">
                    {format(new Date(donation.donationDate), "dd MMMM yyyy")}
                  </span>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground text-sm">Receipt Number</Label>
                <div className="mt-1">
                  <Badge variant="outline" className="font-mono">
                    {donation.receiptNumber || "-"}
                  </Badge>
                </div>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground text-sm">Type</Label>
                <div className="mt-1">
                  <Badge className={getDonationTypeBadgeColor(donation.donationType)}>
                    {getTypeLabel(donation.donationType)}
                  </Badge>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground text-sm">Mode</Label>
                <div className="flex items-center gap-2 mt-1">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <span>{getModeLabel(donation.donationMode)}</span>
                </div>
              </div>
            </div>

            <Separator />

            {isInKind ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground text-sm">Quantity</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-lg">
                        {donation.quantity || "-"} {donation.unit || ""}
                      </span>
                    </div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-sm">Estimated Value</Label>
                    <div className="mt-1">
                      <span className="font-medium">
                        {formatAmount(donation.donationAmount, donation.currency)}
                      </span>
                    </div>
                  </div>
                </div>
                {donation.itemDescription && (
                  <div>
                    <Label className="text-muted-foreground text-sm">Description</Label>
                    <p className="mt-1">{donation.itemDescription}</p>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <Label className="text-muted-foreground text-sm">Amount</Label>
                <div className="mt-1">
                  <span className="font-bold text-2xl text-primary">
                    {formatAmount(donation.donationAmount, donation.currency)}
                  </span>
                </div>
              </div>
            )}

            {donation.donationHomeType && (
              <>
                <Separator />
                <div>
                  <Label className="text-muted-foreground text-sm">Designated Home</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Home className="h-4 w-4 text-muted-foreground" />
                    <span>{getHomeTypeLabel(donation.donationHomeType)}</span>
                  </div>
                </div>
              </>
            )}

            {donation.transactionId && (
              <>
                <Separator />
                <div>
                  <Label className="text-muted-foreground text-sm">Transaction ID</Label>
                  <p className="mt-1 font-mono text-sm">{donation.transactionId}</p>
                </div>
              </>
            )}

            {donation.remarks && (
              <>
                <Separator />
                <div>
                  <Label className="text-muted-foreground text-sm">Notes/Remarks</Label>
                  <p className="mt-1 text-muted-foreground">{donation.remarks}</p>
                </div>
              </>
            )}

            <Separator />

            <div className="text-xs text-muted-foreground space-y-1">
              <p>Financial Year: {donation.financialYear || "-"}</p>
              <p>Recorded by: {donation.createdBy?.name || "-"}</p>
              <p>Created: {format(new Date(donation.createdAt), "dd MMM yyyy, HH:mm")}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Donor Information
            </CardTitle>
            <CardDescription>
              Donor who made this contribution
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-lg">{getDonorName(donation.donor)}</p>
                <Badge variant="outline" className="font-mono mt-1">
                  {donation.donor.donorCode}
                </Badge>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/dashboard/donors/${donation.donorId}`)}
                data-testid="button-view-donor-profile"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View Profile
              </Button>
            </div>

            <Separator />

            <div className="space-y-3">
              {donation.donor.primaryPhone && (
                <div>
                  <Label className="text-muted-foreground text-sm">Phone</Label>
                  <p className="mt-1">{donation.donor.primaryPhone}</p>
                </div>
              )}
              {(donation.donor.personalEmail || donation.donor.officialEmail) && (
                <div>
                  <Label className="text-muted-foreground text-sm">Email</Label>
                  <p className="mt-1">{donation.donor.personalEmail || donation.donor.officialEmail}</p>
                </div>
              )}
              {(donation.donor.city || donation.donor.state) && (
                <div>
                  <Label className="text-muted-foreground text-sm">Location</Label>
                  <p className="mt-1">
                    {[donation.donor.city, donation.donor.state].filter(Boolean).join(", ")}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Donation</DialogTitle>
            <DialogDescription>
              Update donation details. Receipt number cannot be changed.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-donationType">Donation Type</Label>
              <Select
                value={editForm.donationType}
                onValueChange={(v) => setEditForm({ ...editForm, donationType: v })}
              >
                <SelectTrigger id="edit-donationType" data-testid="select-edit-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DONATION_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {editForm.donationType === "CASH" ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="edit-amount">Amount (INR)</Label>
                  <Input
                    id="edit-amount"
                    type="number"
                    step="0.01"
                    value={editForm.donationAmount}
                    onChange={(e) => setEditForm({ ...editForm, donationAmount: e.target.value })}
                    data-testid="input-edit-amount"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-mode">Payment Mode</Label>
                  <Select
                    value={editForm.donationMode}
                    onValueChange={(v) => setEditForm({ ...editForm, donationMode: v })}
                  >
                    <SelectTrigger id="edit-mode" data-testid="select-edit-mode">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DONATION_MODES.map((m) => (
                        <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-quantity">Quantity</Label>
                    <Input
                      id="edit-quantity"
                      type="number"
                      step="0.01"
                      value={editForm.quantity}
                      onChange={(e) => setEditForm({ ...editForm, quantity: e.target.value })}
                      placeholder="e.g., 25"
                      data-testid="input-edit-quantity"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-unit">Unit</Label>
                    <Input
                      id="edit-unit"
                      value={editForm.unit}
                      onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })}
                      placeholder="e.g., kg, bags, pieces"
                      data-testid="input-edit-unit"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    value={editForm.itemDescription}
                    onChange={(e) => setEditForm({ ...editForm, itemDescription: e.target.value })}
                    placeholder="Describe the donated items..."
                    data-testid="input-edit-description"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-kind-category">Kind Category</Label>
                  <Select
                    value={editForm.kindCategory || "none"}
                    onValueChange={(v) => setEditForm({ ...editForm, kindCategory: v === "none" ? "" : v })}
                  >
                    <SelectTrigger id="edit-kind-category" data-testid="select-edit-kind-category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="GROCERIES">Groceries</SelectItem>
                      <SelectItem value="MEDICINES">Medicines</SelectItem>
                      <SelectItem value="TOILETRIES">Toiletries</SelectItem>
                      <SelectItem value="STATIONERY">Stationery</SelectItem>
                      <SelectItem value="CLOTHES">Clothes</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-kind-description">Kind Description</Label>
                  <Input
                    id="edit-kind-description"
                    value={editForm.kindDescription}
                    onChange={(e) => setEditForm({ ...editForm, kindDescription: e.target.value })}
                    placeholder="Optional description"
                    data-testid="input-edit-kind-description"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-amount-inkind">Estimated Value (INR) - Optional</Label>
                  <Input
                    id="edit-amount-inkind"
                    type="number"
                    step="0.01"
                    value={editForm.donationAmount}
                    onChange={(e) => setEditForm({ ...editForm, donationAmount: e.target.value })}
                    data-testid="input-edit-amount-inkind"
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="edit-home">Designated Home (Optional)</Label>
              <Select
                value={editForm.donationHomeType || "none"}
                onValueChange={(v) => setEditForm({ ...editForm, donationHomeType: v === "none" ? "" : v })}
              >
                <SelectTrigger id="edit-home" data-testid="select-edit-home">
                  <SelectValue placeholder="Select home..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {DONATION_HOME_TYPES.map((h) => (
                    <SelectItem key={h.value} value={h.value}>{h.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-remarks">Notes/Remarks</Label>
              <Textarea
                id="edit-remarks"
                value={editForm.remarks}
                onChange={(e) => setEditForm({ ...editForm, remarks: e.target.value })}
                placeholder="Additional notes..."
                data-testid="input-edit-remarks"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditSubmit} disabled={editLoading} data-testid="button-save-edit">
              {editLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
