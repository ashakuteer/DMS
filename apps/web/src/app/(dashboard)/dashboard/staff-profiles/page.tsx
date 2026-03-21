"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, UserPlus, Search, Users, Phone, Mail, Building2 } from "lucide-react";
import { fetchWithAuth, authStorage } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

interface Home {
  id: string;
  name: string;
}

interface StaffMember {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  roleType: "ADMIN" | "TELECALLER" | "HOME_STAFF";
  designation?: string;
  status: "ACTIVE" | "INACTIVE";
  home?: Home;
  createdAt: string;
}

const ROLE_TYPE_LABELS: Record<string, string> = {
  ADMIN: "Admin",
  TELECALLER: "Telecaller",
  HOME_STAFF: "Home Staff",
};

const ROLE_TYPE_COLORS: Record<string, string> = {
  ADMIN: "bg-purple-500/15 text-purple-600 dark:text-purple-400",
  TELECALLER: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  HOME_STAFF: "bg-orange-500/15 text-orange-600 dark:text-orange-400",
};

export default function StaffProfilesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const user = authStorage.getUser();

  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [homes, setHomes] = useState<Home[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterRoleType, setFilterRoleType] = useState("ALL");
  const [filterHomeId, setFilterHomeId] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");

  useEffect(() => {
    Promise.all([
      fetchWithAuth("/api/staff-profiles").then((r) => r.json()),
      fetchWithAuth("/api/homes").then((r) => r.json()),
    ])
      .then(([staffData, homesData]) => {
        setStaff(Array.isArray(staffData) ? staffData : []);
        setHomes(Array.isArray(homesData) ? homesData : []);
      })
      .catch(() => toast({ title: "Error", description: "Failed to load staff data", variant: "destructive" }))
      .finally(() => setLoading(false));
  }, []);

  const filtered = staff.filter((s) => {
    if (filterRoleType !== "ALL" && s.roleType !== filterRoleType) return false;
    if (filterHomeId !== "ALL" && s.home?.id !== filterHomeId) return false;
    if (filterStatus !== "ALL" && s.status !== filterStatus) return false;
    if (search) {
      const q = search.toLowerCase();
      if (
        !s.name.toLowerCase().includes(q) &&
        !s.email?.toLowerCase().includes(q) &&
        !s.phone?.includes(q) &&
        !s.designation?.toLowerCase().includes(q)
      )
        return false;
    }
    return true;
  });

  const canEdit = user?.role === "FOUNDER" || user?.role === "ADMIN";

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Staff Profiles</h1>
          <p className="text-muted-foreground mt-1">Manage staff records, documents, and emergency info</p>
        </div>
        {canEdit && (
          <Button asChild data-testid="button-add-staff">
            <Link href="/dashboard/staff-profiles/new">
              <UserPlus className="mr-2 h-4 w-4" />
              Add Staff
            </Link>
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            data-testid="input-search-staff"
          />
        </div>
        <Select value={filterRoleType} onValueChange={setFilterRoleType}>
          <SelectTrigger className="w-[160px]" data-testid="select-filter-role">
            <SelectValue placeholder="Role Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Roles</SelectItem>
            <SelectItem value="ADMIN">Admin</SelectItem>
            <SelectItem value="TELECALLER">Telecaller</SelectItem>
            <SelectItem value="HOME_STAFF">Home Staff</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterHomeId} onValueChange={setFilterHomeId}>
          <SelectTrigger className="w-[180px]" data-testid="select-filter-home">
            <SelectValue placeholder="Home" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Homes</SelectItem>
            {homes.map((h) => (
              <SelectItem key={h.id} value={h.id}>
                {h.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[140px]" data-testid="select-filter-status">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Status</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="INACTIVE">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Users className="h-12 w-12 text-muted-foreground/40" />
          <p className="text-muted-foreground">No staff members found</p>
          {canEdit && (
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard/staff-profiles/new">Add first staff member</Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((s) => (
            <Link key={s.id} href={`/dashboard/staff-profiles/${s.id}`} data-testid={`card-staff-${s.id}`}>
              <Card className="h-full hover:border-orange-500/40 transition-colors cursor-pointer">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base font-semibold truncate" data-testid={`text-staff-name-${s.id}`}>
                        {s.name}
                      </CardTitle>
                      {s.designation && (
                        <p className="text-sm text-muted-foreground truncate">{s.designation}</p>
                      )}
                    </div>
                    <Badge
                      variant={s.status === "ACTIVE" ? "default" : "secondary"}
                      className="text-xs shrink-0"
                      data-testid={`badge-status-${s.id}`}
                    >
                      {s.status === "ACTIVE" ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 pt-0">
                  <span
                    className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${ROLE_TYPE_COLORS[s.roleType] || ""}`}
                    data-testid={`badge-role-${s.id}`}
                  >
                    {ROLE_TYPE_LABELS[s.roleType] || s.roleType}
                  </span>
                  {s.phone && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate" data-testid={`text-phone-${s.id}`}>{s.phone}</span>
                    </div>
                  )}
                  {s.email && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate" data-testid={`text-email-${s.id}`}>{s.email}</span>
                    </div>
                  )}
                  {s.home && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Building2 className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate" data-testid={`text-home-${s.id}`}>{s.home.name}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
