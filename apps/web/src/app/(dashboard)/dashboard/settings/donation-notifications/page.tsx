"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, Mail, MessageSquare, Save, AlertCircle, Bell, CalendarHeart, UserCheck } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { fetchWithAuth, authStorage } from "@/lib/auth";
import { canAccessModule } from "@/lib/permissions";
import { AccessDenied } from "@/components/access-denied";

interface DonationNotificationSettings {
  enableDonationEmail: boolean;
  enableDonationWhatsApp: boolean;
  enablePledgeWhatsApp: boolean;
  enableSpecialDayWhatsApp: boolean;
  enableFollowUpWhatsApp: boolean;
  emailConfigured: boolean;
}

export default function DonationNotificationsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<DonationNotificationSettings>({
    enableDonationEmail: true,
    enableDonationWhatsApp: false,
    enablePledgeWhatsApp: false,
    enableSpecialDayWhatsApp: false,
    enableFollowUpWhatsApp: false,
    emailConfigured: false,
  });

  const user = authStorage.getUser();
  const isAdmin = user?.role === "ADMIN";

  useEffect(() => {
    if (!isAdmin) {
      return;
    }
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetchWithAuth("/api/organization-profile/donation-notification-settings");
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to load settings", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetchWithAuth("/api/organization-profile/donation-notification-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enableDonationEmail: settings.enableDonationEmail,
          enableDonationWhatsApp: settings.enableDonationWhatsApp,
          enablePledgeWhatsApp: settings.enablePledgeWhatsApp,
          enableSpecialDayWhatsApp: settings.enableSpecialDayWhatsApp,
          enableFollowUpWhatsApp: settings.enableFollowUpWhatsApp,
        }),
      });
      if (res.ok) {
        toast({ title: "Success", description: "Notification settings saved" });
      } else {
        throw new Error("Failed to save");
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to save settings", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (user && !canAccessModule(user?.role, 'settings')) return <AccessDenied />;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/dashboard/settings")}
          data-testid="button-back-settings"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Notification Settings</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Configure automatic messages for donations, pledges, special days, and follow-ups
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Donation Notifications
          </CardTitle>
          <CardDescription>
            Automatic messages sent when a donation is recorded
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
              <div className="space-y-1">
                <Label htmlFor="email-toggle" className="text-sm font-medium">Email Receipt</Label>
                <p className="text-xs text-muted-foreground">
                  Automatically send a PDF receipt via email to the donor after recording a donation.
                </p>
                {!settings.emailConfigured && settings.enableDonationEmail && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1 mt-1">
                    <AlertCircle className="h-3 w-3" />
                    SMTP not configured. Emails will be queued but not delivered until configured.
                  </p>
                )}
              </div>
            </div>
            <Switch
              id="email-toggle"
              checked={settings.enableDonationEmail}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enableDonationEmail: checked }))}
              data-testid="switch-donation-email"
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <SiWhatsapp className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
              <div className="space-y-1">
                <Label htmlFor="whatsapp-toggle" className="text-sm font-medium">WhatsApp Thank-You</Label>
                <p className="text-xs text-muted-foreground">
                  Automatically send a WhatsApp thank-you message via Twilio Content API when a donation is recorded.
                </p>
              </div>
            </div>
            <Switch
              id="whatsapp-toggle"
              checked={settings.enableDonationWhatsApp}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enableDonationWhatsApp: checked }))}
              data-testid="switch-donation-whatsapp"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <SiWhatsapp className="h-5 w-5 text-green-600" />
            WhatsApp Automation
          </CardTitle>
          <CardDescription>
            Automatic WhatsApp messages for pledges, special days, and follow-ups. Uses Twilio Content API templates.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <Bell className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
              <div className="space-y-1">
                <Label htmlFor="pledge-whatsapp-toggle" className="text-sm font-medium">Pledge Due Reminders</Label>
                <p className="text-xs text-muted-foreground">
                  Automatically send WhatsApp reminders when a pledge is due. Uses the PLEDGE_DUE template.
                </p>
              </div>
            </div>
            <Switch
              id="pledge-whatsapp-toggle"
              checked={settings.enablePledgeWhatsApp}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enablePledgeWhatsApp: checked }))}
              data-testid="switch-pledge-whatsapp"
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <CalendarHeart className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
              <div className="space-y-1">
                <Label htmlFor="specialday-whatsapp-toggle" className="text-sm font-medium">Special Day Wishes</Label>
                <p className="text-xs text-muted-foreground">
                  Automatically send WhatsApp wishes on birthdays, anniversaries, and other special occasions. Uses the SPECIAL_DAY_WISH template.
                </p>
              </div>
            </div>
            <Switch
              id="specialday-whatsapp-toggle"
              checked={settings.enableSpecialDayWhatsApp}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enableSpecialDayWhatsApp: checked }))}
              data-testid="switch-specialday-whatsapp"
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <UserCheck className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
              <div className="space-y-1">
                <Label htmlFor="followup-whatsapp-toggle" className="text-sm font-medium">Follow-Up Reminders</Label>
                <p className="text-xs text-muted-foreground">
                  Automatically send WhatsApp reminders for donor follow-ups. Uses the FOLLOWUP_REMINDER template.
                </p>
              </div>
            </div>
            <Switch
              id="followup-whatsapp-toggle"
              checked={settings.enableFollowUpWhatsApp}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enableFollowUpWhatsApp: checked }))}
              data-testid="switch-followup-whatsapp"
            />
          </div>

          <Separator />

          <div className="rounded-md bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground">
              All WhatsApp messages are sent via Twilio Content API and require approved templates. Messages are tracked with delivery status (queued, sent, delivered, read, failed) and logged in the donor timeline.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} data-testid="button-save-notification-settings">
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Save Settings
        </Button>
      </div>
    </div>
  );
}
