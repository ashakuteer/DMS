"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Loader2, Mail, Copy } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { useToast } from "@/hooks/use-toast";
import { PreviewData } from "./types";

interface PreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  previewLoading: boolean;
  previewData: PreviewData | null;
}

export function PreviewDialog({ open, onOpenChange, previewLoading, previewData }: PreviewDialogProps) {
  const { toast } = useToast();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Message Preview</DialogTitle>
          <DialogDescription>Preview how donors will see this update</DialogDescription>
        </DialogHeader>

        {previewLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : previewData ? (
          <Tabs defaultValue="email" className="space-y-4">
            <TabsList>
              <TabsTrigger value="email">
                <Mail className="mr-2 h-4 w-4" />
                Email Preview
              </TabsTrigger>
              <TabsTrigger value="whatsapp">
                <SiWhatsapp className="mr-2 h-4 w-4" />
                WhatsApp Preview
              </TabsTrigger>
            </TabsList>

            <TabsContent value="email">
              <div className="space-y-2">
                <div className="text-sm">
                  <span className="font-medium text-muted-foreground">Subject: </span>
                  {previewData.emailSubject}
                </div>
                <div
                  className="border rounded-md p-4 bg-background"
                  dangerouslySetInnerHTML={{ __html: previewData.emailHtml.replace(/\{\{donor_name\}\}/g, "John Doe") }}
                />
              </div>
            </TabsContent>

            <TabsContent value="whatsapp">
              <div className="bg-muted/50 p-4 rounded-md whitespace-pre-wrap font-mono text-sm">
                {previewData.whatsappText.replace(/\{\{donor_name\}\}/g, "John Doe")}
              </div>
              <Button
                variant="outline"
                className="mt-2"
                onClick={() => {
                  navigator.clipboard.writeText(previewData.whatsappText.replace(/\{\{donor_name\}\}/g, "Donor Name"));
                  toast({ title: "Copied", description: "WhatsApp text copied" });
                }}
                data-testid="button-copy-whatsapp"
              >
                <Copy className="mr-2 h-4 w-4" />
                Copy Text
              </Button>
            </TabsContent>
          </Tabs>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
