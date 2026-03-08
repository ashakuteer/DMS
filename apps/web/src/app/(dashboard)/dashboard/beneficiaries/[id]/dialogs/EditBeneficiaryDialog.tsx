"use client";

import { Edit, Loader2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editForm: any;
  setEditForm: any;
  editLoading: boolean;
  months: string[];
  onSubmit: () => void;
}

export default function EditBeneficiaryDialog({
  open,
  onOpenChange,
  editForm,
  setEditForm,
  editLoading,
  months,
  onSubmit,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Edit Beneficiary
          </DialogTitle>
          <DialogDescription>Update beneficiary details below.</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-4">
            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Basic Information
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Full Name *</Label>
                <Input
                  value={editForm.fullName}
                  onChange={(e) =>
                    setEditForm({ ...editForm, fullName: e.target.value })
                  }
                />
              </div>

              <div className="space-y-1.5">
                <Label>Home *</Label>
                <Select
                  value={editForm.homeType}
                  onValueChange={(v) => setEditForm({ ...editForm, homeType: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ORPHAN_GIRLS">Orphan Girls Home</SelectItem>
                    <SelectItem value="BLIND_BOYS">Visually Challenged Boys Home</SelectItem>
                    <SelectItem value="OLD_AGE">Old Age Home</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Gender</Label>
                <Select
                  value={editForm.gender || "_none"}
                  onValueChange={(v) =>
                    setEditForm({ ...editForm, gender: v === "_none" ? "" : v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">Not specified</SelectItem>
                    <SelectItem value="MALE">Male</SelectItem>
                    <SelectItem value="FEMALE">Female</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select
                  value={editForm.status}
                  onValueChange={(v) => setEditForm({ ...editForm, status: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Date of Birth
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <Label>Day</Label>
                <Input
                  type="number"
                  min="1"
                  max="31"
                  value={editForm.dobDay}
                  onChange={(e) =>
                    setEditForm({ ...editForm, dobDay: e.target.value })
                  }
                />
              </div>

              <div className="space-y-1.5">
                <Label>Month</Label>
                <Select
                  value={editForm.dobMonth || "_none"}
                  onValueChange={(v) =>
                    setEditForm({ ...editForm, dobMonth: v === "_none" ? "" : v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">-</SelectItem>
                    {months.map((m, i) => (
                      <SelectItem key={m} value={String(i + 1)}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Year</Label>
                <Input
                  type="number"
                  min="1920"
                  max="2026"
                  value={editForm.dobYear}
                  onChange={(e) =>
                    setEditForm({ ...editForm, dobYear: e.target.value })
                  }
                />
              </div>

              <div className="space-y-1.5">
                <Label>Approx Age</Label>
                <Input
                  type="number"
                  min="0"
                  max="120"
                  value={editForm.approxAge}
                  onChange={(e) =>
                    setEditForm({ ...editForm, approxAge: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Joining & Measurements
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>Join Date</Label>
                <Input
                  type="date"
                  value={editForm.joinDate}
                  onChange={(e) =>
                    setEditForm({ ...editForm, joinDate: e.target.value })
                  }
                />
              </div>

              <div className="space-y-1.5">
                <Label>Height at Join (cm)</Label>
                <Input
                  type="number"
                  value={editForm.heightCmAtJoin}
                  onChange={(e) =>
                    setEditForm({ ...editForm, heightCmAtJoin: e.target.value })
                  }
                />
              </div>

              <div className="space-y-1.5">
                <Label>Weight at Join (kg)</Label>
                <Input
                  type="number"
                  value={editForm.weightKgAtJoin}
                  onChange={(e) =>
                    setEditForm({ ...editForm, weightKgAtJoin: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Education & Health
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Class / Role</Label>
                <Input
                  value={editForm.educationClassOrRole}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      educationClassOrRole: e.target.value,
                    })
                  }
                />
              </div>

              <div className="space-y-1.5">
                <Label>School / College</Label>
                <Input
                  value={editForm.schoolOrCollege}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      schoolOrCollege: e.target.value,
                    })
                  }
                />
              </div>

              <div className="space-y-1.5">
                <Label>Health Status</Label>
                <Select
                  value={editForm.currentHealthStatus || "_none"}
                  onValueChange={(v) =>
                    setEditForm({
                      ...editForm,
                      currentHealthStatus: v === "_none" ? "" : v,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">Not specified</SelectItem>
                    <SelectItem value="HEALTHY">Healthy</SelectItem>
                    <SelectItem value="MILD_CONCERN">Mild Concern</SelectItem>
                    <SelectItem value="UNDER_TREATMENT">Under Treatment</SelectItem>
                    <SelectItem value="CHRONIC_CONDITION">Chronic Condition</SelectItem>
                    <SelectItem value="CRITICAL">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Health Notes</Label>
              <Textarea
                rows={2}
                value={editForm.healthNotes}
                onChange={(e) =>
                  setEditForm({ ...editForm, healthNotes: e.target.value })
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label>Background</Label>
              <Textarea
                rows={2}
                value={editForm.background}
                onChange={(e) =>
                  setEditForm({ ...editForm, background: e.target.value })
                }
              />
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Interests & Aspirations
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Dream Career</Label>
                <Input
                  value={editForm.dreamCareer}
                  onChange={(e) =>
                    setEditForm({ ...editForm, dreamCareer: e.target.value })
                  }
                />
              </div>

              <div className="space-y-1.5">
                <Label>Hobbies</Label>
                <Input
                  value={editForm.hobbies}
                  onChange={(e) =>
                    setEditForm({ ...editForm, hobbies: e.target.value })
                  }
                />
              </div>

              <div className="space-y-1.5">
                <Label>Favourite Subject</Label>
                <Input
                  value={editForm.favouriteSubject}
                  onChange={(e) =>
                    setEditForm({ ...editForm, favouriteSubject: e.target.value })
                  }
                />
              </div>

              <div className="space-y-1.5">
                <Label>Favourite Game</Label>
                <Input
                  value={editForm.favouriteGame}
                  onChange={(e) =>
                    setEditForm({ ...editForm, favouriteGame: e.target.value })
                  }
                />
              </div>

              <div className="space-y-1.5">
                <Label>Favourite Activity at Home</Label>
                <Input
                  value={editForm.favouriteActivityAtHome}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      favouriteActivityAtHome: e.target.value,
                    })
                  }
                />
              </div>

              <div className="space-y-1.5">
                <Label>Best Friend</Label>
                <Input
                  value={editForm.bestFriend}
                  onChange={(e) =>
                    setEditForm({ ...editForm, bestFriend: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Source of Pride / Happiness</Label>
              <Input
                value={editForm.sourceOfPrideOrHappiness}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    sourceOfPrideOrHappiness: e.target.value,
                  })
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label>Fun Fact</Label>
              <Input
                value={editForm.funFact}
                onChange={(e) =>
                  setEditForm({ ...editForm, funFact: e.target.value })
                }
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Additional Notes</Label>
            <Textarea
              rows={3}
              value={editForm.additionalNotes}
              onChange={(e) =>
                setEditForm({ ...editForm, additionalNotes: e.target.value })
              }
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={editLoading || !editForm.fullName}>
            {editLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
