"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, UserCog } from "lucide-react";
import { authStorage } from "@/lib/auth";
import { canAccessModule } from "@/lib/permissions";
import { AccessDenied } from "@/components/access-denied";

export default function UsersPage() {
  const user = authStorage.getUser();
  if (user && !canAccessModule(user?.role, 'users')) return <AccessDenied />;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">User Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage system users and their roles
          </p>
        </div>
        <Button data-testid="button-add-user">
          <Plus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>System Users</CardTitle>
          <CardDescription>
            All users with system access
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <UserCog className="h-12 w-12 mb-4 opacity-50" />
            <p className="text-lg font-medium">User list will appear here</p>
            <p className="text-sm">Manage roles: Admin, Staff, Telecaller, Accountant, Manager, Caretaker, Viewer</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
