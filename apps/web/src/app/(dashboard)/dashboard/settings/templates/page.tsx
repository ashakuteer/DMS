"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  MessageSquare, 
  Mail, 
  Copy, 
  Check, 
  Edit, 
  Heart, 
  UserPlus, 
  Calendar, 
  Gift, 
  Receipt, 
  Cake,
  Save
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { fetchWithAuth } from "@/lib/auth";
import { canAccessModule } from "@/lib/permissions";
import { AccessDenied } from "@/components/access-denied";

interface Template {
  id: string;
  type: string;
  name: string;
  description: string | null;
  whatsappMessage: string;
  emailSubject: string;
  emailBody: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy?: { id: string; name: string };
  updatedBy?: { id: string; name: string };
}

interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: string;
}

const templateIcons: Record<string, React.ElementType> = {
  THANK_YOU: Heart,
  GENTLE_FOLLOWUP: UserPlus,
  MONTHLY_REMINDER: Calendar,
  FESTIVAL_GREETING: Gift,
  RECEIPT_RESEND: Receipt,
  BIRTHDAY_ANNIVERSARY: Cake,
};

const templateLabels: Record<string, string> = {
  THANK_YOU: "Thank You",
  GENTLE_FOLLOWUP: "Gentle Follow-up",
  MONTHLY_REMINDER: "Monthly Reminder",
  FESTIVAL_GREETING: "Festival Greeting",
  RECEIPT_RESEND: "Receipt Re-send",
  BIRTHDAY_ANNIVERSARY: "Birthday/Anniversary",
};

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const fetchTemplates = useCallback(async () => {
    try {
      const res = await fetchWithAuth("/api/templates");
      if (res.ok) {
        const data = await res.json();
        setTemplates(data);
      }
    } catch (error) {
      console.error("Failed to fetch templates:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetchWithAuth("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      }
    } catch (error) {
      console.error("Failed to fetch user:", error);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
    fetchUser();
  }, [fetchTemplates, fetchUser]);

  const isAdmin = user?.role === "ADMIN";

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast({
        title: "Copied!",
        description: "Text copied to clipboard. Paste it in WhatsApp or your email client.",
      });
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      toast({
        title: "Copy failed",
        description: "Unable to copy to clipboard.",
        variant: "destructive",
      });
    }
  };

  const handleEditClick = (template: Template) => {
    setEditingTemplate({ ...template });
    setEditDialogOpen(true);
  };

  const handleSaveTemplate = async () => {
    if (!editingTemplate) return;
    
    setSaving(true);
    try {
      const res = await fetchWithAuth(`/api/templates/${editingTemplate.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editingTemplate.name,
          description: editingTemplate.description,
          whatsappMessage: editingTemplate.whatsappMessage,
          emailSubject: editingTemplate.emailSubject,
          emailBody: editingTemplate.emailBody,
        }),
      });

      if (res.ok) {
        toast({ title: "Template saved", description: "Your changes have been saved." });
        setEditDialogOpen(false);
        fetchTemplates();
      } else {
        throw new Error("Failed to save");
      }
    } catch {
      toast({ title: "Error", description: "Failed to save template.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (user && !canAccessModule(user?.role, 'templates')) {
    return <AccessDenied />;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Communication Templates</h1>
          <p className="text-muted-foreground mt-1">
            {isAdmin 
              ? "Manage message templates for donor communication" 
              : "View and copy message templates for donor communication"}
          </p>
        </div>
      </div>

      <div className="bg-muted/50 rounded-lg p-4 border">
        <h3 className="font-medium mb-2">Available Placeholders</h3>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" data-testid="placeholder-donor-name">{"{{donor_name}}"}</Badge>
          <Badge variant="outline" data-testid="placeholder-amount">{"{{amount}}"}</Badge>
          <Badge variant="outline" data-testid="placeholder-donation-date">{"{{donation_date}}"}</Badge>
          <Badge variant="outline" data-testid="placeholder-program-name">{"{{program_name}}"}</Badge>
          <Badge variant="outline" data-testid="placeholder-receipt-number">{"{{receipt_number}}"}</Badge>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          These placeholders will be automatically replaced when you copy a message from a donor profile.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => {
          const Icon = templateIcons[template.type] || MessageSquare;
          return (
            <Card key={template.id} className="relative" data-testid={`template-card-${template.type.toLowerCase()}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{template.name}</CardTitle>
                      <CardDescription className="text-xs">
                        {templateLabels[template.type]}
                      </CardDescription>
                    </div>
                  </div>
                  {isAdmin && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditClick(template)}
                      data-testid={`button-edit-${template.type.toLowerCase()}`}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {template.description && (
                  <p className="text-sm text-muted-foreground">{template.description}</p>
                )}
                
                <Tabs defaultValue="whatsapp" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 h-8">
                    <TabsTrigger value="whatsapp" className="text-xs" data-testid={`tab-whatsapp-${template.type.toLowerCase()}`}>
                      <MessageSquare className="h-3 w-3 mr-1" />
                      WhatsApp
                    </TabsTrigger>
                    <TabsTrigger value="email" className="text-xs" data-testid={`tab-email-${template.type.toLowerCase()}`}>
                      <Mail className="h-3 w-3 mr-1" />
                      Email
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="whatsapp" className="mt-2">
                    <div className="bg-muted/50 rounded p-2 text-xs max-h-32 overflow-y-auto whitespace-pre-wrap">
                      {template.whatsappMessage}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-2"
                      onClick={() => copyToClipboard(template.whatsappMessage, `whatsapp-${template.id}`)}
                      data-testid={`button-copy-whatsapp-${template.type.toLowerCase()}`}
                    >
                      {copiedField === `whatsapp-${template.id}` ? (
                        <><Check className="h-3 w-3 mr-1" /> Copied</>
                      ) : (
                        <><Copy className="h-3 w-3 mr-1" /> Copy WhatsApp Message</>
                      )}
                    </Button>
                  </TabsContent>
                  <TabsContent value="email" className="mt-2 space-y-2">
                    <div>
                      <Label className="text-xs text-muted-foreground">Subject</Label>
                      <div className="bg-muted/50 rounded p-2 text-xs">{template.emailSubject}</div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Body</Label>
                      <div className="bg-muted/50 rounded p-2 text-xs max-h-24 overflow-y-auto whitespace-pre-wrap">
                        {template.emailBody}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => copyToClipboard(template.emailSubject, `subject-${template.id}`)}
                        data-testid={`button-copy-subject-${template.type.toLowerCase()}`}
                      >
                        {copiedField === `subject-${template.id}` ? (
                          <><Check className="h-3 w-3 mr-1" /> Copied</>
                        ) : (
                          <><Copy className="h-3 w-3 mr-1" /> Subject</>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => copyToClipboard(template.emailBody, `body-${template.id}`)}
                        data-testid={`button-copy-body-${template.type.toLowerCase()}`}
                      >
                        {copiedField === `body-${template.id}` ? (
                          <><Check className="h-3 w-3 mr-1" /> Copied</>
                        ) : (
                          <><Copy className="h-3 w-3 mr-1" /> Body</>
                        )}
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Template</DialogTitle>
            <DialogDescription>
              Modify the message template. Use placeholders like {"{{donor_name}}"} for personalization.
            </DialogDescription>
          </DialogHeader>
          {editingTemplate && (
            <div className="space-y-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="template-name">Template Name</Label>
                <Input
                  id="template-name"
                  value={editingTemplate.name}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                  data-testid="input-template-name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="template-description">Description</Label>
                <Input
                  id="template-description"
                  value={editingTemplate.description || ""}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, description: e.target.value })}
                  data-testid="input-template-description"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="whatsapp-message">
                  <MessageSquare className="h-4 w-4 inline mr-1" />
                  WhatsApp Message
                </Label>
                <Textarea
                  id="whatsapp-message"
                  rows={6}
                  value={editingTemplate.whatsappMessage}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, whatsappMessage: e.target.value })}
                  data-testid="textarea-whatsapp-message"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email-subject">
                  <Mail className="h-4 w-4 inline mr-1" />
                  Email Subject
                </Label>
                <Input
                  id="email-subject"
                  value={editingTemplate.emailSubject}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, emailSubject: e.target.value })}
                  data-testid="input-email-subject"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email-body">Email Body</Label>
                <Textarea
                  id="email-body"
                  rows={8}
                  value={editingTemplate.emailBody}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, emailBody: e.target.value })}
                  data-testid="textarea-email-body"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} data-testid="button-cancel-edit">
              Cancel
            </Button>
            <Button onClick={handleSaveTemplate} disabled={saving} data-testid="button-save-template">
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
