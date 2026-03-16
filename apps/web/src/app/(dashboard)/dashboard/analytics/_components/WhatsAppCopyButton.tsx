"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";

export function WhatsAppCopyButton({ phone, message, testId }: { phone?: string; message: string; testId: string }) {
  const [copied, setCopied] = useState(false);
  const handleClick = () => {
    navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <Button variant="outline" size="sm" onClick={handleClick} data-testid={testId}>
      {copied ? <Check className="h-3.5 w-3.5" /> : <SiWhatsapp className="h-3.5 w-3.5" />}
    </Button>
  );
}
