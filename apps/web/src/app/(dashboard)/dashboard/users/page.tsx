"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  MoreHorizontal,
  UserCog,
  Search,
  RefreshCw,
  ShieldCheck,
  ShieldOff,
  KeyRound,
  Pencil,
  Loader2,
  Users,
} from "lucide-react";
import { authStorage, fetchWithAuth } from "@/lib/auth";
import { canAccessModule, ALL_ROLES, ROLE_LABELS } from "@/lib/permissions";
import { AccessDenied } from "@/components/access-denied";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface SystemUser {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const ROLE_BADGE_COLORS: Record<string, string> = {
  FOUNDER: "bg-purple-100 text-purple-800 border-purple-200",
  ADMIN: "bg-red-100 text-red-800 border-red-200",
  MANAGER: "bg-blue-100 text-blue-800 border-blue-200",
  STAFF: "bg-green-100 text-green-800 border-green-200",
  TELECALLER: "bg-yellow-100 text-yellow-800 border-yellow-200",
  ACCOUNTANT: "bg-orange-100 text-orange-800 border-orange-200",
  CARETAKER: "bg-teal-100 text-teal-800 border-teal-200",
  VIEWER: "bg-gray-100 text-gray-700 border-gray-200",
};

async function fetchUsers(): Promise<{ items: SystemUser[]; total: number }> {
  const res = await fetchWithAuth("/api/users?limit=100");
  if (!res.ok) throw new Error("Failed to fetch users");
  return res.json();
}

export default function UsersPage() {
  const currentUser = authStorage.getUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [resetPwDialogOpen, setResetPwDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<SystemUser | null>(null);

  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    phone: "",
    role: "STAFF",
    password: "",
    confirmPassword: "",
  });

  const [editData, setEditData] = useState({ name: "", phone: "", role: "" });
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  if (currentUser && !canAccessModule(currentUser?.role, "users")) {
    return <AccessDenied />;
  }

  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/users"],
    queryFn: fetchUsers,
  });

  const users = data?.items ?? [];

  const filtered = users.filter((u) => {
    const matchesSearch =
      !search ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.phone && u.phone.includes(search));
    const matchesRole = roleFilter === "ALL" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof newUser) => {
      const res = await fetchWithAuth("/api/users/create-staff", {
        method: "POST",
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          phone: data.phone || undefined,
          role: data.role,
          password: data.password,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to create user");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setAddDialogOpen(false);
      setNewUser({ name: "", email: "", phone: "", role: "STAFF", password: "", confirmPassword: "" });
      toast({ title: "User created", description: "New user account has been created successfully." });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const editMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { name?: string; phone?: string; role?: string } }) => {
      const res = await fetchWithAuth(`/api/users/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to update user");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setEditDialogOpen(false);
      setSelectedUser(null);
      toast({ title: "User updated", description: "User details have been updated." });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetchWithAuth(`/api/users/${id}/toggle-active`, {
        method: "PATCH",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to toggle user status");
      }
      return res.json();
    },
    onSuccess: (updated: SystemUser) => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: updated.isActive ? "User activated" : "User deactivated",
        description: `${updated.name} has been ${updated.isActive ? "activated" : "deactivated"}.`,
      });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async ({ id, password }: { id: string; password: string }) => {
      const res = await fetchWithAuth(`/api/users/${id}/reset-password`, {
        method: "PATCH",
        body: JSON.stringify({ newPassword: password }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to reset password");
      }
      return res.json();
    },
    onSuccess: () => {
      setResetPwDialogOpen(false);
      setSelectedUser(null);
      setNewPassword("");
      setConfirmNewPassword("");
      toast({ title: "Password reset", description: "Password has been updated successfully." });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  function openEditDialog(user: SystemUser) {
    setSelectedUser(user);
    setEditData({ name: user.name, phone: user.phone ?? "", role: user.role });
    setEditDialogOpen(true);
  }

  function openResetDialog(user: SystemUser) {
    setSelectedUser(user);
    setNewPassword("");
    setConfirmNewPassword("");
    setResetPwDialogOpen(true);
  }

  function handleCreateSubmit() {
    if (!newUser.name || !newUser.email || !newUser.password) {
      toast({ title: "Validation error", description: "Name, email, and password are required.", variant: "destructive" });
      return;
    }
    if (newUser.password !== newUser.confirmPassword) {
      toast({ title: "Validation error", description: "Passwords do not match.", variant: "destructive" });
      return;
    }
    if (newUser.password.length < 6) {
      toast({ title: "Validation error", description: "Password must be at least 6 characters.", variant: "destructive" });
      return;
    }
    createMutation.mutate(newUser);
  }

  function handleEditSubmit() {
    if (!selectedUser) return;
    editMutation.mutate({ id: selectedUser.id, data: editData });
  }

  function handleResetSubmit() {
    if (!selectedUser) return;
    if (!newPassword || newPassword.length < 6) {
      toast({ title: "Validation error", description: "Password must be at least 6 characters.", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmNewPassword) {
      toast({ title: "Validation error", description: "Passwords do not match.", variant: "destructive" });
      return;
    }
    resetPasswordMutation.mutate({ id: selectedUser.id, password: newPassword });
  }

  const activeCount = users.filter((u) => u.isActive).length;
  const inactiveCount = users.length - activeCount;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">User Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage staff accounts, roles, and access permissions
          </p>
        </div>
        <Button data-testid="button-add-user" onClick={() => setAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{users.length}</p>
                <p className="text-sm text-muted-foreground">Total Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{activeCount}</p>
                <p className="text-sm text-muted-foreground">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <ShieldOff className="h-8 w-8 text-red-400" />
              <div>
                <p className="text-2xl font-bold">{inactiveCount}</p>
                <p className="text-sm text-muted-foreground">Inactive</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
            <div>
              <CardTitle>System Users</CardTitle>
              <CardDescription>All users with system access ({filtered.length} shown)</CardDescription>
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  data-testid="input-search-users"
                  placeholder="Search name, email, phone…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger data-testid="select-role-filter" className="w-36">
                  <SelectValue placeholder="All roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All roles</SelectItem>
                  {ALL_ROLES.map((r) => (
                    <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-48 text-destructive gap-2">
              <UserCog className="h-10 w-10 opacity-40" />
              <p>Failed to load users. Please refresh.</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground gap-2">
              <UserCog className="h-10 w-10 opacity-40" />
              <p className="text-lg font-medium">No users found</p>
              <p className="text-sm">Adjust your search or filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((user) => (
                    <TableRow key={user.id} data-testid={`row-user-${user.id}`} className="hover:bg-muted/40">
                      <TableCell className="font-medium" data-testid={`text-username-${user.id}`}>
                        {user.name}
                        {user.id === currentUser?.id && (
                          <span className="ml-2 text-xs text-muted-foreground">(you)</span>
                        )}
                      </TableCell>
                      <TableCell data-testid={`text-email-${user.id}`} className="text-muted-foreground">
                        {user.email}
                      </TableCell>
                      <TableCell data-testid={`text-phone-${user.id}`} className="text-muted-foreground">
                        {user.phone || <span className="text-xs italic">—</span>}
                      </TableCell>
                      <TableCell>
                        <span
                          data-testid={`badge-role-${user.id}`}
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${ROLE_BADGE_COLORS[user.role] ?? "bg-gray-100 text-gray-700 border-gray-200"}`}
                        >
                          {ROLE_LABELS[user.role] ?? user.role}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          data-testid={`status-active-${user.id}`}
                          variant={user.isActive ? "default" : "secondary"}
                          className={user.isActive ? "bg-green-100 text-green-800 hover:bg-green-100" : ""}
                        >
                          {user.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              data-testid={`button-actions-${user.id}`}
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              data-testid={`menu-edit-${user.id}`}
                              onClick={() => openEditDialog(user)}
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              data-testid={`menu-reset-password-${user.id}`}
                              onClick={() => openResetDialog(user)}
                            >
                              <KeyRound className="mr-2 h-4 w-4" />
                              Reset Password
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              data-testid={`menu-toggle-active-${user.id}`}
                              onClick={() => toggleActiveMutation.mutate(user.id)}
                              disabled={user.id === currentUser?.id}
                              className={user.isActive ? "text-destructive focus:text-destructive" : "text-green-700 focus:text-green-700"}
                            >
                              {user.isActive ? (
                                <>
                                  <ShieldOff className="mr-2 h-4 w-4" />
                                  Deactivate
                                </>
                              ) : (
                                <>
                                  <ShieldCheck className="mr-2 h-4 w-4" />
                                  Activate
                                </>
                              )}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>Create a new staff account with system access.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="new-name">Full Name *</Label>
              <Input
                id="new-name"
                data-testid="input-new-name"
                placeholder="e.g. Priya Sharma"
                value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-email">Email Address *</Label>
              <Input
                id="new-email"
                data-testid="input-new-email"
                type="email"
                placeholder="e.g. priya@example.com"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-phone">Phone Number</Label>
              <Input
                id="new-phone"
                data-testid="input-new-phone"
                placeholder="e.g. +91 9876543210"
                value={newUser.phone}
                onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-role">Role *</Label>
              <Select
                value={newUser.role}
                onValueChange={(v) => setNewUser({ ...newUser, role: v })}
              >
                <SelectTrigger id="new-role" data-testid="select-new-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ALL_ROLES.map((r) => (
                    <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-password">Password *</Label>
              <Input
                id="new-password"
                data-testid="input-new-password"
                type="password"
                placeholder="Min. 6 characters"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-confirm-password">Confirm Password *</Label>
              <Input
                id="new-confirm-password"
                data-testid="input-new-confirm-password"
                type="password"
                placeholder="Re-enter password"
                value={newUser.confirmPassword}
                onChange={(e) => setNewUser({ ...newUser, confirmPassword: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              data-testid="button-confirm-add-user"
              onClick={handleCreateSubmit}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update details for <strong>{selectedUser?.name}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="edit-name">Full Name</Label>
              <Input
                id="edit-name"
                data-testid="input-edit-name"
                value={editData.name}
                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-phone">Phone Number</Label>
              <Input
                id="edit-phone"
                data-testid="input-edit-phone"
                value={editData.phone}
                onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                placeholder="Optional"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-role">Role</Label>
              <Select
                value={editData.role}
                onValueChange={(v) => setEditData({ ...editData, role: v })}
                disabled={selectedUser?.id === currentUser?.id}
              >
                <SelectTrigger id="edit-role" data-testid="select-edit-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ALL_ROLES.map((r) => (
                    <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedUser?.id === currentUser?.id && (
                <p className="text-xs text-muted-foreground">You cannot change your own role.</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              data-testid="button-confirm-edit-user"
              onClick={handleEditSubmit}
              disabled={editMutation.isPending}
            >
              {editMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={resetPwDialogOpen} onOpenChange={setResetPwDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Set a new password for <strong>{selectedUser?.name}</strong>. They will be logged out automatically.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="reset-password">New Password</Label>
              <Input
                id="reset-password"
                data-testid="input-reset-password"
                type="password"
                placeholder="Min. 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="reset-confirm-password">Confirm New Password</Label>
              <Input
                id="reset-confirm-password"
                data-testid="input-reset-confirm-password"
                type="password"
                placeholder="Re-enter new password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetPwDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              data-testid="button-confirm-reset-password"
              onClick={handleResetSubmit}
              disabled={resetPasswordMutation.isPending}
              variant="destructive"
            >
              {resetPasswordMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Reset Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
