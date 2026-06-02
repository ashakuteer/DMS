"use client";

import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { ChevronDown } from "lucide-react";

const SOURCE_DETAIL_OPTIONS = [
  "CC Avenue",
  "Razorpay",
  "GiveIndia",
  "DonateKart",
  "Milaap",
  "Facebook",
  "Instagram",
  "YouTube",
  "LinkedIn",
  "Google Search",
  "Google Ads",
  "WhatsApp",
  "Existing Donor Reference",
  "CSR Reference",
  "Other",
];

interface SourceDetailsComboboxProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  "data-testid"?: string;
}

export function SourceDetailsCombobox({
  value,
  onChange,
  placeholder = "Select or type a source detail",
  "data-testid": testId,
}: SourceDetailsComboboxProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = SOURCE_DETAIL_OPTIONS.filter((opt) =>
    opt.toLowerCase().includes(value.toLowerCase())
  );

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Input
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          data-testid={testId}
          className="pr-8"
          autoComplete="off"
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setOpen((o) => !o)}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          aria-label="Toggle options"
        >
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>

      {open && filtered.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md max-h-56 overflow-y-auto text-sm">
          {filtered.map((opt) => (
            <li
              key={opt}
              onMouseDown={(e) => {
                e.preventDefault();
                onChange(opt);
                setOpen(false);
              }}
              className={`cursor-pointer px-3 py-2 hover:bg-accent hover:text-accent-foreground ${
                value === opt ? "bg-accent/50 font-medium" : ""
              }`}
            >
              {opt}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
