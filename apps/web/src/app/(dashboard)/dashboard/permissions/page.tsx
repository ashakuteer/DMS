"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchWithAuth, authStorage } from "@/lib/auth";
import { ALL_ROLES, ROLE_LABELS } from "@/lib/permissions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Shield, Save, RotateCcw, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

interface ModuleInfo {
  name: string;
  actions: string[];
}

const MODULE_LABELS: Record<string, string> = {
  donors: "Donors",
  donations: "Donations",
  beneficiaries: "Beneficiaries",
  pledges: "Pledges",
  campaigns: "Campaigns",
  reports: "Reports",
  analytics: "Analytics",
  management: "Management",
  settings: "Settings",
  users: "Users",
  milestones: "Milestones",
  dailyActions: "Daily Actions",
  reminders: "Reminders",
  followUps: "Follow-ups",
  templates: "Templates",
  reportCampaigns: "Report Campaigns",
  emailQueue: "Email Queue",
  auditLog: "Audit Log",
  backup: "Backup & Restore",
  birthdayWishes: "Birthday Wishes",
  donorUpdates: "Donor Updates",
  donorReports: "Donor Reports",
  progressReports: "Progress Reports",
  homeSummary: "Home Summary",
  ngoDocuments: "Document Vault",
  permissions: "Permissions",
  dashboard: "Dashboard",
};

const ACTION_LABELS: Record<string, string> = {
  view: "View",
  create: "Create",
  edit: "Edit",
  delete: "Delete",
  export: "Export",
  addNotes: "Add Notes",
  viewSensitive: "View Sensitive",
  send: "Send",
  manageTemplates: "Manage Templates",
  generate: "Generate",
  share: "Share",
  upload: "Upload",
  accessLog: "Access Log",
  manage: "Manage",
  restore: "Restore",
};

type PermissionMatrix = Record<string, Record<string, Record<string, boolean>>>;

export default function PermissionsPage() {
  const [modules, setModules] = useState<ModuleInfo[]>([]);
  const [matrix, setMatrix] = useState<PermissionMatrix>({});
  const [originalMatrix, setOriginalMatrix] = useState<PermissionMatrix>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>("STAFF");
  const [hasChanges, setHasChanges] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const user = authStorage.getUser();

  useEffect(() => {
    if (user?.role !== "FOUNDER" && user?.role !== "ADMIN") {
      router.push("/dashboard");
      return;
    }
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [modulesRes, matrixRes] = await Promise.all([
        fetchWithAuth("/api/role-permissions/modules"),
        fetchWithAuth("/api/role-permissions/matrix"),
      ]);

      if (modulesRes.ok && matrixRes.ok) {
        const modulesData = await modulesRes.json();
        const matrixData = await matrixRes.json();
        setModules(modulesData);
        setMatrix(matrixData);
        setOriginalMatrix(JSON.parse(JSON.stringify(matrixData)));
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to load permissions data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = (role: string, module: string, action: string) => {
    if (role === "ADMIN") return;
    setMatrix((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      if (!next[role]) next[role] = {};
      if (!next[role][module]) next[role][module] = {};
      next[role][module][action] = !next[role][module][action];
      return next;
    });
    setHasChanges(true);
  };

  const getPermissionValue = (role: string, module: string, action: string): boolean => {
    if (role === "ADMIN") return true;
    return matrix[role]?.[module]?.[action] ?? false;
  };

  const saveChanges = async () => {
    setSaving(true);
    try {
      const changedPermissions: { module: string; action: string; allowed: boolean }[] = [];

      for (const mod of modules) {
        for (const action of mod.actions) {
          const newVal = matrix[selectedRole]?.[mod.name]?.[action] ?? false;
          const oldVal = originalMatrix[selectedRole]?.[mod.name]?.[action] ?? false;
          if (newVal !== oldVal) {
            changedPermissions.push({
              module: mod.name,
              action,
              allowed: newVal,
            });
          }
        }
      }

      if (changedPermissions.length === 0) {
        toast({ title: "No changes", description: "No permissions were modified" });
        setSaving(false);
        return;
      }

      const res = await fetchWithAuth(`/api/role-permissions/role/${selectedRole}`, {
        method: "PATCH",
        body: JSON.stringify({ permissions: changedPermissions }),
      });

      if (res.ok) {
        toast({
          title: "Saved",
          description: `Updated ${changedPermissions.length} permissions for ${ROLE_LABELS[selectedRole]}`,
        });
        setOriginalMatrix(JSON.parse(JSON.stringify(matrix)));
        setHasChanges(false);
      } else {
        throw new Error("Save failed");
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to save permissions",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const resetChanges = () => {
    setMatrix(JSON.parse(JSON.stringify(originalMatrix)));
    setHasChanges(false);
  };

  const handleRoleChange = useCallback((role: string) => {
    if (hasChanges) {
      const confirmed = window.confirm("You have unsaved changes. Switch role anyway?");
      if (!confirmed) return;
    }
    setSelectedRole(role);
    setHasChanges(false);
    setMatrix(JSON.parse(JSON.stringify(originalMatrix)));
  }, [hasChanges, originalMatrix]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" data-testid="loading-spinner" />
      </div>
    );
  }

  const editableRoles = ALL_ROLES.filter((r) => r !== "ADMIN");

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">
            Permission Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Configure which actions each role can perform across different modules
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <Badge variant="outline" className="text-[#5FA8A8] border-[#5FA8A8]" data-testid="badge-unsaved">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Unsaved Changes
            </Badge>
          )}
          <Button
            variant="outline"
            onClick={resetChanges}
            disabled={!hasChanges || saving}
            data-testid="button-reset"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button
            onClick={saveChanges}
            disabled={!hasChanges || saving}
            data-testid="button-save"
          >
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save Changes
          </Button>
        </div>
      </div>

      <Tabs value="matrix" className="space-y-4">
        <TabsList>
          <TabsTrigger value="matrix" data-testid="tab-matrix">
            <Shield className="h-4 w-4 mr-2" />
            Permission Matrix
          </TabsTrigger>
        </TabsList>

        <TabsContent value="matrix">
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <CardTitle>Role Permissions</CardTitle>
                  <CardDescription>
                    Toggle permissions for the selected role. Admin always has full access.
                  </CardDescription>
                </div>
                <Select value={selectedRole} onValueChange={handleRoleChange}>
                  <SelectTrigger className="w-48" data-testid="select-role">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {editableRoles.map((role) => (
                      <SelectItem key={role} value={role} data-testid={`option-role-${role}`}>
                        {ROLE_LABELS[role]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {modules.map((mod) => (
                  <div key={mod.name} className="border rounded-md p-4" data-testid={`module-${mod.name}`}>
                    <h3 className="font-semibold mb-3" data-testid={`text-module-${mod.name}`}>
                      {MODULE_LABELS[mod.name] || mod.name}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {mod.actions.map((action) => {
                        const enabled = getPermissionValue(selectedRole, mod.name, action);
                        return (
                          <div
                            key={action}
                            className="flex items-center justify-between gap-2 p-2 rounded-md bg-muted/50"
                            data-testid={`perm-${mod.name}-${action}`}
                          >
                            <span className="text-sm">
                              {ACTION_LABELS[action] || action}
                            </span>
                            <Switch
                              checked={enabled}
                              onCheckedChange={() => togglePermission(selectedRole, mod.name, action)}
                              disabled={selectedRole === "ADMIN"}
                              data-testid={`switch-${mod.name}-${action}`}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
