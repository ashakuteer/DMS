"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Loader2, Phone, Mail, Globe, Home } from "lucide-react";

interface PublicOrganizationProfile {
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
}

export default function PublicOrganizationPage() {
  const [profile, setProfile] = useState<PublicOrganizationProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/organization-profile/public");
      if (res.ok) {
        const data = await res.json();
        if (data) {
          setProfile(data);
        } else {
          setError("Organization profile not configured");
        }
      } else {
        setError("Organization profile not configured");
      }
    } catch (err) {
      setError("Organization profile not configured");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#f0f9f4] to-white">
        <Loader2 className="h-8 w-8 animate-spin text-[#4a7c5a]" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#f0f9f4] to-white">
        <Card className="max-w-md mx-4 border-[#a8d5ba]">
          <CardContent className="pt-6 text-center">
            <p className="text-[#4a7c5a]" data-testid="text-error-message">
              {error || "Organization profile not configured"}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f0f9f4] to-white py-8 px-4">
      <Card className="max-w-2xl mx-auto border-[#a8d5ba] shadow-sm">
        <CardContent className="pt-8 pb-6 px-6 sm:px-8">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-2 border-[#a8d5ba] bg-white flex items-center justify-center shadow-sm">
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

            <div className="space-y-2">
              <h1 
                className="text-2xl sm:text-3xl font-bold text-[#2d5a3d]"
                data-testid="text-org-name"
              >
                {profile.name}
              </h1>
              <p 
                className="text-base sm:text-lg text-[#4a7c5a] italic"
                data-testid="text-org-tagline1"
              >
                {profile.tagline1}
              </p>
              <p 
                className="text-sm text-[#6b8f7a]"
                data-testid="text-org-tagline2"
              >
                {profile.tagline2}
              </p>
            </div>
          </div>

          <Separator className="my-6 bg-[#a8d5ba]/50" />

          <div className="space-y-4">
            <div className="flex items-center gap-2 justify-center">
              <Home className="h-4 w-4 text-[#4a7c5a]" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-[#4a7c5a]">
                Our Homes
              </h2>
            </div>
            <div className="space-y-2" data-testid="list-org-homes">
              {profile.homes.map((home, index) => (
                <p 
                  key={index} 
                  className="text-center text-sm text-[#3d6b4d]"
                  data-testid={`text-home-${index}`}
                >
                  {home}
                </p>
              ))}
            </div>
          </div>

          <Separator className="my-6 bg-[#a8d5ba]/50" />

          <div className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-center text-[#4a7c5a]">
              Contact Details
            </h2>
            <div className="flex flex-col items-center space-y-3 text-sm">
              <div className="flex items-center gap-2 text-[#3d6b4d]">
                <Phone className="h-4 w-4 text-[#4a7c5a]" />
                <span data-testid="text-org-phones">
                  {profile.phone1} / {profile.phone2}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[#3d6b4d]">
                <Mail className="h-4 w-4 text-[#4a7c5a]" />
                <a 
                  href={`mailto:${profile.email}`}
                  className="hover:underline"
                  data-testid="text-org-email"
                >
                  {profile.email}
                </a>
              </div>
              <div className="flex items-center gap-2 text-[#3d6b4d]">
                <Globe className="h-4 w-4 text-[#4a7c5a]" />
                <a 
                  href={`https://${profile.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                  data-testid="text-org-website"
                >
                  {profile.website}
                </a>
              </div>
            </div>
          </div>

          <Separator className="my-6 bg-[#a8d5ba]/50" />

          <div className="text-center space-y-1">
            <p 
              className="text-xs text-[#6b8f7a]"
              data-testid="text-org-pan"
            >
              PAN: {profile.pan}
            </p>
            <p 
              className="text-xs text-[#6b8f7a]"
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
