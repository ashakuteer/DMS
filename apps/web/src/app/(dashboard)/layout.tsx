"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authStorage } from "@/lib/auth";
import { Sidebar } from "@/components/sidebar";
import { GlobalSearchTrigger } from "@/components/global-search";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PermissionProvider } from "@/lib/permission-provider";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const user = authStorage.getUser();
    const token = authStorage.getAccessToken();

    if (!user || !token) {
      router.push("/login");
    } else {
      setIsLoading(false);
    }
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <PermissionProvider>
      <TooltipProvider>
        <div className="flex h-screen bg-background">
          <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
          <div className="flex-1 flex flex-col overflow-hidden">
            <header className="shrink-0 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-30">
              <div className="flex items-center gap-4 px-4 py-2 sm:px-6">
                <div className="flex-1 max-w-md">
                  <GlobalSearchTrigger />
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
