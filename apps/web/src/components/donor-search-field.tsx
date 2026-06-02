"use client";

import { useState, useCallback, useRef } from "react";
import { Search, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api-client";

interface DonorSearchResult {
  id: string;
  donorCode: string;
  name: string;
  phone?: string;
  city?: string;
}

interface SelectedDonor {
  id: string;
  donorCode: string;
  name: string;
}

interface DonorSearchFieldProps {
  value: SelectedDonor | null;
  onChange: (donor: SelectedDonor | null) => void;
  placeholder?: string;
  excludeId?: string;
}

export function DonorSearchField({
  value,
  onChange,
  placeholder = "Search donors by name, code, or phone…",
  excludeId,
}: DonorSearchFieldProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<DonorSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(
    async (q: string) => {
      if (q.length < 2) {
        setResults([]);
        setOpen(false);
        return;
      }
      setLoading(true);
      try {
        const data = await apiClient<any>(
          `/api/search?q=${encodeURIComponent(q)}&entityType=donors`,
        );
        const items: DonorSearchResult[] = (data?.results?.donors ?? data?.donors ?? data ?? [])
          .filter((d: any) => !excludeId || d.id !== excludeId)
          .map((d: any) => ({
            id: d.id,
            donorCode: d.donorCode ?? d.code,
            name: d.name ?? [d.firstName, d.lastName].filter(Boolean).join(" "),
            phone: d.phone ?? d.primaryPhone,
            city: d.city,
          }));
        setResults(items);
        setOpen(items.length > 0);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    },
    [excludeId],
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setQuery(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(q), 300);
  };

  const handleSelect = (donor: DonorSearchResult) => {
    onChange({ id: donor.id, donorCode: donor.donorCode, name: donor.name });
    setQuery("");
    setResults([]);
    setOpen(false);
  };

  const handleClear = () => {
    onChange(null);
    setQuery("");
    setResults([]);
    setOpen(false);
  };

  if (value) {
    return (
      <div className="flex items-center justify-between p-3 border rounded-md bg-muted/50">
        <div>
          <p className="font-medium text-sm">{value.name}</p>
          <p className="text-xs text-muted-foreground">{value.donorCode}</p>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={handleClear}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={handleInputChange}
          placeholder={placeholder}
          className="pl-9 pr-9"
          onFocus={() => results.length > 0 && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          autoComplete="off"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>
      {open && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg max-h-56 overflow-y-auto">
          {results.map((donor) => (
            <button
              key={donor.id}
              type="button"
              className="w-full text-left px-3 py-2 hover:bg-muted transition-colors"
              onMouseDown={() => handleSelect(donor)}
            >
              <p className="text-sm font-medium">{donor.name}</p>
              <p className="text-xs text-muted-foreground">
                {donor.donorCode}
                {donor.city ? ` · ${donor.city}` : ""}
                {donor.phone ? ` · ${donor.phone}` : ""}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
