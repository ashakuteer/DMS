"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function GenerateReportDialog({
  open,
  setOpen,
  children,
  onGenerate,
  generating,
}: any) {

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md">

        <DialogHeader>
          <DialogTitle>Generate Report</DialogTitle>
          <DialogDescription>
            Configure and generate a donor report
          </DialogDescription>
        </DialogHeader>

        {children}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>

          <Button onClick={onGenerate} disabled={generating}>
            Generate
          </Button>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  );
}
