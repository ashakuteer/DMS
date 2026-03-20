"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authStorage, logout, User } from "@/lib/auth";
import { usePermissions } from "@/lib/permission-provider";
import {
  LayoutDashboard, Users, IndianRupee, HandHeart, FileText, Settings,
  LogOut, ChevronLeft, Menu, Moon, Sun, UserCog, MessageSquareText,
  Bell, Inbox, BarChart3, Megaphone, Radio, Target,
  TrendingUp, Milestone, ShieldCheck, DatabaseBackup, ArchiveRestore,
  Cake, Send, FileBarChart, ClipboardList, Building2, ArrowUpRight,
  FolderLock, Lock, Repeat, ListChecks, Phone, Clock, ChevronDown,
  ChevronRight, MessageSquarePlus,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

interface NavItem {
  title: string;
  tKey: string;
  href: string;
  icon: React.ElementType;
  permissionModule?: string;
}

interface NavGroup {
  label?: string;
  labelKey?: string;
  pinned?: boolean;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    pinned: true,
    items: [
      { title: "Dashboard", tKey: "dashboard", href: "/dashboard", icon: LayoutDashboard, permissionModule: "dashboard" },
      { title: "Daily Actions", tKey: "daily_actions", href: "/dashboard/daily-actions", icon: Inbox, permissionModule: "dailyActions" },
    ],
  },
  {
    label: "Core",
    labelKey: "group_core",
    items: [
      { title: "Donors", tKey: "donors", href: "/dashboard/donors", icon: Users, permissionModule: "donors" },
      { title: "Donations", tKey: "donations", href: "/dashboard/donations", icon: IndianRupee, permissionModule: "donations" },
      { title: "Beneficiaries", tKey: "beneficiaries", href: "/dashboard/beneficiaries", icon: HandHeart, permissionModule: "beneficiaries" },
      { title: "Campaigns", tKey: "campaigns", href: "/dashboard/campaigns", icon: Target, permissionModule: "campaigns" },
    ],
  },
  {
    label: "Reports & Analytics",
    labelKey: "group_reports_analytics",
    items: [
      { title: "Analytics", tKey: "analytics", href: "/dashboard/analytics", icon: BarChart3, permissionModule: "analytics" },
      { title: "Impact Dashboard", tKey: "impact_dashboard", href: "/dashboard/impact", icon: TrendingUp, permissionModule: "impact" },
      { title: "Retention", tKey: "retention", href: "/dashboard/retention", icon: Repeat, permissionModule: "retention" },
      { title: "Reports", tKey: "reports", href: "/dashboard/reports", icon: FileText, permissionModule: "reports" },
      { title: "Donor Reports", tKey: "donor_reports", href: "/dashboard/donor-reports", icon: FileBarChart, permissionModule: "donorReports" },
      { title: "Report Campaigns", tKey: "report_campaigns", href: "/dashboard/report-campaigns", icon: Megaphone, permissionModule: "reportCampaigns" },
      { title: "Progress Reports", tKey: "progress_reports", href: "/dashboard/progress-reports", icon: ClipboardList, permissionModule: "progressReports" },
      { title: "Home Summary", tKey: "home_summary", href: "/dashboard/home-summary", icon: Building2, permissionModule: "homeSummary" },
    ],
  },
  {
    label: "Communication",
    labelKey: "group_communication",
    items: [
      { title: "Send Message", tKey: "send_message", href: "/dashboard/send-message", icon: MessageSquarePlus, permissionModule: "broadcasting" },
      { title: "Templates", tKey: "templates", href: "/dashboard/comm-templates", icon: MessageSquareText, permissionModule: "templates" },
      { title: "Broadcasting", tKey: "broadcasting", href: "/dashboard/broadcasting", icon: Radio, permissionModule: "broadcasting" },
      { title: "Donor Updates", tKey: "donor_updates", href: "/dashboard/donor-updates", icon: Send, permissionModule: "donorUpdates" },
      { title: "Birthday Wishes", tKey: "birthday_wishes", href: "/dashboard/birthday-wishes", icon: Cake, permissionModule: "birthdayWishes" },
      { title: "Reminders", tKey: "reminders", href: "/dashboard/reminders", icon: Bell, permissionModule: "reminders" },
      { title: "Follow-ups", tKey: "follow_ups", href: "/dashboard/follow-ups", icon: ArrowUpRight, permissionModule: "followUps" },
    ],
  },
  {
    label: "Staff",
    labelKey: "group_staff",
    items: [
      { title: "Staff & Tasks", tKey: "staff_tasks", href: "/dashboard/staff-tasks", icon: ListChecks, permissionModule: "staffTasks" },
      { title: "Staff Contacts", tKey: "staff_contacts", href: "/dashboard/staff-management", icon: Phone, permissionModule: "users" },
    ],
  },
  {
    label: "Admin Tools",
    labelKey: "group_admin_tools",
    items: [
      { title: "Users", tKey: "users", href: "/dashboard/users", icon: UserCog, permissionModule: "users" },
      { title: "Permissions", tKey: "permissions", href: "/dashboard/permissions", icon: Lock, permissionModule: "permissions" },
      { title: "Document Vault", tKey: "document_vault", href: "/dashboard/ngo-documents", icon: FolderLock, permissionModule: "ngoDocuments" },
      { title: "Audit Log", tKey: "audit_log", href: "/dashboard/audit-log", icon: ShieldCheck, permissionModule: "auditLog" },
      { title: "Backup & Restore", tKey: "backup_restore", href: "/dashboard/backup", icon: DatabaseBackup, permissionModule: "backup" },
      { title: "Archive", tKey: "archive", href: "/dashboard/admin/archive", icon: ArchiveRestore, permissionModule: "archive" },
    ],
  },
  {
    label: "System",
    labelKey: "group_system",
    items: [
      { title: "Time Machine", tKey: "time_machine", href: "/dashboard/time-machine", icon: Clock, permissionModule: "timeMachine" },
      { title: "Milestones", tKey: "milestones", href: "/dashboard/milestones", icon: Milestone, permissionModule: "milestones" },
      { title: "Settings", tKey: "settings", href: "/dashboard/settings", icon: Settings, permissionModule: "settings" },
    ],
  },
];

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

