"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { authStorage } from "@/lib/auth";
import { Sidebar } from "@/components/sidebar";
import { GlobalSearchTrigger } from "@/components/global-search";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PermissionProvider } from "@/lib/permission-provider";
import { LanguageSwitcher } from "@/components/language-switcher";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const user = authStorage.getUser();
    const token = authStorage.getAccessToken();

    if (!user || !token) {
      router.push("/login");
      return;
    }

    // HOME_INCHARGE: force-redirect to meals if they land anywhere else
    if (user.role === 'HOME_INCHARGE' && !pathname.startsWith('/dashboard/meals')) {
      router.replace('/dashboard/meals');
      return;
    }

    setIsLoading(false);
  }, [router, pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#5FA8A8", borderTopColor: "transparent" }} />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <PermissionProvider>
      <TooltipProvider>
        <div className="flex h-screen" style={{ background: "#F5F7FA" }}>
          <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
          <div className="flex-1 flex flex-col overflow-hidden">
            <header className="shrink-0 border-b sticky top-0 z-30 h-14" style={{ background: "#ffffff", borderColor: "#E2E8F0" }}>
              <div className="flex items-center gap-4 px-4 h-full sm:px-6">
                <div className="flex-1 max-w-md">
                  <GlobalSearchTrigger />
                </div>
                <div className="ml-auto">
                  <LanguageSwitcher />
                </div>
              </div>
            </header>
            <main className="flex-1 overflow-auto">
              {children}
            </main>
          </div>
        </div>
      </TooltipProvider>
    </PermissionProvider>
  );
}
