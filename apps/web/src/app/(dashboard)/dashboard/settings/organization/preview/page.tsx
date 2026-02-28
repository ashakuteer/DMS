"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { fetchWithAuth, authStorage } from "@/lib/auth";
import { canAccessModule } from "@/lib/permissions";
import { AccessDenied } from "@/components/access-denied";
import { ArrowLeft, Loader2, Phone, Mail, Globe, Home } from "lucide-react";

interface OrganizationProfile {
  id: string;
  name: string;
  tagline1: string;
  tagline2: string;
  logoUrl: string;
  phone1: string;
  phone2: string;
  email: string;
  website: string;
  pan: string;
  section80GText: string;
  homes: string[];
  updatedAt: string;
}

export default function OrganizationPreviewPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<OrganizationProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<{ role: string } | null>(null);

  useEffect(() => {
    const currentUser = authStorage.getUser();
    setUser(currentUser);
  }, []);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const res = await fetchWithAuth("/api/organization-profile");
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      }
    } catch (error) {
      console.error("Failed to load organization profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (user && !canAccessModule(user?.role, 'settings')) {
    return <AccessDenied />;
  }

  if (!profile) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Failed to load organization profile.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => router.push("/dashboard/settings/organization")}
          data-testid="button-back-org-settings"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Organization Preview</h1>
          <p className="text-sm text-muted-foreground">
            Read-only view of your organization profile
          </p>
        </div>
      </div>

      <Card className="max-w-2xl mx-auto border-[#a8d5ba] bg-gradient-to-b from-[#f0f9f4] to-white dark:from-[#1a2e22] dark:to-background">
        <CardContent className="pt-8 pb-6 px-8">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-[#a8d5ba] bg-white flex items-center justify-center shadow-sm">
              <img 
                src="/asha-kuteer-logo.jpg" 
                alt={profile.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
                data-testid="img-org-logo"
              />
            </div>

            <div className="space-y-1">
              <h2 
                className="text-2xl font-bold text-[#2d5a3d] dark:text-[#a8d5ba]"
                data-testid="text-org-name"
              >
                {profile.name}
              </h2>
              <p 
                className="text-base text-[#4a7c5a] dark:text-[#7ab892] italic"
                data-testid="text-org-tagline1"
              >
                {profile.tagline1}
              </p>
              <p 
                className="text-sm text-muted-foreground"
                data-testid="text-org-tagline2"
              >
                {profile.tagline2}
              </p>
            </div>
          </div>

          <Separator className="my-6 bg-[#a8d5ba]/50" />

          <div className="space-y-4">
            <div className="flex items-center gap-2 justify-center">
              <Home className="h-4 w-4 text-[#4a7c5a] dark:text-[#7ab892]" />
              <h3 className="text-sm font-semibold uppercase tracking-wider text-[#4a7c5a] dark:text-[#7ab892]">
                Our Homes
              </h3>
            </div>
            <div className="space-y-2" data-testid="list-org-homes">
              {profile.homes.map((home, index) => (
                <p 
                  key={index} 
                  className="text-center text-sm text-foreground/80"
                  data-testid={`text-home-${index}`}
                >
                  {home}
                </p>
              ))}
            </div>
          </div>

          <Separator className="my-6 bg-[#a8d5ba]/50" />

          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-center text-[#4a7c5a] dark:text-[#7ab892]">
              Contact Details
            </h3>
            <div className="flex flex-col items-center space-y-2 text-sm">
              <div className="flex items-center gap-2 text-foreground/80">
                <Phone className="h-4 w-4 text-[#4a7c5a] dark:text-[#7ab892]" />
                <span data-testid="text-org-phones">
                  {profile.phone1} / {profile.phone2}
                </span>
              </div>
              <div className="flex items-center gap-2 text-foreground/80">
                <Mail className="h-4 w-4 text-[#4a7c5a] dark:text-[#7ab892]" />
                <span data-testid="text-org-email">{profile.email}</span>
              </div>
              <div className="flex items-center gap-2 text-foreground/80">
                <Globe className="h-4 w-4 text-[#4a7c5a] dark:text-[#7ab892]" />
                <span data-testid="text-org-website">{profile.website}</span>
              </div>
            </div>
          </div>

          <Separator className="my-6 bg-[#a8d5ba]/50" />

          <div className="text-center space-y-1">
            <p 
              className="text-xs text-muted-foreground"
              data-testid="text-org-pan"
            >
              PAN: {profile.pan}
            </p>
            <p 
              className="text-xs text-muted-foreground"
              data-testid="text-org-80g"
            >
              {profile.section80GText}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