export function Sidebar({ collapsed, setCollapsed }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [user, setUser] = useState<User | null>(null);
  const [mounted, setMounted] = useState(false);
  const { canAccessModule } = usePermissions();
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const { t } = useTranslation();

  useEffect(() => {
    setMounted(true);
    setUser(authStorage.getUser());
    const initial: Record<string, boolean> = {};
    navGroups.forEach((group) => {
      if (group.label) {
        const hasActive = group.items.some(
          (item) => pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))
        );
        initial[group.label] = hasActive;
      }
    });
    setExpandedGroups(initial);
  }, [pathname]);

  const handleLogout = async () => { await logout(); router.push("/login"); };

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const isItemActive = (item: NavItem) =>
    pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));

  const toggleGroup = (label: string) =>
    setExpandedGroups((prev) => ({ ...prev, [label]: !prev[label] }));

  const getFilteredItems = (group: NavGroup): NavItem[] =>
    group.items.filter((item) => !item.permissionModule || canAccessModule(item.permissionModule));

  if (!mounted) return null;

  return (
    <div className={cn(
      "flex flex-col h-full bg-sidebar border-r border-sidebar-border transition-all duration-300 ease-in-out",
      collapsed ? "w-16" : "w-60"
    )}>
      {/* Header */}
      <div className={cn(
        "flex items-center border-b border-sidebar-border h-14 flex-shrink-0",
        collapsed ? "justify-center px-3" : "justify-between px-4"
      )}>
        {!collapsed && (
          <div className="flex items-center gap-2.5 min-w-0">
            <img src="/brand/logo.jpg" alt="Asha Kuteer" className="h-7 w-7 rounded-lg object-cover flex-shrink-0 shadow-sm" data-testid="img-sidebar-logo" />
            <div className="min-w-0">
              <span className="font-bold text-foreground text-sm truncate block">Asha Kuteer</span>
              <span className="text-xs text-muted-foreground truncate block">Foundation</span>
            </div>
          </div>
        )}
        {collapsed && (
          <img src="/brand/logo.jpg" alt="Asha Kuteer" className="h-7 w-7 rounded-lg object-cover shadow-sm" data-testid="img-sidebar-logo-collapsed" />
        )}
        {!collapsed && (
          <button
            onClick={() => setCollapsed(true)}
            className="h-6 w-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex-shrink-0"
            data-testid="button-toggle-sidebar"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Expand button when collapsed */}
      {collapsed && (
        <div className="flex justify-center py-2 border-b border-sidebar-border flex-shrink-0">
          <button
            onClick={() => setCollapsed(false)}
            className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            data-testid="button-expand-sidebar"
          >
            <Menu className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Nav */}
      <ScrollArea className="flex-1 py-3">
        <nav className="px-2 space-y-0.5">
          {navGroups.map((group, groupIdx) => {
            const items = getFilteredItems(group);
            if (items.length === 0) return null;

            /* Pinned items (Dashboard, Daily Actions) */
            if (group.pinned) {
              return (
                <div key={groupIdx} className="mb-2">
                  {items.map((item) => {
                    const active = isItemActive(item);
                    return (
                      <Link key={item.href} href={item.href}>
                        <div
                          className={cn(
                            "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-all cursor-pointer select-none",
                            active
                              ? "bg-orange-500 text-white font-medium shadow-sm shadow-orange-200"
                              : "text-foreground/70 hover:text-foreground hover:bg-muted",
                            collapsed && "justify-center px-2"
                          )}
                          data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, "-")}`}
                        >
                          <item.icon className="h-4 w-4 flex-shrink-0" />
                          {!collapsed && <span className="truncate flex-1">{t(item.tKey)}</span>}
                          {!collapsed && active && <ChevronRight className="ml-auto h-3 w-3 flex-shrink-0 text-orange-200" />}
                        </div>
                      </Link>
                    );
                  })}
                  <div className="mt-2 mx-1 border-t border-sidebar-border" />
                </div>
              );
            }

            /* Collapsed: show icons only */
            if (collapsed) {
              return (
                <div key={groupIdx} className="py-0.5">
                  {items.map((item) => {
                    const active = isItemActive(item);
                    return (
                      <Link key={item.href} href={item.href}>
                        <div
                          className={cn(
                            "flex items-center justify-center rounded-lg p-2 transition-all cursor-pointer",
                            active ? "bg-orange-500 text-white shadow-sm" : "text-foreground/50 hover:text-foreground hover:bg-muted"
                          )}
                          title={t(item.tKey)}
                          data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, "-")}`}
                        >
                          <item.icon className="h-4 w-4" />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              );
            }

            /* Collapsible group */
            const isExpanded = expandedGroups[group.label!] ?? false;
            const hasActive = items.some(isItemActive);

            return (
              <div key={groupIdx} className="pt-1">
                <button
                  onClick={() => toggleGroup(group.label!)}
                  className={cn(
                    "w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer",
                    hasActive ? "text-orange-600" : "text-muted-foreground hover:text-foreground/70"
                  )}
                >
                  <span className="truncate flex-1 text-left">
                    {group.labelKey ? t(group.labelKey) : group.label}
                  </span>
                  <ChevronDown className={cn("h-3 w-3 flex-shrink-0 transition-transform duration-200", isExpanded && "rotate-180")} />
                </button>

                {isExpanded && (
                  <div className="mt-0.5 space-y-0.5 pl-1.5">
                    {items.map((item) => {
                      const active = isItemActive(item);
                      return (
                        <Link key={item.href} href={item.href}>
                          <div
                            className={cn(
                              "flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs transition-all cursor-pointer select-none",
                              active
                                ? "bg-orange-500 text-white font-medium shadow-sm shadow-orange-200"
                                : "text-foreground/60 hover:text-foreground hover:bg-muted"
                            )}
                            data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, "-")}`}
                          >
                            <item.icon className="h-3.5 w-3.5 flex-shrink-0" />
                            <span className="truncate">{t(item.tKey)}</span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className={cn(
        "border-t border-sidebar-border p-2 space-y-1 flex-shrink-0 bg-sidebar",
        collapsed && "flex flex-col items-center"
      )}>
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className={cn(
            "flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer w-full",
            collapsed && "justify-center w-10 px-0"
          )}
          data-testid="button-theme-toggle"
        >
          {theme === "dark" ? <Sun className="h-4 w-4 flex-shrink-0" /> : <Moon className="h-4 w-4 flex-shrink-0" />}
          {!collapsed && <span className="text-xs">{theme === "dark" ? t("light_mode") : t("dark_mode")}</span>}
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-2 py-1.5 w-full text-foreground/70 hover:text-foreground hover:bg-muted transition-colors cursor-pointer",
                collapsed && "justify-center"
              )}
              data-testid="button-user-menu"
            >
              <Avatar className="h-7 w-7 flex-shrink-0">
                <AvatarFallback className="bg-orange-500 text-white text-xs font-semibold">
                  {user ? getInitials(user.name) : "??"}
                </AvatarFallback>
              </Avatar>
              {!collapsed && (
                <div className="flex flex-col items-start text-left min-w-0 flex-1">
                  <span className="text-xs font-semibold text-foreground truncate max-w-[120px]">{user?.name || "User"}</span>
                  <span className="text-xs text-muted-foreground truncate max-w-[120px]">{user?.role || "Role"}</span>
                </div>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56" side="top">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="font-medium">{user?.name}</span>
                <span className="text-xs text-muted-foreground font-normal">{user?.email}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-destructive focus:text-destructive cursor-pointer"
              data-testid="button-logout"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>{t("log_out")}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
