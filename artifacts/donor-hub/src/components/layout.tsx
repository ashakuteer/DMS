import { Link, useLocation } from "wouter";
import { 
  HeartHandshake, LayoutDashboard, Users, CreditCard, 
  Baby, Ribbon, BarChart3, Mail, Clock, Menu 
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarHeader
} from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/theme-toggle"; // We'll create a simple one inline

function AppSidebar() {
  const [location] = useLocation();

  const items = [
    { title: "Dashboard", url: "/", icon: LayoutDashboard },
    { title: "Donors", url: "/donors", icon: Users },
    { title: "Donations", url: "/donations", icon: CreditCard },
    { title: "Beneficiaries", url: "/beneficiaries", icon: Baby },
    { title: "Sponsorships", url: "/sponsorships", icon: Ribbon },
    { title: "Reports", url: "/reports", icon: BarChart3 },
    { title: "Communications", url: "/communications", icon: Mail },
    { title: "Time Machine", url: "/time-machine", icon: Clock },
  ];

  return (
    <Sidebar className="border-r border-border/50 bg-sidebar">
      <SidebarHeader className="h-16 flex items-center px-6 border-b border-border/50">
        <Link href="/" className="flex items-center gap-3 font-display font-bold text-xl text-primary hover:opacity-80 transition-opacity">
          <HeartHandshake className="w-7 h-7" />
          <span>Donor Hub</span>
        </Link>
      </SidebarHeader>
      <SidebarContent className="px-3 py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1.5">
              {items.map((item) => {
                const isActive = location === item.url || (item.url !== "/" && location.startsWith(item.url));
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={isActive}
                      className={`
                        rounded-lg h-10 px-3 transition-all duration-200
                        ${isActive 
                          ? 'bg-primary/10 text-primary font-medium shadow-sm' 
                          : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                        }
                      `}
                    >
                      <Link href={item.url} className="flex items-center gap-3">
                        <item.icon className={`w-5 h-5 ${isActive ? 'text-primary' : 'opacity-70'}`} />
                        <span className="text-[15px]">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "4rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full bg-background overflow-hidden selection:bg-primary/20 selection:text-primary">
        <AppSidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <header className="h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 border-b border-border/50 bg-card/50 backdrop-blur-xl sticky top-0 z-30">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground transition-colors" />
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full border border-border/50">
                <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
                System Active
              </div>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto overflow-x-hidden relative">
            <div className="mx-auto max-w-7xl w-full p-4 sm:p-6 lg:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
