"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter, FileDown } from "lucide-react";

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  from: string;
  setFrom: (v: string) => void;
  to: string;
  setTo: (v: string) => void;
  home: string;
  setHome: (v: string) => void;
  type: string;
  setType: (v: string) => void;
  onExport: () => void;
}

export function ExportDialog({ open, onOpenChange, from, setFrom, to, setTo, home, setHome, type, setType, onExport }: ExportDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" data-testid="dialog-export-donations">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Export Donations
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="export-from">From Date</Label>
              <Input
                id="export-from"
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                data-testid="input-export-from"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="export-to">To Date</Label>
              <Input
                id="export-to"
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                data-testid="input-export-to"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Designated Home</Label>
            <Select value={home} onValueChange={setHome}>
              <SelectTrigger data-testid="select-export-home">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Homes</SelectItem>
                <SelectItem value="GIRLS_HOME">Girls Home</SelectItem>
                <SelectItem value="BLIND_BOYS_HOME">Blind Boys Home</SelectItem>
                <SelectItem value="OLD_AGE_HOME">Old Age Home</SelectItem>
                <SelectItem value="GENERAL">General</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Donation Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger data-testid="select-export-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="CASH">Cash</SelectItem>
                <SelectItem value="GROCERIES">Groceries</SelectItem>
                <SelectItem value="RICE_BAGS">Rice Bags</SelectItem>
                <SelectItem value="STATIONERY">Stationery</SelectItem>
                <SelectItem value="MEDICINES">Medicines</SelectItem>
                <SelectItem value="ANNADANAM">Annadanam</SelectItem>
                <SelectItem value="SPORTS_KITS">Sports Kits</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="button-export-cancel">
            Cancel
          </Button>
          <Button onClick={onExport} data-testid="button-export-download">
            <FileDown className="h-4 w-4 mr-2" />
            Download Excel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
