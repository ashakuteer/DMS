"use client";

import { Dispatch, SetStateAction } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, X, Camera, HandHeart, User } from "lucide-react";
import { HOME_TYPES, MONTHS } from "./helpers";

interface NewBeneficiaryState {
  fullName: string;
  homeType: string;
  gender: string;
  dobMonth: string;
  dobDay: string;
  dobYear: string;
  approxAge: string;
  joinDate: string;
  heightCmAtJoin: string;
  weightKgAtJoin: string;
  educationClassOrRole: string;
  schoolOrCollege: string;
  healthNotes: string;
  currentHealthStatus: string;
  background: string;
  protectPrivacy: boolean;
}

interface AddBeneficiaryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  photoPreview: string | null;
  setPhotoFile: (file: File | null) => void;
  setPhotoPreview: (url: string | null) => void;
  handlePhotoSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  newBeneficiary: NewBeneficiaryState;
  setNewBeneficiary: Dispatch<SetStateAction<NewBeneficiaryState>>;
  addLoading: boolean;
  handleAddBeneficiary: () => void;
}

export function AddBeneficiaryDialog({
  open,
  onOpenChange,
  photoPreview,
  setPhotoFile,
  setPhotoPreview,
  handlePhotoSelect,
  newBeneficiary,
  setNewBeneficiary,
  addLoading,
  handleAddBeneficiary,
}: AddBeneficiaryDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) { setPhotoFile(null); setPhotoPreview(null); } }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HandHeart className="h-5 w-5" />
            Add Beneficiary
          </DialogTitle>
          <DialogDescription>
            Add a new beneficiary to track and support
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative group flex-shrink-0">
                <Avatar className="h-20 w-20">
                  {photoPreview ? (
                    <AvatarImage src={photoPreview} alt="Preview" />
                  ) : (
                    <AvatarFallback className="text-lg">
                      {newBeneficiary.fullName ? newBeneficiary.fullName.charAt(0).toUpperCase() : <User className="h-8 w-8" />}
                    </AvatarFallback>
                  )}
                </Avatar>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  id="add-photo-upload"
                  onChange={handlePhotoSelect}
                  data-testid="input-add-photo-upload"
                />
                <label
                  htmlFor="add-photo-upload"
                  className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  data-testid="button-add-photo-upload"
                >
                  <Camera className="h-5 w-5 text-white" />
                </label>
                {photoPreview && (
                  <button
                    onClick={() => { setPhotoFile(null); setPhotoPreview(null); }}
                    className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 invisible group-hover:visible"
                    data-testid="button-remove-add-photo"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
              <div className="space-y-1">
                <label htmlFor="add-photo-upload" className="cursor-pointer">
                  <span className="text-sm font-medium text-primary">Upload Photo</span>
                </label>
                <p className="text-xs text-muted-foreground">JPG, PNG or WebP. Max 5MB.</p>
              </div>
            </div>

            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Basic Information</h4>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label>Full Name *</Label>
                <Input
                  placeholder="Enter full name"
                  value={newBeneficiary.fullName}
                  onChange={(e) => setNewBeneficiary(prev => ({ ...prev, fullName: e.target.value }))}
                  data-testid="input-fullname"
                />
              </div>

              <div className="space-y-2">
                <Label>Home Type *</Label>
                <Select
                  value={newBeneficiary.homeType}
                  onValueChange={(v) => setNewBeneficiary(prev => ({ ...prev, homeType: v }))}
                >
                  <SelectTrigger data-testid="select-new-home-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {HOME_TYPES.filter(t => t.value !== "all").map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Gender</Label>
                <Select
                  value={newBeneficiary.gender}
                  onValueChange={(v) => setNewBeneficiary(prev => ({ ...prev, gender: v }))}
                >
                  <SelectTrigger data-testid="select-gender">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MALE">Male</SelectItem>
                    <SelectItem value="FEMALE">Female</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Birth Month</Label>
                <Select
                  value={newBeneficiary.dobMonth}
                  onValueChange={(v) => setNewBeneficiary(prev => ({ ...prev, dobMonth: v }))}
                >
                  <SelectTrigger data-testid="select-dob-month">
                    <SelectValue placeholder="Month" />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((m) => (
                      <SelectItem key={m.value} value={m.value.toString()}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Birth Day</Label>
                <Select
                  value={newBeneficiary.dobDay}
                  onValueChange={(v) => setNewBeneficiary(prev => ({ ...prev, dobDay: v }))}
                >
                  <SelectTrigger data-testid="select-dob-day">
                    <SelectValue placeholder="Day" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                      <SelectItem key={d} value={d.toString()}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Birth Year</Label>
                <Input
                  type="number"
                  placeholder="Optional"
                  value={newBeneficiary.dobYear}
                  onChange={(e) => setNewBeneficiary(prev => ({ ...prev, dobYear: e.target.value }))}
                  data-testid="input-dob-year"
                />
              </div>

              <div className="space-y-2">
                <Label>Approx Age</Label>
                <Input
                  type="number"
                  placeholder="If DOB unknown"
                  value={newBeneficiary.approxAge}
                  onChange={(e) => setNewBeneficiary(prev => ({ ...prev, approxAge: e.target.value }))}
                  data-testid="input-approx-age"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Date of Joining Home</Label>
              <Input
                type="date"
                value={newBeneficiary.joinDate}
                onChange={(e) => setNewBeneficiary(prev => ({ ...prev, joinDate: e.target.value }))}
                data-testid="input-join-date"
              />
            </div>

            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide pt-2">Measurements at Joining</h4>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Height (cm)</Label>
                <Input
                  type="number"
                  placeholder="Height in centimetres"
                  value={newBeneficiary.heightCmAtJoin}
                  onChange={(e) => setNewBeneficiary(prev => ({ ...prev, heightCmAtJoin: e.target.value }))}
                  data-testid="input-height"
                />
              </div>

              <div className="space-y-2">
                <Label>Weight (kg)</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="Weight in kg"
                  value={newBeneficiary.weightKgAtJoin}
                  onChange={(e) => setNewBeneficiary(prev => ({ ...prev, weightKgAtJoin: e.target.value }))}
                  data-testid="input-weight"
                />
              </div>
            </div>

            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide pt-2">Education</h4>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Class / Role</Label>
                <Input
                  placeholder='e.g. "5th Class", "Retired"'
                  value={newBeneficiary.educationClassOrRole}
                  onChange={(e) => setNewBeneficiary(prev => ({ ...prev, educationClassOrRole: e.target.value }))}
                  data-testid="input-education"
                />
              </div>

              <div className="space-y-2">
                <Label>School / College</Label>
                <Input
                  placeholder="Educational institution"
                  value={newBeneficiary.schoolOrCollege}
                  onChange={(e) => setNewBeneficiary(prev => ({ ...prev, schoolOrCollege: e.target.value }))}
                  data-testid="input-school"
                />
              </div>
            </div>

            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide pt-2">Health & Medical</h4>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Current Health Status</Label>
                <Select
                  value={newBeneficiary.currentHealthStatus}
                  onValueChange={(v) => setNewBeneficiary(prev => ({ ...prev, currentHealthStatus: v }))}
                >
                  <SelectTrigger data-testid="select-health-status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Healthy">Healthy</SelectItem>
                    <SelectItem value="Under Treatment">Under Treatment</SelectItem>
                    <SelectItem value="Chronic Condition">Chronic Condition</SelectItem>
                    <SelectItem value="Critical">Critical</SelectItem>
                    <SelectItem value="Recovering">Recovering</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Medical Notes</Label>
              <Textarea
                placeholder="Any existing medical conditions, allergies, medications..."
                value={newBeneficiary.healthNotes}
                onChange={(e) => setNewBeneficiary(prev => ({ ...prev, healthNotes: e.target.value }))}
                data-testid="textarea-health-notes"
              />
            </div>

            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide pt-2">Background</h4>

            <div className="space-y-2">
              <Label>Background</Label>
              <Textarea
                placeholder="Brief background or story..."
                value={newBeneficiary.background}
                onChange={(e) => setNewBeneficiary(prev => ({ ...prev, background: e.target.value }))}
                data-testid="textarea-background"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="protectPrivacy"
                checked={newBeneficiary.protectPrivacy}
                onChange={(e) => setNewBeneficiary(prev => ({ ...prev, protectPrivacy: e.target.checked }))}
                className="h-4 w-4"
                data-testid="checkbox-privacy"
              />
              <Label htmlFor="protectPrivacy" className="font-normal">
                Protect privacy (hide sensitive information in public views)
              </Label>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel">
            Cancel
          </Button>
          <Button onClick={handleAddBeneficiary} disabled={addLoading} data-testid="button-submit">
            {addLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Add Beneficiary
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
