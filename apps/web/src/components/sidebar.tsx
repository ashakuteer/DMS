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
  ChevronRight, MessageSquarePlus, Banknote, CalendarOff, ClipboardCheck,
  AlertTriangle, Trophy,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

const SIDEBAR_BG = "#2F3E46";
const TEXT_DEFAULT = "#94A3B8";
const TEXT_ACTIVE = "#ffffff";
const TEAL = "#5FA8A8";
const ACTIVE_BG = "rgba(95,168,168,0.15)";
const ACTIVE_BORDER = `4px solid ${TEAL}`;
const HOVER_BG = "rgba(255,255,255,0.06)";
const BORDER_COLOR = "rgba(255,255,255,0.08)";
const GROUP_LABEL_COLOR = "rgba(148,163,184,0.55)";

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
      { title: "Dashboard", tKey: "nav.dashboard", href: "/dashboard", icon: LayoutDashboard, permissionModule: "dashboard" },
      { title: "Daily Actions", tKey: "nav.daily_actions", href: "/dashboard/daily-actions", icon: Inbox, permissionModule: "dailyActions" },
    ],
  },
  {
    label: "Core",
    labelKey: "nav.group_core",
    items: [
      { title: "Donors", tKey: "nav.donors", href: "/dashboard/donors", icon: Users, permissionModule: "donors" },
      { title: "Donations", tKey: "nav.donations", href: "/dashboard/donations", icon: IndianRupee, permissionModule: "donations" },
      { title: "Beneficiaries", tKey: "nav.beneficiaries", href: "/dashboard/beneficiaries", icon: HandHeart, permissionModule: "beneficiaries" },
      { title: "Campaigns", tKey: "nav.campaigns", href: "/dashboard/campaigns", icon: Target, permissionModule: "campaigns" },
    ],
  },
  {
    label: "Reports & Analytics",
    labelKey: "nav.group_reports_analytics",
    items: [
      { title: "Analytics", tKey: "nav.analytics", href: "/dashboard/analytics", icon: BarChart3, permissionModule: "analytics" },
      { title: "Impact Dashboard", tKey: "nav.impact_dashboard", href: "/dashboard/impact", icon: TrendingUp, permissionModule: "impact" },
      { title: "Retention", tKey: "nav.retention", href: "/dashboard/retention", icon: Repeat, permissionModule: "retention" },
      { title: "Reports", tKey: "nav.reports", href: "/dashboard/reports", icon: FileText, permissionModule: "reports" },
      { title: "Donor Reports", tKey: "nav.donor_reports", href: "/dashboard/donor-reports", icon: FileBarChart, permissionModule: "donorReports" },
      { title: "Report Campaigns", tKey: "nav.report_campaigns", href: "/dashboard/report-campaigns", icon: Megaphone, permissionModule: "reportCampaigns" },
      { title: "Progress Reports", tKey: "nav.progress_reports", href: "/dashboard/progress-reports", icon: ClipboardList, permissionModule: "progressReports" },
      { title: "Home Summary", tKey: "nav.home_summary", href: "/dashboard/home-summary", icon: Building2, permissionModule: "homeSummary" },
    ],
  },
  {
    label: "Communication",
    labelKey: "nav.group_communication",
    items: [
      { title: "Send Message", tKey: "nav.send_message", href: "/dashboard/send-message", icon: MessageSquarePlus, permissionModule: "broadcasting" },
      { title: "Templates", tKey: "nav.templates", href: "/dashboard/comm-templates", icon: MessageSquareText, permissionModule: "templates" },
      { title: "Broadcasting", tKey: "nav.broadcasting", href: "/dashboard/broadcasting", icon: Radio, permissionModule: "broadcasting" },
      { title: "Donor Updates", tKey: "nav.donor_updates", href: "/dashboard/donor-updates", icon: Send, permissionModule: "donorUpdates" },
      { title: "Birthday Wishes", tKey: "nav.birthday_wishes", href: "/dashboard/birthday-wishes", icon: Cake, permissionModule: "birthdayWishes" },
      { title: "Reminders", tKey: "nav.reminders", href: "/dashboard/reminders", icon: Bell, permissionModule: "reminders" },
      { title: "Follow-ups", tKey: "nav.follow_ups", href: "/dashboard/follow-ups", icon: ArrowUpRight, permissionModule: "followUps" },
    ],
  },
  {
    label: "Staff",
    labelKey: "nav.group_staff",
    items: [
      { title: "Staff Profiles", tKey: "nav.staff_profiles", href: "/dashboard/staff-profiles", icon: Users, permissionModule: "users" },
      { title: "Staff Salary", tKey: "nav.staff_salary", href: "/dashboard/salary", icon: Banknote, permissionModule: "users" },
      { title: "Staff Leaves", tKey: "nav.staff_leaves", href: "/dashboard/leaves", icon: CalendarOff, permissionModule: "users" },
      { title: "Attendance", tKey: "nav.attendance", href: "/dashboard/attendance", icon: ClipboardCheck, permissionModule: "users" },
      { title: "Staff & Tasks", tKey: "nav.staff_tasks", href: "/dashboard/staff-tasks", icon: ListChecks, permissionModule: "staffTasks" },
      { title: "Daily Checklist", tKey: "nav.daily_checklist", href: "/dashboard/daily-checklist", icon: ClipboardList, permissionModule: "staffTasks" },
      { title: "Missed Tasks", tKey: "nav.missed_tasks", href: "/dashboard/missed-tasks", icon: AlertTriangle, permissionModule: "staffTasks" },
      { title: "Performance", tKey: "nav.performance", href: "/dashboard/performance", icon: Trophy, permissionModule: "staffTasks" },
      { title: "Staff Contacts", tKey: "nav.staff_contacts", href: "/dashboard/staff-management", icon: Phone, permissionModule: "users" },
    ],
  },
  {
    label: "Admin Tools",
    labelKey: "nav.group_admin_tools",
    items: [
      { title: "Users", tKey: "nav.users", href: "/dashboard/users", icon: UserCog, permissionModule: "users" },
      { title: "Permissions", tKey: "nav.permissions", href: "/dashboard/permissions", icon: Lock, permissionModule: "permissions" },
      { title: "Document Vault", tKey: "nav.document_vault", href: "/dashboard/ngo-documents", icon: FolderLock, permissionModule: "ngoDocuments" },
      { title: "Audit Log", tKey: "nav.audit_log", href: "/dashboard/audit-log", icon: ShieldCheck, permissionModule: "auditLog" },
      { title: "Backup & Restore", tKey: "nav.backup_restore", href: "/dashboard/backup", icon: DatabaseBackup, permissionModule: "backup" },
      { title: "Archive", tKey: "nav.archive", href: "/dashboard/admin/archive", icon: ArchiveRestore, permissionModule: "archive" },
    ],
  },
  {
    label: "System",
    labelKey: "nav.group_system",
    items: [
      { title: "Time Machine", tKey: "nav.time_machine", href: "/dashboard/time-machine", icon: Clock, permissionModule: "timeMachine" },
      { title: "Milestones", tKey: "nav.milestones", href: "/dashboard/milestones", icon: Milestone, permissionModule: "milestones" },
      { title: "Settings", tKey: "nav.settings", href: "/dashboard/settings", icon: Settings, permissionModule: "settings" },
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
    <div
      className={cn(
        "flex flex-col h-full transition-all duration-300 ease-in-out",
        collapsed ? "w-16" : "w-60"
      )}
      style={{ background: SIDEBAR_BG, borderRight: `1px solid ${BORDER_COLOR}` }}
    >
      {/* Header */}
      <div
        className={cn(
          "flex items-center h-14 flex-shrink-0",
          collapsed ? "justify-center px-3" : "justify-between px-4"
        )}
        style={{ borderBottom: `1px solid ${BORDER_COLOR}` }}
      >
        {!collapsed && (
          <div className="flex items-center gap-2.5 min-w-0">
            <img src="/brand/logo.jpg" alt="Asha Kuteer" className="h-7 w-7 rounded-lg object-cover flex-shrink-0 shadow-sm" data-testid="img-sidebar-logo" />
            <div className="min-w-0">
              <span className="font-bold text-sm truncate block" style={{ color: TEXT_ACTIVE }}>Asha Kuteer</span>
              <span className="text-xs truncate block" style={{ color: TEXT_DEFAULT }}>Foundation</span>
            </div>
          </div>
        )}
        {collapsed && (
          <img src="/brand/logo.jpg" alt="Asha Kuteer" className="h-7 w-7 rounded-lg object-cover shadow-sm" data-testid="img-sidebar-logo-collapsed" />
        )}
        {!collapsed && (
          <button
            onClick={() => setCollapsed(true)}
            className="h-6 w-6 rounded-md flex items-center justify-center transition-colors flex-shrink-0"
            style={{ color: TEXT_DEFAULT }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = HOVER_BG; (e.currentTarget as HTMLElement).style.color = TEXT_ACTIVE; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = TEXT_DEFAULT; }}
            data-testid="button-toggle-sidebar"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Expand button when collapsed */}
      {collapsed && (
        <div className="flex justify-center py-2 flex-shrink-0" style={{ borderBottom: `1px solid ${BORDER_COLOR}` }}>
          <button
            onClick={() => setCollapsed(false)}
            className="h-7 w-7 rounded-lg flex items-center justify-center transition-colors"
            style={{ color: TEXT_DEFAULT }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = HOVER_BG; (e.currentTarget as HTMLElement).style.color = TEXT_ACTIVE; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = TEXT_DEFAULT; }}
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

            /* Pinned items */
            if (group.pinned) {
              return (
                <div key={groupIdx} className="mb-2">
                  {items.map((item) => {
                    const active = isItemActive(item);
                    return (
                      <Link key={item.href} href={item.href}>
                        <div
                          className={cn(
                            "flex items-center gap-2.5 px-2.5 py-2 text-sm transition-all cursor-pointer select-none rounded-lg",
                            collapsed && "justify-center px-2"
                          )}
                          style={
                            active
                              ? {
                                  background: ACTIVE_BG,
                                  borderLeft: collapsed ? "none" : ACTIVE_BORDER,
                                  paddingLeft: collapsed ? undefined : "calc(0.625rem - 4px)",
                                  color: TEXT_ACTIVE,
                                  fontWeight: 500,
                                }
                              : { color: TEXT_DEFAULT }
                          }
                          onMouseEnter={e => {
                            if (!active) (e.currentTarget as HTMLElement).style.background = HOVER_BG;
                          }}
                          onMouseLeave={e => {
                            if (!active) (e.currentTarget as HTMLElement).style.background = "transparent";
                          }}
                          data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, "-")}`}
                        >
                          <item.icon
                            className="h-4 w-4 flex-shrink-0"
                            style={{ color: active ? TEAL : TEXT_DEFAULT }}
                          />
                          {!collapsed && <span className="truncate flex-1">{t(item.tKey)}</span>}
                          {!collapsed && active && (
                            <ChevronRight className="ml-auto h-3 w-3 flex-shrink-0" style={{ color: TEAL }} />
                          )}
                        </div>
                      </Link>
                    );
                  })}
                  <div className="mt-2 mx-1" style={{ borderTop: `1px solid ${BORDER_COLOR}` }} />
                </div>
              );
            }

            /* Collapsed: icons only */
            if (collapsed) {
              return (
                <div key={groupIdx} className="py-0.5">
                  {items.map((item) => {
                    const active = isItemActive(item);
                    return (
                      <Link key={item.href} href={item.href}>
                        <div
                          className="flex items-center justify-center rounded-lg p-2 transition-all cursor-pointer"
                          style={
                            active
                              ? { background: ACTIVE_BG, color: TEXT_ACTIVE }
                              : { color: TEXT_DEFAULT }
                          }
                          onMouseEnter={e => {
                            if (!active) (e.currentTarget as HTMLElement).style.background = HOVER_BG;
                          }}
                          onMouseLeave={e => {
                            if (!active) (e.currentTarget as HTMLElement).style.background = "transparent";
                          }}
                          title={t(item.tKey)}
                          data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, "-")}`}
                        >
                          <item.icon
                            className="h-4 w-4"
                            style={{ color: active ? TEAL : TEXT_DEFAULT }}
                          />
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
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
                  style={{ color: hasActive ? TEAL : GROUP_LABEL_COLOR }}
                  onMouseEnter={e => {
                    if (!hasActive) (e.currentTarget as HTMLElement).style.color = TEXT_DEFAULT;
                  }}
                  onMouseLeave={e => {
                    if (!hasActive) (e.currentTarget as HTMLElement).style.color = GROUP_LABEL_COLOR;
                  }}
                >
                  <span className="truncate flex-1 text-left">
                    {group.labelKey ? t(group.labelKey) : group.label}
                  </span>
                  <ChevronDown
                    className={cn("h-3 w-3 flex-shrink-0 transition-transform duration-200", isExpanded && "rotate-180")}
                  />
                </button>

                {isExpanded && (
                  <div className="mt-0.5 space-y-0.5 pl-1.5">
                    {items.map((item) => {
                      const active = isItemActive(item);
                      return (
                        <Link key={item.href} href={item.href}>
                          <div
                            className="flex items-center gap-2.5 px-2.5 py-1.5 text-xs transition-all cursor-pointer select-none rounded-lg"
                            style={
                              active
                                ? {
                                    background: ACTIVE_BG,
                                    borderLeft: ACTIVE_BORDER,
                                    paddingLeft: "calc(0.625rem - 4px)",
                                    color: TEXT_ACTIVE,
                                    fontWeight: 500,
                                  }
                                : { color: TEXT_DEFAULT }
                            }
                            onMouseEnter={e => {
                              if (!active) (e.currentTarget as HTMLElement).style.background = HOVER_BG;
                            }}
                            onMouseLeave={e => {
                              if (!active) (e.currentTarget as HTMLElement).style.background = "transparent";
                            }}
                            data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, "-")}`}
                          >
                            <item.icon
                              className="h-3.5 w-3.5 flex-shrink-0"
                              style={{ color: active ? TEAL : TEXT_DEFAULT }}
                            />
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
      <div
        className={cn(
          "p-2 space-y-1 flex-shrink-0",
          collapsed && "flex flex-col items-center"
        )}
        style={{ borderTop: `1px solid ${BORDER_COLOR}`, background: SIDEBAR_BG }}
      >
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className={cn(
            "flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm transition-colors cursor-pointer w-full",
            collapsed && "justify-center w-10 px-0"
          )}
          style={{ color: TEXT_DEFAULT }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = HOVER_BG; (e.currentTarget as HTMLElement).style.color = TEXT_ACTIVE; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = TEXT_DEFAULT; }}
          data-testid="button-theme-toggle"
        >
          {theme === "dark" ? <Sun className="h-4 w-4 flex-shrink-0" /> : <Moon className="h-4 w-4 flex-shrink-0" />}
          {!collapsed && <span className="text-xs">{theme === "dark" ? t("nav.light_mode") : t("nav.dark_mode")}</span>}
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-2 py-1.5 w-full transition-colors cursor-pointer",
                collapsed && "justify-center"
              )}
              style={{ color: TEXT_DEFAULT }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = HOVER_BG; (e.currentTarget as HTMLElement).style.color = TEXT_ACTIVE; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = TEXT_DEFAULT; }}
              data-testid="button-user-menu"
            >
              <Avatar className="h-7 w-7 flex-shrink-0">
                <AvatarFallback className="text-white text-xs font-semibold" style={{ background: TEAL }}>
                  {user ? getInitials(user.name) : "??"}
                </AvatarFallback>
              </Avatar>
              {!collapsed && (
                <div className="flex flex-col items-start text-left min-w-0 flex-1">
                  <span className="text-xs font-semibold truncate max-w-[120px]" style={{ color: TEXT_ACTIVE }}>{user?.name || "User"}</span>
                  <span className="text-xs truncate max-w-[120px]" style={{ color: TEXT_DEFAULT }}>{user?.role || "Role"}</span>
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
              <span>{t("nav.log_out")}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
