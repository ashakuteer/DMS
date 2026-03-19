"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, UserPlus, Phone, ArrowRightLeft, Loader2, Users, UserX } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { fetchWithAuth, authStorage } from "@/lib/auth";
import { AccessDenied } from "@/components/access-denied";

interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
  donorCount?: number;
}

const STAFF_ROLES = [
  { value: "STAFF", label: "Staff" },
  { value: "ADMIN", label: "Admin" },
];

export default function StaffManagementPage() {
  const router = useRouter();
  const { toast } = useToast();
  const user = authStorage.getUser();
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [reassigningPhone, setReassigningPhone] = useState(false);
  const [reassigningDonors, setReassigningDonors] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const [newStaff, setNewStaff] = useState({
    name: "",
    email: "",
    phone: "",
    role: "STAFF",
    password: "",
  });

  const [phoneReassign, setPhoneReassign] = useState({
    fromUserId: "",
    toUserId: "",
  });

  const [donorReassign, setDonorReassign] = useState({
    fromUserId: "",
    toUserId: "",
  });

  const [donorCounts, setDonorCounts] = useState<Record<string, number>>({});

  const fetchStaff = async () => {
    try {
      const res = await fetchWithAuth("/api/users/staff-all");
      if (res.ok) {
        const data = await res.json();
        setStaffList(data);
      }
    } catch {} finally {
      setLoading(false);
    }
  };

  const fetchDonorCount = async (userId: string) => {
    try {
      const res = await fetchWithAuth(`/api/donors/count-by-assignee/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setDonorCounts((prev) => ({ ...prev, [userId]: data.count }));
      }
    } catch {}
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  useEffect(() => {
    staffList.forEach((s) => {
      if (s.isActive) fetchDonorCount(s.id);
    });
  }, [staffList]);

  const handleCreateStaff = async () => {
    if (!newStaff.name || !newStaff.email || !newStaff.phone || !newStaff.password) {
      toast({ title: "Validation Error", description: "All fields are required", variant: "destructive" });
      return;
    }

    setCreating(true);
    try {
      const res = await fetchWithAuth("/api/users/create-staff", {
        method: "POST",
        body: JSON.stringify(newStaff),
      });

      if (res.ok) {
        toast({ title: "Staff Created", description: `${newStaff.name} has been added successfully` });
        setNewStaff({ name: "", email: "", phone: "", role: "STAFF", password: "" });
        fetchStaff();
      } else {
        const error = await res.json();
        toast({ title: "Error", description: error.message || "Failed to create staff", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "An error occurred", variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const handleReassignPhone = async () => {
    if (!phoneReassign.fromUserId || !phoneReassign.toUserId) {
      toast({ title: "Validation Error", description: "Select both source and target staff", variant: "destructive" });
      return;
    }
    if (phoneReassign.fromUserId === phoneReassign.toUserId) {
      toast({ title: "Validation Error", description: "Source and target cannot be the same", variant: "destructive" });
      return;
    }

    setReassigningPhone(true);
    try {
      const res = await fetchWithAuth(`/api/users/${phoneReassign.fromUserId}/reassign-phone`, {
        method: "PATCH",
        body: JSON.stringify({ toUserId: phoneReassign.toUserId }),
      });

      if (res.ok) {
        const result = await res.json();
        toast({ title: "Phone Reassigned", description: result.message });
        setPhoneReassign({ fromUserId: "", toUserId: "" });
        fetchStaff();
      } else {
        const error = await res.json();
        toast({ title: "Error", description: error.message || "Failed to reassign phone", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "An error occurred", variant: "destructive" });
    } finally {
      setReassigningPhone(false);
    }
  };

  const handleBulkReassignDonors = async () => {
    if (!donorReassign.fromUserId || !donorReassign.toUserId) {
      toast({ title: "Validation Error", description: "Select both source and target staff", variant: "destructive" });
      return;
    }
    if (donorReassign.fromUserId === donorReassign.toUserId) {
      toast({ title: "Validation Error", description: "Source and target cannot be the same", variant: "destructive" });
      return;
    }

    const fromStaff = staffList.find((s) => s.id === donorReassign.fromUserId);
    const toStaff = staffList.find((s) => s.id === donorReassign.toUserId);
    const count = donorCounts[donorReassign.fromUserId] || 0;

    if (count === 0) {
      toast({ title: "No Donors", description: `${fromStaff?.name || "This staff"} has no assigned donors`, variant: "destructive" });
      return;
    }

    if (!confirm(`Are you sure you want to reassign ${count} donor(s) from ${fromStaff?.name} to ${toStaff?.name}?`)) {
      return;
    }

    setReassigningDonors(true);
    try {
      const res = await fetchWithAuth("/api/donors/bulk-reassign", {
        method: "POST",
        body: JSON.stringify({
          fromUserId: donorReassign.fromUserId,
          toUserId: donorReassign.toUserId,
        }),
      });

      if (res.ok) {
        const result = await res.json();
        toast({ title: "Donors Reassigned", description: `${result.count} donor(s) moved from ${fromStaff?.name} to ${toStaff?.name}` });
        setDonorReassign({ fromUserId: "", toUserId: "" });
        fetchStaff();
      } else {
        const error = await res.json();
        toast({ title: "Error", description: error.message || "Failed to reassign donors", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "An error occurred", variant: "destructive" });
    } finally {
      setReassigningDonors(false);
    }
  };

  const handleToggleActive = async (staffId: string) => {
    setTogglingId(staffId);
    try {
      const res = await fetchWithAuth(`/api/users/${staffId}/toggle-active`, {
        method: "PATCH",
      });
      if (res.ok) {
        toast({ title: "Status Updated", description: "Staff status has been toggled" });
        fetchStaff();
      } else {
        const error = await res.json();
        toast({ title: "Error", description: error.message || "Failed to toggle status", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "An error occurred", variant: "destructive" });
    } finally {
      setTogglingId(null);
    }
  };

  if (user?.role !== "ADMIN") return <AccessDenied />;

  const staffWithPhone = staffList.filter((s) => s.phone && s.isActive);
  const activeStaff = staffList.filter((s) => s.isActive);
  const staffWithDonors = staffList.filter((s) => (donorCounts[s.id] || 0) > 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()} data-testid="button-back">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Staff Management</h1>
          <p className="text-muted-foreground mt-1">Add staff, manage assignments, and handle transitions</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Add New Staff Member
          </CardTitle>
          <CardDescription>Create a new staff account with phone number</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            <div>
              <Label htmlFor="staffName">Full Name</Label>
              <Input
                id="staffName"
                value={newStaff.name}
                onChange={(e) => setNewStaff((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Enter full name"
                data-testid="input-staff-name"
              />
            </div>
            <div>
              <Label htmlFor="staffEmail">Email</Label>
              <Input
                id="staffEmail"
                type="email"
                value={newStaff.email}
                onChange={(e) => setNewStaff((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="Enter email"
                data-testid="input-staff-email"
              />
            </div>
            <div>
              <Label htmlFor="staffPhone">Phone</Label>
              <Input
                id="staffPhone"
                value={newStaff.phone}
                onChange={(e) => setNewStaff((prev) => ({ ...prev, phone: e.target.value }))}
                placeholder="Phone number"
                data-testid="input-staff-phone"
              />
            </div>
            <div>
              <Label htmlFor="staffRole">Role</Label>
              <Select value={newStaff.role} onValueChange={(v) => setNewStaff((prev) => ({ ...prev, role: v }))}>
                <SelectTrigger data-testid="select-staff-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STAFF_ROLES.map((r) => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="staffPassword">Password</Label>
              <Input
                id="staffPassword"
                type="password"
                value={newStaff.password}
                onChange={(e) => setNewStaff((prev) => ({ ...prev, password: e.target.value }))}
                placeholder="Set password"
                data-testid="input-staff-password"
              />
            </div>
          </div>
          <Button onClick={handleCreateStaff} disabled={creating} className="mt-4" data-testid="button-create-staff">
            {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
            {creating ? "Creating..." : "Add Staff Member"}
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Bulk Reassign Donors
            </CardTitle>
            <CardDescription>Transfer all assigned donors from one staff to another when someone leaves or changes role</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>From Staff</Label>
              <Select value={donorReassign.fromUserId} onValueChange={(v) => setDonorReassign((prev) => ({ ...prev, fromUserId: v }))}>
                <SelectTrigger data-testid="select-donor-from-staff">
                  <SelectValue placeholder="Select source staff" />
                </SelectTrigger>
                <SelectContent>
                  {staffWithDonors.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} ({donorCounts[s.id] || 0} donors)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>To Staff</Label>
              <Select value={donorReassign.toUserId} onValueChange={(v) => setDonorReassign((prev) => ({ ...prev, toUserId: v }))}>
                <SelectTrigger data-testid="select-donor-to-staff">
                  <SelectValue placeholder="Select target staff" />
                </SelectTrigger>
                <SelectContent>
                  {activeStaff
                    .filter((s) => s.id !== donorReassign.fromUserId)
                    .map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name} ({donorCounts[s.id] || 0} donors)
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            {donorReassign.fromUserId && (
              <p className="text-sm text-muted-foreground">
                {donorCounts[donorReassign.fromUserId] || 0} donor(s) will be moved
              </p>
            )}
            <Button
              onClick={handleBulkReassignDonors}
              disabled={reassigningDonors || !donorReassign.fromUserId || !donorReassign.toUserId}
              className="w-full"
              data-testid="button-reassign-donors"
            >
              {reassigningDonors ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Users className="mr-2 h-4 w-4" />}
              {reassigningDonors ? "Reassigning..." : "Reassign All Donors"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5" />
              Reassign Phone Number
            </CardTitle>
            <CardDescription>Transfer a phone number from one staff to another. Source staff will be marked inactive.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>From Staff (phone will be removed)</Label>
              <Select value={phoneReassign.fromUserId} onValueChange={(v) => setPhoneReassign((prev) => ({ ...prev, fromUserId: v }))}>
                <SelectTrigger data-testid="select-phone-from-staff">
                  <SelectValue placeholder="Select source staff" />
                </SelectTrigger>
                <SelectContent>
                  {staffWithPhone.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} ({s.phone})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>To Staff (phone will be assigned)</Label>
              <Select value={phoneReassign.toUserId} onValueChange={(v) => setPhoneReassign((prev) => ({ ...prev, toUserId: v }))}>
                <SelectTrigger data-testid="select-phone-to-staff">
                  <SelectValue placeholder="Select target staff" />
                </SelectTrigger>
                <SelectContent>
                  {activeStaff
                    .filter((s) => s.id !== phoneReassign.fromUserId)
                    .map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name} {s.phone ? `(${s.phone})` : "(no phone)"}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleReassignPhone}
              disabled={reassigningPhone || !phoneReassign.fromUserId || !phoneReassign.toUserId}
              variant="outline"
              className="w-full"
              data-testid="button-reassign-phone"
            >
              {reassigningPhone ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRightLeft className="mr-2 h-4 w-4" />}
              {reassigningPhone ? "Transferring..." : "Transfer Phone Number"}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Staff Directory
          </CardTitle>
          <CardDescription>{staffList.length} staff members</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : staffList.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No staff members found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3 font-medium">Name</th>
                    <th className="text-left py-2 px-3 font-medium">Email</th>
                    <th className="text-left py-2 px-3 font-medium">Phone</th>
                    <th className="text-left py-2 px-3 font-medium">Role</th>
                    <th className="text-left py-2 px-3 font-medium">Donors</th>
                    <th className="text-left py-2 px-3 font-medium">Status</th>
                    <th className="text-left py-2 px-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {staffList.map((staff) => (
                    <tr key={staff.id} className="border-b hover:bg-muted/50">
                      <td className="py-2 px-3 font-medium" data-testid={`text-staff-name-${staff.id}`}>{staff.name}</td>
                      <td className="py-2 px-3 text-muted-foreground">{staff.email}</td>
                      <td className="py-2 px-3" data-testid={`text-staff-phone-${staff.id}`}>
                        {staff.phone || <span className="text-muted-foreground">-</span>}
                      </td>
                      <td className="py-2 px-3">
                        <Badge variant="outline">{staff.role}</Badge>
                      </td>
                      <td className="py-2 px-3">
                        <Badge variant="secondary">{donorCounts[staff.id] ?? "-"}</Badge>
                      </td>
                      <td className="py-2 px-3">
                        <Badge variant={staff.isActive ? "default" : "secondary"}>
                          {staff.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="py-2 px-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleActive(staff.id)}
                          disabled={togglingId === staff.id}
                          data-testid={`button-toggle-${staff.id}`}
                        >
                          {togglingId === staff.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : staff.isActive ? (
                            <UserX className="h-4 w-4 text-destructive" />
                          ) : (
                            <UserPlus className="h-4 w-4 text-green-600" />
                          )}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
