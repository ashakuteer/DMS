"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Loader2, UserPlus } from "lucide-react";
import { fetchWithAuth, authStorage } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { AccessDenied } from "@/components/access-denied";

interface Home {
  id: string;
  name: string;
}

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export default function NewStaffPage() {
  const router = useRouter();
  const { toast } = useToast();
  const user = authStorage.getUser();

  const [homes, setHomes] = useState<Home[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    roleType: "",
    designation: "",
    homeId: "",
    bloodGroup: "",
    emergencyContact1Name: "",
    emergencyContact1Phone: "",
    emergencyContact2Name: "",
    emergencyContact2Phone: "",
  });

  useEffect(() => {
    fetchWithAuth("/api/homes")
      .then((r) => r.json())
      .then((data) => setHomes(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const set = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.roleType) {
      toast({ title: "Validation Error", description: "Name and Role Type are required", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const payload: any = { ...form };
      if (!payload.homeId) delete payload.homeId;
      if (!payload.bloodGroup) delete payload.bloodGroup;

      const res = await fetchWithAuth("/api/staff-profiles", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const created = await res.json();
        toast({ title: "Staff Created", description: `${form.name} has been added successfully` });
        router.push(`/dashboard/staff-profiles/${created.id}`);
      } else {
        const err = await res.json();
        toast({ title: "Error", description: err.message || "Failed to create staff", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "An unexpected error occurred", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (user?.role !== "FOUNDER" && user?.role !== "ADMIN") return <AccessDenied />;

  return (
    <div className="p-6 max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()} data-testid="button-back">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Add Staff Member</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Fill in the details to create a new staff profile</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Enter full name"
              data-testid="input-name"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="+91 9xxxxxxxxx"
              data-testid="input-phone"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="staff@example.com"
              data-testid="input-email"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Role Type *</Label>
            <Select value={form.roleType} onValueChange={(v) => set("roleType", v)}>
              <SelectTrigger data-testid="select-role-type">
                <SelectValue placeholder="Select role type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="TELECALLER">Telecaller</SelectItem>
                <SelectItem value="HOME_STAFF">Home Staff</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="designation">Designation</Label>
            <Input
              id="designation"
              value={form.designation}
              onChange={(e) => set("designation", e.target.value)}
              placeholder="e.g. Cook, Supervisor, Telecaller"
              data-testid="input-designation"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Home</Label>
            <Select value={form.homeId} onValueChange={(v) => set("homeId", v)}>
              <SelectTrigger data-testid="select-home">
                <SelectValue placeholder="Select home" />
              </SelectTrigger>
              <SelectContent>
                {homes.map((h) => (
                  <SelectItem key={h.id} value={h.id}>
                    {h.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Medical & Emergency Info</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Blood Group</Label>
            <Select value={form.bloodGroup} onValueChange={(v) => set("bloodGroup", v)}>
              <SelectTrigger data-testid="select-blood-group">
                <SelectValue placeholder="Select blood group" />
              </SelectTrigger>
              <SelectContent>
                {BLOOD_GROUPS.map((bg) => (
                  <SelectItem key={bg} value={bg}>
                    {bg}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div />
          <div className="space-y-1.5">
            <Label htmlFor="ec1Name">Emergency Contact 1 — Name</Label>
            <Input
              id="ec1Name"
              value={form.emergencyContact1Name}
              onChange={(e) => set("emergencyContact1Name", e.target.value)}
              placeholder="Contact name"
              data-testid="input-ec1-name"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ec1Phone">Emergency Contact 1 — Phone</Label>
            <Input
              id="ec1Phone"
              value={form.emergencyContact1Phone}
              onChange={(e) => set("emergencyContact1Phone", e.target.value)}
              placeholder="Phone number"
              data-testid="input-ec1-phone"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ec2Name">Emergency Contact 2 — Name</Label>
            <Input
              id="ec2Name"
              value={form.emergencyContact2Name}
              onChange={(e) => set("emergencyContact2Name", e.target.value)}
              placeholder="Contact name"
              data-testid="input-ec2-name"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ec2Phone">Emergency Contact 2 — Phone</Label>
            <Input
              id="ec2Phone"
              value={form.emergencyContact2Phone}
              onChange={(e) => set("emergencyContact2Phone", e.target.value)}
              placeholder="Phone number"
              data-testid="input-ec2-phone"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button onClick={handleSubmit} disabled={submitting} data-testid="button-submit">
          {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
          {submitting ? "Creating..." : "Create Staff Member"}
        </Button>
        <Button variant="outline" onClick={() => router.back()} data-testid="button-cancel">
          Cancel
        </Button>
      </div>
    </div>
  );
}
