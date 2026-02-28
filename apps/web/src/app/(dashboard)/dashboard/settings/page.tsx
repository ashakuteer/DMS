"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings, Building, Bell, Shield, MessageSquare, ChevronRight, Mail, Inbox, Send } from "lucide-react";
import { authStorage } from "@/lib/auth";
import { canAccessModule } from "@/lib/permissions";
import { AccessDenied } from "@/components/access-denied";

export default function SettingsPage() {
  const user = authStorage.getUser();
  const isAdmin = user?.role === "ADMIN";

  if (user && !canAccessModule(user?.role, 'settings')) return <AccessDenied />;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Configure system settings
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {isAdmin && (
          <Link href="/dashboard/settings/organization" data-testid="link-org-settings">
            <Card className="hover-elevate cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">Organization Profile</CardTitle>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
                <CardDescription>
                  NGO details, branding, and tax information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Manage organization name, logo, contact details, PAN, 80G text, and home locations. These values are used across receipts, emails, and templates.
                </p>
                <Badge variant="secondary" className="mt-3">Admin Only</Badge>
              </CardContent>
            </Card>
          </Link>
        )}

        <Link href="/dashboard/settings/templates" data-testid="link-template-settings">
          <Card className="hover-elevate cursor-pointer h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Communication Templates</CardTitle>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
              <CardDescription>
                Email and WhatsApp message templates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Configure default templates for thank you messages, follow-ups, reminders, and festival greetings.
              </p>
            </CardContent>
          </Card>
        </Link>

        {isAdmin && (
          <Link href="/dashboard/settings/email" data-testid="link-email-settings">
            <Card className="hover-elevate cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mail className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">Email Settings</CardTitle>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
                <CardDescription>
                  SMTP configuration for automated emails
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Configure SMTP settings, enable/disable auto-emails for reminders, and test email delivery.
                </p>
                <Badge variant="secondary" className="mt-3">Admin Only</Badge>
              </CardContent>
            </Card>
          </Link>
        )}

        {isAdmin && (
          <Link href="/dashboard/settings/donation-notifications" data-testid="link-donation-notifications">
            <Card className="hover-elevate cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Send className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">Donation Notifications</CardTitle>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
                <CardDescription>
                  Auto-send email and WhatsApp on donation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Enable or disable automatic email receipts and WhatsApp thank-you messages when a donation is recorded.
                </p>
                <Badge variant="secondary" className="mt-3">Admin Only</Badge>
              </CardContent>
            </Card>
          </Link>
        )}

        {isAdmin && (
          <Link href="/dashboard/settings/email-jobs" data-testid="link-email-jobs">
            <Card className="hover-elevate cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Inbox className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">Email Queue</CardTitle>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
                <CardDescription>
                  View and manage queued emails
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Monitor automated email queue, view sent/failed emails, and retry failed deliveries.
                </p>
                <Badge variant="secondary" className="mt-3">Admin Only</Badge>
              </CardContent>
            </Card>
          </Link>
        )}

        <Card className="opacity-60">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Notifications</CardTitle>
            </div>
            <CardDescription>
              Push notification settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-16 text-muted-foreground text-sm">
              Coming soon
            </div>
          </CardContent>
        </Card>

        <Card className="opacity-60">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Security</CardTitle>
            </div>
            <CardDescription>
              Password and access settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-16 text-muted-foreground text-sm">
              Coming soon
            </div>
          </CardContent>
        </Card>

        <Card className="opacity-60">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">System</CardTitle>
            </div>
            <CardDescription>
              Backup and maintenance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-16 text-muted-foreground text-sm">
              Coming soon
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
