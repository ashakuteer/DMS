"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, Send, CheckCircle, XCircle } from "lucide-react";
import { authStorage } from "@/lib/auth";
import { canAccessModule } from "@/lib/permissions";
import { AccessDenied } from "@/components/access-denied";

interface EmailSettings {
  enableAutoEmail: boolean;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpSecureTls: boolean;
  emailFromName: string;
  emailFromEmail: string;
  hasPassword: boolean;
}

export default function EmailSettingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const user = authStorage.getUser();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  
  const [settings, setSettings] = useState<EmailSettings>({
    enableAutoEmail: false,
    smtpHost: "",
    smtpPort: 587,
    smtpUser: "",
    smtpSecureTls: true,
    emailFromName: "",
    emailFromEmail: "",
    hasPassword: false,
  });
  const [smtpPass, setSmtpPass] = useState("");

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      const token = authStorage.getAccessToken();
      const res = await fetch("/api/organization-profile/email-settings", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSettings({
          enableAutoEmail: data.enableAutoEmail || false,
          smtpHost: data.smtpHost || "",
          smtpPort: data.smtpPort || 587,
          smtpUser: data.smtpUser || "",
          smtpSecureTls: data.smtpSecureTls ?? true,
          emailFromName: data.emailFromName || "",
          emailFromEmail: data.emailFromEmail || "",
          hasPassword: data.hasPassword || false,
        });
      }
    } catch (error) {
      toast({ title: "Error loading settings", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const token = authStorage.getAccessToken();
      const payload: any = { ...settings };
      if (smtpPass) {
        payload.smtpPass = smtpPass;
      }
      delete payload.hasPassword;

      const res = await fetch("/api/organization-profile/email-settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      
      if (res.ok && data.success) {
        toast({ title: "Email settings saved successfully" });
        setSmtpPass("");
        // Update local settings with returned values
        setSettings({
          enableAutoEmail: data.enableAutoEmail || false,
          smtpHost: data.smtpHost || "",
          smtpPort: data.smtpPort || 587,
          smtpUser: data.smtpUser || "",
          smtpSecureTls: data.smtpSecureTls ?? true,
          emailFromName: data.emailFromName || "",
          emailFromEmail: data.emailFromEmail || "",
          hasPassword: data.hasPassword || false,
        });
      } else {
        toast({ title: data.message || data.error || "Failed to save settings", variant: "destructive" });
      }
    } catch (error: any) {
      toast({ title: error.message || "Error saving settings", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function handleTestEmail() {
    if (!testEmail) {
      toast({ title: "Please enter a test email address", variant: "destructive" });
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      const token = authStorage.getAccessToken();
      const res = await fetch("/api/organization-profile/test-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ testEmail }),
      });
      const data = await res.json();
      setTestResult({
        success: data.success,
        message: data.success ? "Test email sent successfully!" : data.error || "Failed to send test email",
      });
      if (data.success) {
        toast({ title: "Test email sent!" });
      } else {
        toast({ title: data.error || "Failed to send test email", variant: "destructive" });
      }
    } catch (error) {
      setTestResult({ success: false, message: "Failed to send test email" });
      toast({ title: "Error sending test email", variant: "destructive" });
    } finally {
      setTesting(false);
    }
  }

  if (user && !canAccessModule(user?.role, 'settings')) return <AccessDenied />;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard/settings")} data-testid="button-back">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Email Settings</h1>
          <p className="text-muted-foreground mt-1">Configure SMTP for automated reminder emails</p>
        </div>
      </div>

      <div className="grid gap-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Auto Email</CardTitle>
            <CardDescription>Enable or disable automatic email sending for reminders</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Enable Auto Email</p>
                <p className="text-sm text-muted-foreground">
                  When enabled, emails will be automatically sent for upcoming special days and pledge reminders.
                </p>
              </div>
              <Switch
                checked={settings.enableAutoEmail}
                onCheckedChange={(checked) => setSettings({ ...settings, enableAutoEmail: checked })}
                data-testid="switch-enable-auto-email"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>SMTP Configuration</CardTitle>
            <CardDescription>Configure your email server settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="smtpHost">SMTP Host</Label>
                <Input
                  id="smtpHost"
                  placeholder="smtp.gmail.com"
                  value={settings.smtpHost}
                  onChange={(e) => setSettings({ ...settings, smtpHost: e.target.value })}
                  data-testid="input-smtp-host"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="smtpPort">SMTP Port</Label>
                <Input
                  id="smtpPort"
                  type="number"
                  placeholder="587"
                  value={settings.smtpPort}
                  onChange={(e) => setSettings({ ...settings, smtpPort: parseInt(e.target.value) || 587 })}
                  data-testid="input-smtp-port"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="smtpUser">SMTP Username</Label>
                <Input
                  id="smtpUser"
                  placeholder="your-email@gmail.com"
                  value={settings.smtpUser}
                  onChange={(e) => setSettings({ ...settings, smtpUser: e.target.value })}
                  data-testid="input-smtp-user"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="smtpPass">SMTP Password</Label>
                <Input
                  id="smtpPass"
                  type="password"
                  placeholder={settings.hasPassword ? "••••••••" : "Enter password"}
                  value={smtpPass}
                  onChange={(e) => setSmtpPass(e.target.value)}
                  data-testid="input-smtp-pass"
                />
                {settings.hasPassword && !smtpPass && (
                  <p className="text-xs text-muted-foreground">Leave blank to keep existing password</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={settings.smtpSecureTls}
                onCheckedChange={(checked) => setSettings({ ...settings, smtpSecureTls: checked })}
                data-testid="switch-secure-tls"
              />
              <Label>Use Secure TLS</Label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sender Information</CardTitle>
            <CardDescription>Customize how emails appear to recipients</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="emailFromName">From Name</Label>
                <Input
                  id="emailFromName"
                  placeholder="Asha Kuteer Foundation"
                  value={settings.emailFromName}
                  onChange={(e) => setSettings({ ...settings, emailFromName: e.target.value })}
                  data-testid="input-from-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emailFromEmail">From Email</Label>
                <Input
                  id="emailFromEmail"
                  type="email"
                  placeholder="noreply@ashakuteer.org"
                  value={settings.emailFromEmail}
                  onChange={(e) => setSettings({ ...settings, emailFromEmail: e.target.value })}
                  data-testid="input-from-email"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Test Email</CardTitle>
            <CardDescription>Send a test email to verify your configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Enter email address to test"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                data-testid="input-test-email"
              />
              <Button
                variant="outline"
                onClick={handleTestEmail}
                disabled={testing || !settings.smtpHost || !settings.smtpUser}
                data-testid="button-test-email"
              >
                {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                <span className="ml-2">Test</span>
              </Button>
            </div>
            {testResult && (
              <div className={`flex items-center gap-2 p-3 rounded-md ${testResult.success ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400" : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"}`}>
                {testResult.success ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                <span className="text-sm">{testResult.message}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => router.push("/dashboard/settings")} data-testid="button-cancel">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving} data-testid="button-save">
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  );
}
