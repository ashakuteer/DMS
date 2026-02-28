"use client";

import { ShieldX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function AccessDenied() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6" data-testid="access-denied">
      <ShieldX className="h-16 w-16 text-destructive mb-4" />
      <h2 className="text-2xl font-bold text-foreground mb-2">Access Denied</h2>
      <p className="text-muted-foreground text-center max-w-md mb-6">
        You do not have permission to access this page. Please contact your administrator if you believe this is an error.
      </p>
      <Button onClick={() => router.push("/dashboard")} data-testid="button-go-dashboard">
        Go to Dashboard
      </Button>
    </div>
  );
}
