"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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
  LayoutDashboard,
  Users,
  Heart,
  IndianRupee,
  HandHeart,
  FileText,
  Settings,
  LogOut,
  ChevronLeft,
  Menu,
  Moon,
  Sun,
  UserCog,
  MessageSquareText,
  Bell,
  Inbox,
  BarChart3,
  Megaphone,
  Radio,
  PresentationIcon,
  Target,
  TrendingUp,
  Milestone,
  ShieldCheck,
  DatabaseBackup,
  Cake,
  Send,
  FileBarChart,
  ClipboardList,
  Building2,
  ArrowUpRight,
  FolderLock,
  Lock,
  Repeat,
  ListChecks,
  Phone,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  permissionModule?: string;
}

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    permissionModule: "dashboard",
  },
  {
    title: "Daily Actions",
    href: "/dashboard/daily-actions",
    icon: Inbox,
    permissionModule: "dailyActions",
  },
  {
    title: "Donors",
    href: "/dashboard/donors",
    icon: Users,
    permissionModule: "donors",
  },
  {
    title: "Donations",
    href: "/dashboard/donations",
    icon: IndianRupee,
    permissionModule: "donations",
  },
  {
    title: "Beneficiaries",
    href: "/dashboard/beneficiaries",
    icon: HandHeart,
    permissionModule: "beneficiaries",
  },
  {
    title: "Campaigns",
    href: "/dashboard/campaigns",
    icon: Target,
    permissionModule: "campaigns",
  },
  {
    title: "Birthday Wishes",
    href: "/dashboard/birthday-wishes",
    icon: Cake,
    permissionModule: "birthdayWishes",
  },
  {
    title: "Donor Updates",
    href: "/dashboard/donor-updates",
    icon: Send,
    permissionModule: "donorUpdates",
  },
  {
    title: "Broadcasting",
    href: "/dashboard/broadcasting",
    icon: Radio,
    permissionModule: "broadcasting",
  },
  {
    title: "Reminders",
    href: "/dashboard/reminders",
    icon: Bell,
    permissionModule: "reminders",
  },
  {
    title: "Follow-ups",
    href: "/dashboard/follow-ups",
    icon: ArrowUpRight,
    permissionModule: "followUps",
  },
  {
    title: "Impact Dashboard",
    href: "/dashboard/impact",
    icon: TrendingUp,
    permissionModule: "impact",
  },
  {
    title: "Retention Analytics",
    href: "/dashboard/retention",
    icon: Repeat,
    permissionModule: "retention",
  },
  {
    title: "Staff & Tasks",
    href: "/dashboard/staff-tasks",
    icon: ListChecks,
    permissionModule: "staffTasks",
  },
  {
    title: "Management",
    href: "/dashboard/management",
    icon: PresentationIcon,
    permissionModule: "management",
  },
  {
    title: "Analytics",
    href: "/dashboard/analytics",
    icon: BarChart3,
    permissionModule: "analytics",
  },
  {
    title: "Reports",
    href: "/dashboard/reports",
    icon: FileText,
    permissionModule: "reports",
  },
  {
    title: "Report Campaigns",
    href: "/dashboard/report-campaigns",
    icon: Megaphone,
    permissionModule: "reportCampaigns",
  },
  {
    title: "Donor Reports",
    href: "/dashboard/donor-reports",
    icon: FileBarChart,
    permissionModule: "donorReports",
  },
  {
    title: "Progress Reports",
    href: "/dashboard/progress-reports",
    icon: ClipboardList,
    permissionModule: "progressReports",
  },
  {
    title: "Home Summary",
    href: "/dashboard/home-summary",
    icon: Building2,
    permissionModule: "homeSummary",
  },
  {
    title: "Document Vault",
    href: "/dashboard/ngo-documents",
    icon: FolderLock,
    permissionModule: "ngoDocuments",
  },
  {
    title: "Milestones",
    href: "/dashboard/milestones",
    icon: Milestone,
    permissionModule: "milestones",
  },
  {
    title: "Users",
    href: "/dashboard/users",
    icon: UserCog,
    permissionModule: "users",
  },
  {
    title: "Staff Contacts",
    href: "/dashboard/staff-management",
    icon: Phone,
    permissionModule: "users",
  },
  {
    title: "Permissions",
    href: "/dashboard/permissions",
    icon: Lock,
    permissionModule: "permissions",
  },
  {
    title: "Audit Log",
    href: "/dashboard/audit-log",
    icon: ShieldCheck,
    permissionModule: "auditLog",
  },
  {
    title: "Backup & Restore",
    href: "/dashboard/backup",
    icon: DatabaseBackup,
    permissionModule: "backup",
  },
  {
    title: "Templates",
    href: "/dashboard/settings/templates",
    icon: MessageSquareText,
    permissionModule: "templates",
  },
  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
    permissionModule: "settings",
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

  useEffect(() => {
    setMounted(true);
    setUser(authStorage.getUser());
  }, []);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const filteredNavItems = navItems.filter((item) => {
    if (!item.permissionModule) return true;
    return canAccessModule(item.permissionModule);
  });

  if (!mounted) return null;

  return (
    <div
      className={cn(
        "flex flex-col h-full bg-sidebar border-r border-sidebar-border transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
        {!collapsed ? (
          <div className="flex items-center gap-2">
            <img
              src="/brand/logo.jpg"
              alt="Asha Kuteer"
              className="h-8 w-8 rounded object-cover"
              data-testid="img-sidebar-logo"
            />
            <span className="font-bold text-sidebar-foreground">Asha Kuteer</span>
          </div>
        ) : (
          <img
            src="/brand/logo.jpg"
            alt="Asha Kuteer"
            className="h-8 w-8 rounded object-cover"
            data-testid="img-sidebar-logo-collapsed"
          />
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="text-sidebar-foreground hover:bg-sidebar-accent"
          data-testid="button-toggle-sidebar"
        >
          {collapsed ? <Menu className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </Button>
      </div>

      <ScrollArea className="flex-1 py-4">
        <nav className="space-y-1 px-2">
          {filteredNavItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    isActive && "bg-sidebar-accent text-sidebar-accent-foreground",
                    collapsed && "justify-center px-2"
                  )}
                  data-testid={`nav-${item.title.toLowerCase()}`}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  {!collapsed && <span>{item.title}</span>}
                </Button>
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      <div className="p-2 border-t border-sidebar-border">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className={cn(
            "text-sidebar-foreground hover:bg-sidebar-accent mb-2",
            collapsed ? "w-full" : "ml-2"
          )}
          data-testid="button-theme-toggle"
        >
          {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent",
                collapsed && "justify-center px-2"
              )}
              data-testid="button-user-menu"
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {user ? getInitials(user.name) : "??"}
                </AvatarFallback>
              </Avatar>
              {!collapsed && (
                <div className="flex flex-col items-start text-left">
                  <span className="text-sm font-medium truncate max-w-[140px]">
                    {user?.name || "User"}
                  </span>
                  <span className="text-xs text-muted-foreground">{user?.role || "Role"}</span>
                </div>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span>{user?.name}</span>
                <span className="text-xs text-muted-foreground">{user?.email}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-destructive focus:text-destructive cursor-pointer"
              data-testid="button-logout"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
