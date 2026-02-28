"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { fetchWithAuth, authStorage } from "@/lib/auth";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Search,
  Users,
  HandHeart,
  IndianRupee,
  Megaphone,
  ArrowRight,
  Loader2,
  SlidersHorizontal,
  X,
  Bookmark,
  BookmarkCheck,
  Trash2,
  Clock,
  Heart,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

interface DonorResult {
  id: string;
  donorCode: string;
  name: string;
  phone: string | null;
  email: string | null;
  city: string | null;
  category: string | null;
}

interface BeneficiaryResult {
  id: string;
  code: string;
  fullName: string;
  homeType: string | null;
  status: string;
  age: number | null;
  sponsored: boolean;
}

interface DonationResult {
  id: string;
  receiptNumber: string | null;
  amount: number;
  donorName: string;
  donorId: string;
  date: string;
  type: string;
}

interface CampaignResult {
  id: string;
  name: string;
  status: string;
  goalAmount: number | null;
  startDate: string | null;
}

interface SearchResults {
  donors: DonorResult[];
  beneficiaries: BeneficiaryResult[];
  donations: DonationResult[];
  campaigns: CampaignResult[];
}

interface SearchFilters {
  entityType: string;
  donorCategory: string;
  donorCity: string;
  beneficiaryHomeType: string;
  beneficiaryStatus: string;
  beneficiaryAgeGroup: string;
  beneficiarySponsored: string;
  campaignStatus: string;
}

interface SavedFilter {
  id: string;
  name: string;
  filters: SearchFilters;
  createdAt: string;
}

const EMPTY_FILTERS: SearchFilters = {
  entityType: "",
  donorCategory: "",
  donorCity: "",
  beneficiaryHomeType: "",
  beneficiaryStatus: "",
  beneficiaryAgeGroup: "",
  beneficiarySponsored: "",
  campaignStatus: "",
};

const ENTITY_TABS = [
  { value: "", label: "All", icon: Search },
  { value: "donors", label: "Donors", icon: Users },
  { value: "beneficiaries", label: "Beneficiaries", icon: HandHeart },
  { value: "donations", label: "Donations", icon: IndianRupee },
  { value: "campaigns", label: "Campaigns", icon: Megaphone },
];

const DONOR_CATEGORIES = [
  { value: "INDIVIDUAL", label: "Individual" },
  { value: "NGO", label: "NGO" },
  { value: "CSR_REP", label: "CSR Rep" },
  { value: "WHATSAPP_GROUP", label: "WhatsApp Group" },
  { value: "SOCIAL_MEDIA_PERSON", label: "Social Media" },
  { value: "CROWD_PULLER", label: "Crowd Puller" },
  { value: "VISITOR_ENQUIRY", label: "Visitor/Enquiry" },
];

const HOME_TYPES = [
  { value: "ORPHAN_GIRLS", label: "Orphan Girls" },
  { value: "BLIND_BOYS", label: "Blind Boys" },
  { value: "OLD_AGE", label: "Old Age" },
];

const AGE_GROUPS = [
  { value: "0-10", label: "0-10 yrs" },
  { value: "11-18", label: "11-18 yrs" },
  { value: "19-30", label: "19-30 yrs" },
  { value: "31-50", label: "31-50 yrs" },
  { value: "51-70", label: "51-70 yrs" },
  { value: "71+", label: "71+ yrs" },
];

const CAMPAIGN_STATUSES = [
  { value: "DRAFT", label: "Draft" },
  { value: "ACTIVE", label: "Active" },
  { value: "PAUSED", label: "Paused" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

function getSavedFiltersKey(): string {
  const user = authStorage.getUser();
  return `ngo_search_filters_${user?.id || 'default'}`;
}

function getRecentSearchesKey(): string {
  const user = authStorage.getUser();
  return `ngo_recent_searches_${user?.id || 'default'}`;
}

function loadSavedFilters(): SavedFilter[] {
  try {
    const data = localStorage.getItem(getSavedFiltersKey());
    return data ? JSON.parse(data) : [];
  } catch { return []; }
}

function saveSavedFilters(filters: SavedFilter[]) {
  localStorage.setItem(getSavedFiltersKey(), JSON.stringify(filters));
}

function loadRecentSearches(): string[] {
  try {
    const data = localStorage.getItem(getRecentSearchesKey());
    return data ? JSON.parse(data) : [];
  } catch { return []; }
}

function saveRecentSearch(query: string) {
  if (!query || query.trim().length < 2) return;
  const recent = loadRecentSearches();
  const filtered = recent.filter((r) => r.toLowerCase() !== query.toLowerCase());
  filtered.unshift(query.trim());
  localStorage.setItem(getRecentSearchesKey(), JSON.stringify(filtered.slice(0, 8)));
}

function hasActiveFilters(filters: SearchFilters): boolean {
  return Object.entries(filters).some(([key, val]) => key !== 'entityType' && val !== '');
}

function countActiveFilters(filters: SearchFilters): number {
  return Object.entries(filters).filter(([key, val]) => key !== 'entityType' && val !== '').length;
}

export function GlobalSearchTrigger() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <button
        data-testid="button-global-search"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 h-9 rounded-md border border-input bg-background text-sm text-muted-foreground hover-elevate transition-colors w-full max-w-sm"
      >
        <Search className="h-4 w-4 shrink-0" />
        <span className="flex-1 text-left">Search donors, beneficiaries...</span>
        <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
          <span className="text-xs">Ctrl</span>K
        </kbd>
      </button>
      <GlobalSearchDialog open={open} onOpenChange={setOpen} />
    </>
  );
}

function GlobalSearchDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [filters, setFilters] = useState<SearchFilters>({ ...EMPTY_FILTERS });
  const [showFilters, setShowFilters] = useState(false);
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [savingFilter, setSavingFilter] = useState(false);
  const [filterName, setFilterName] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const activeFilterCount = countActiveFilters(filters);
  const filtersActive = hasActiveFilters(filters);

  const allItems = useMemo(() => {
    if (!results) return [];
    return [
      ...results.donors.map((d) => ({ type: "donor" as const, data: d })),
      ...results.beneficiaries.map((b) => ({ type: "beneficiary" as const, data: b })),
      ...results.donations.map((d) => ({ type: "donation" as const, data: d })),
      ...results.campaigns.map((c) => ({ type: "campaign" as const, data: c })),
    ];
  }, [results]);

  const totalResults = allItems.length;

  const navigateToResult = useCallback(
    (item: (typeof allItems)[0]) => {
      onOpenChange(false);
      saveRecentSearch(query);
      setQuery("");
      setResults(null);
      switch (item.type) {
        case "donor":
          router.push(`/dashboard/donors/${(item.data as DonorResult).id}`);
          break;
        case "beneficiary":
          router.push(`/dashboard/beneficiaries/${(item.data as BeneficiaryResult).id}`);
          break;
        case "donation":
          router.push(`/dashboard/donations/${(item.data as DonationResult).id}`);
          break;
        case "campaign":
          router.push(`/dashboard/campaigns`);
          break;
      }
    },
    [onOpenChange, router, query]
  );

  useEffect(() => {
    if (open) {
      setSavedFilters(loadSavedFilters());
      setRecentSearches(loadRecentSearches());
    } else {
      setQuery("");
      setResults(null);
      setActiveIndex(-1);
      setShowFilters(false);
      setSavingFilter(false);
      setFilterName("");
    }
  }, [open]);

  const performSearch = useCallback(async (searchQuery: string, searchFilters: SearchFilters) => {
    const trimmed = searchQuery.trim();
    const hasFiltersActive = hasActiveFilters(searchFilters);

    if (trimmed.length < 2 && !hasFiltersActive) {
      setResults(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (trimmed) params.set('q', trimmed);
      params.set('limit', '8');

      if (searchFilters.entityType) params.set('entityType', searchFilters.entityType);
      if (searchFilters.donorCategory) params.set('donorCategory', searchFilters.donorCategory);
      if (searchFilters.donorCity) params.set('donorCity', searchFilters.donorCity);
      if (searchFilters.beneficiaryHomeType) params.set('beneficiaryHomeType', searchFilters.beneficiaryHomeType);
      if (searchFilters.beneficiaryStatus) params.set('beneficiaryStatus', searchFilters.beneficiaryStatus);
      if (searchFilters.beneficiaryAgeGroup) params.set('beneficiaryAgeGroup', searchFilters.beneficiaryAgeGroup);
      if (searchFilters.beneficiarySponsored) params.set('beneficiarySponsored', searchFilters.beneficiarySponsored);
      if (searchFilters.campaignStatus) params.set('campaignStatus', searchFilters.campaignStatus);

      const res = await fetchWithAuth(`/api/search?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data);
      }
    } catch {
      setResults(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      performSearch(query, filters);
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, filters, performSearch]);

  const updateFilter = (key: keyof SearchFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setActiveIndex(-1);
  };

  const clearFilters = () => {
    setFilters({ ...EMPTY_FILTERS });
    setActiveIndex(-1);
  };

  const handleSaveFilter = () => {
    if (!filterName.trim()) return;
    const newFilter: SavedFilter = {
      id: Date.now().toString(),
      name: filterName.trim(),
      filters: { ...filters },
      createdAt: new Date().toISOString(),
    };
    const updated = [...savedFilters, newFilter];
    setSavedFilters(updated);
    saveSavedFilters(updated);
    setSavingFilter(false);
    setFilterName("");
  };

  const applyPreset = (preset: SavedFilter) => {
    setFilters({ ...preset.filters });
    setActiveIndex(-1);
  };

  const deletePreset = (id: string) => {
    const updated = savedFilters.filter((f) => f.id !== id);
    setSavedFilters(updated);
    saveSavedFilters(updated);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev < totalResults - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : totalResults - 1));
    } else if (e.key === "Enter" && activeIndex >= 0 && allItems[activeIndex]) {
      e.preventDefault();
      navigateToResult(allItems[activeIndex]);
    }
  };

  const showEmptyState = !query.trim() && !filtersActive && !loading;
  const showNoResults = !loading && results && totalResults === 0 && (query.trim().length >= 2 || filtersActive);
  let flatIndex = -1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px] p-0 gap-0 overflow-hidden">
        <VisuallyHidden>
          <DialogTitle>Global Search</DialogTitle>
        </VisuallyHidden>

        <div className="flex items-center gap-2 border-b px-3">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <Input
            ref={inputRef}
            data-testid="input-global-search"
            placeholder="Search donors, beneficiaries, donations, campaigns..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(-1);
            }}
            onKeyDown={handleKeyDown}
            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-12 text-sm"
            autoFocus
          />
          {loading && (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
          )}
          <Button
            size="icon"
            variant="ghost"
            data-testid="button-toggle-filters"
            onClick={() => setShowFilters(!showFilters)}
            className={cn("shrink-0", showFilters && "toggle-elevate toggle-elevated")}
          >
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
          {activeFilterCount > 0 && (
            <Badge variant="default" className="text-[10px] shrink-0">
              {activeFilterCount}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-1 px-2 py-1.5 border-b overflow-x-auto">
          {ENTITY_TABS.map((tab) => (
            <button
              key={tab.value}
              data-testid={`tab-entity-${tab.value || 'all'}`}
              onClick={() => updateFilter('entityType', tab.value)}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap",
                filters.entityType === tab.value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover-elevate"
              )}
            >
              <tab.icon className="h-3 w-3" />
              {tab.label}
            </button>
          ))}
        </div>

        {showFilters && (
          <div className="border-b px-3 py-3 space-y-3" data-testid="panel-filters">
            {(!filters.entityType || filters.entityType === "donors") && (
              <div className="space-y-1.5">
                <div className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <Users className="h-3 w-3" />
                  Donor Filters
                </div>
                <div className="flex flex-wrap gap-2">
                  <Select value={filters.donorCategory} onValueChange={(v) => updateFilter('donorCategory', v === '_clear' ? '' : v)}>
                    <SelectTrigger className="w-[150px] h-8 text-xs" data-testid="filter-donor-category">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_clear">All Categories</SelectItem>
                      {DONOR_CATEGORIES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    data-testid="filter-donor-city"
                    placeholder="City"
                    value={filters.donorCity}
                    onChange={(e) => updateFilter('donorCity', e.target.value)}
                    className="w-[130px] h-8 text-xs"
                  />
                </div>
              </div>
            )}

            {(!filters.entityType || filters.entityType === "beneficiaries") && (
              <div className="space-y-1.5">
                <div className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <HandHeart className="h-3 w-3" />
                  Beneficiary Filters
                </div>
                <div className="flex flex-wrap gap-2">
                  <Select value={filters.beneficiaryHomeType} onValueChange={(v) => updateFilter('beneficiaryHomeType', v === '_clear' ? '' : v)}>
                    <SelectTrigger className="w-[140px] h-8 text-xs" data-testid="filter-beneficiary-home">
                      <SelectValue placeholder="Home" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_clear">All Homes</SelectItem>
                      {HOME_TYPES.map((h) => (
                        <SelectItem key={h.value} value={h.value}>{h.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={filters.beneficiaryStatus} onValueChange={(v) => updateFilter('beneficiaryStatus', v === '_clear' ? '' : v)}>
                    <SelectTrigger className="w-[120px] h-8 text-xs" data-testid="filter-beneficiary-status">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_clear">All Status</SelectItem>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="INACTIVE">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filters.beneficiaryAgeGroup} onValueChange={(v) => updateFilter('beneficiaryAgeGroup', v === '_clear' ? '' : v)}>
                    <SelectTrigger className="w-[120px] h-8 text-xs" data-testid="filter-beneficiary-age">
                      <SelectValue placeholder="Age Group" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_clear">All Ages</SelectItem>
                      {AGE_GROUPS.map((a) => (
                        <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={filters.beneficiarySponsored} onValueChange={(v) => updateFilter('beneficiarySponsored', v === '_clear' ? '' : v)}>
                    <SelectTrigger className="w-[130px] h-8 text-xs" data-testid="filter-beneficiary-sponsored">
                      <SelectValue placeholder="Sponsor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_clear">All</SelectItem>
                      <SelectItem value="true">Sponsored</SelectItem>
                      <SelectItem value="false">Not Sponsored</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {(!filters.entityType || filters.entityType === "campaigns") && (
              <div className="space-y-1.5">
                <div className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <Megaphone className="h-3 w-3" />
                  Campaign Filters
                </div>
                <div className="flex flex-wrap gap-2">
                  <Select value={filters.campaignStatus} onValueChange={(v) => updateFilter('campaignStatus', v === '_clear' ? '' : v)}>
                    <SelectTrigger className="w-[140px] h-8 text-xs" data-testid="filter-campaign-status">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_clear">All Status</SelectItem>
                      {CAMPAIGN_STATUSES.map((s) => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 pt-1 flex-wrap">
              {filtersActive && (
                <Button size="sm" variant="ghost" onClick={clearFilters} data-testid="button-clear-filters" className="h-7 text-xs">
                  <X className="h-3 w-3 mr-1" />
                  Clear Filters
                </Button>
              )}
              {filtersActive && !savingFilter && (
                <Button size="sm" variant="outline" onClick={() => setSavingFilter(true)} data-testid="button-save-filter" className="h-7 text-xs">
                  <Bookmark className="h-3 w-3 mr-1" />
                  Save Filter
                </Button>
              )}
              {savingFilter && (
                <div className="flex items-center gap-1.5">
                  <Input
                    data-testid="input-filter-name"
                    placeholder="Filter name..."
                    value={filterName}
                    onChange={(e) => setFilterName(e.target.value)}
                    className="h-7 text-xs w-[150px]"
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSaveFilter(); }}
                    autoFocus
                  />
                  <Button size="sm" variant="default" onClick={handleSaveFilter} className="h-7 text-xs" disabled={!filterName.trim()}>
                    Save
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => { setSavingFilter(false); setFilterName(""); }} className="h-7 text-xs">
                    Cancel
                  </Button>
                </div>
              )}
            </div>

            {savedFilters.length > 0 && (
              <div className="space-y-1">
                <div className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <BookmarkCheck className="h-3 w-3" />
                  Saved Filters
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {savedFilters.map((sf) => (
                    <div key={sf.id} className="flex items-center gap-0.5">
                      <button
                        data-testid={`saved-filter-${sf.id}`}
                        onClick={() => applyPreset(sf)}
                        className="flex items-center gap-1 px-2 py-1 rounded-md text-xs border border-input hover-elevate transition-colors"
                      >
                        <Bookmark className="h-2.5 w-2.5" />
                        {sf.name}
                      </button>
                      <button
                        data-testid={`delete-filter-${sf.id}`}
                        onClick={() => deletePreset(sf.id)}
                        className="p-0.5 rounded text-muted-foreground hover-elevate"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {filtersActive && !showFilters && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 border-b flex-wrap">
            {filters.donorCategory && (
              <FilterChip label={`Category: ${DONOR_CATEGORIES.find(c => c.value === filters.donorCategory)?.label || filters.donorCategory}`} onRemove={() => updateFilter('donorCategory', '')} />
            )}
            {filters.donorCity && (
              <FilterChip label={`City: ${filters.donorCity}`} onRemove={() => updateFilter('donorCity', '')} />
            )}
            {filters.beneficiaryHomeType && (
              <FilterChip label={`Home: ${HOME_TYPES.find(h => h.value === filters.beneficiaryHomeType)?.label || filters.beneficiaryHomeType}`} onRemove={() => updateFilter('beneficiaryHomeType', '')} />
            )}
            {filters.beneficiaryStatus && (
              <FilterChip label={`Status: ${filters.beneficiaryStatus}`} onRemove={() => updateFilter('beneficiaryStatus', '')} />
            )}
            {filters.beneficiaryAgeGroup && (
              <FilterChip label={`Age: ${filters.beneficiaryAgeGroup}`} onRemove={() => updateFilter('beneficiaryAgeGroup', '')} />
            )}
            {filters.beneficiarySponsored && (
              <FilterChip label={filters.beneficiarySponsored === 'true' ? 'Sponsored' : 'Not Sponsored'} onRemove={() => updateFilter('beneficiarySponsored', '')} />
            )}
            {filters.campaignStatus && (
              <FilterChip label={`Campaign: ${filters.campaignStatus}`} onRemove={() => updateFilter('campaignStatus', '')} />
            )}
            <button onClick={clearFilters} className="text-[10px] text-muted-foreground hover:text-foreground ml-1">
              Clear all
            </button>
          </div>
        )}

        <ScrollArea className="max-h-[400px]">
          <div className="p-2">
            {showEmptyState && (
              <div className="py-4 space-y-4">
                {recentSearches.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1.5 px-2 py-1">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs font-medium text-muted-foreground">Recent Searches</span>
                    </div>
                    <div className="space-y-0.5">
                      {recentSearches.map((term, i) => (
                        <button
                          key={i}
                          data-testid={`recent-search-${i}`}
                          onClick={() => setQuery(term)}
                          className="w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover-elevate transition-colors"
                        >
                          <Clock className="h-3 w-3 text-muted-foreground shrink-0" />
                          <span className="truncate">{term}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div className="text-center text-sm text-muted-foreground py-2">
                  Type to search or use filters
                </div>
              </div>
            )}

            {showNoResults && (
              <div
                data-testid="text-no-results"
                className="py-8 text-center text-sm text-muted-foreground"
              >
                No results found{query.trim() ? ` for "${query}"` : ""}
                {filtersActive && " with current filters"}
              </div>
            )}

            {results && results.donors.length > 0 && (
              <ResultGroup title="Donors" icon={Users} count={results.donors.length}>
                {results.donors.map((donor) => {
                  flatIndex++;
                  const idx = flatIndex;
                  return (
                    <ResultItem
                      key={donor.id}
                      data-testid={`search-result-donor-${donor.id}`}
                      active={activeIndex === idx}
                      onClick={() => navigateToResult({ type: "donor", data: donor })}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{donor.name}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {donor.donorCode}
                          {donor.phone && ` \u00B7 ${donor.phone}`}
                          {donor.email && ` \u00B7 ${donor.email}`}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {donor.category && (
                          <Badge variant="secondary" className="text-[10px]">
                            {donor.category.replace(/_/g, " ")}
                          </Badge>
                        )}
                        {donor.city && (
                          <span className="text-xs text-muted-foreground">{donor.city}</span>
                        )}
                      </div>
                      <ArrowRight className="h-3 w-3 shrink-0 text-muted-foreground" />
                    </ResultItem>
                  );
                })}
              </ResultGroup>
            )}

            {results && results.beneficiaries.length > 0 && (
              <ResultGroup title="Beneficiaries" icon={HandHeart} count={results.beneficiaries.length}>
                {results.beneficiaries.map((ben) => {
                  flatIndex++;
                  const idx = flatIndex;
                  return (
                    <ResultItem
                      key={ben.id}
                      data-testid={`search-result-beneficiary-${ben.id}`}
                      active={activeIndex === idx}
                      onClick={() => navigateToResult({ type: "beneficiary", data: ben })}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{ben.fullName}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {ben.code}
                          {ben.homeType && ` \u00B7 ${ben.homeType.replace(/_/g, " ")}`}
                          {ben.age !== null && ben.age !== undefined && ` \u00B7 ${ben.age} yrs`}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {ben.sponsored && (
                          <Heart className="h-3 w-3 text-rose-500" />
                        )}
                        <Badge
                          variant={ben.status === "ACTIVE" ? "default" : "secondary"}
                          className="text-[10px]"
                        >
                          {ben.status}
                        </Badge>
                      </div>
                      <ArrowRight className="h-3 w-3 shrink-0 text-muted-foreground" />
                    </ResultItem>
                  );
                })}
              </ResultGroup>
            )}

            {results && results.donations.length > 0 && (
              <ResultGroup title="Donations" icon={IndianRupee} count={results.donations.length}>
                {results.donations.map((don) => {
                  flatIndex++;
                  const idx = flatIndex;
                  return (
                    <ResultItem
                      key={don.id}
                      data-testid={`search-result-donation-${don.id}`}
                      active={activeIndex === idx}
                      onClick={() => navigateToResult({ type: "donation", data: don })}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">
                          {don.receiptNumber ? `Receipt #${don.receiptNumber}` : `Donation`}{" "}
                          &mdash;{" "}
                          {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(don.amount)}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {don.donorName} &middot; {new Date(don.date).toLocaleDateString("en-IN")}
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-[10px] shrink-0">
                        {don.type?.replace(/_/g, " ")}
                      </Badge>
                      <ArrowRight className="h-3 w-3 shrink-0 text-muted-foreground" />
                    </ResultItem>
                  );
                })}
              </ResultGroup>
            )}

            {results && results.campaigns.length > 0 && (
              <ResultGroup title="Campaigns" icon={Megaphone} count={results.campaigns.length}>
                {results.campaigns.map((camp) => {
                  flatIndex++;
                  const idx = flatIndex;
                  return (
                    <ResultItem
                      key={camp.id}
                      data-testid={`search-result-campaign-${camp.id}`}
                      active={activeIndex === idx}
                      onClick={() => navigateToResult({ type: "campaign", data: camp })}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{camp.name}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {camp.goalAmount &&
                            `Goal: ${new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(camp.goalAmount)}`}
                          {camp.startDate && ` \u00B7 Started ${new Date(camp.startDate).toLocaleDateString("en-IN")}`}
                        </div>
                      </div>
                      <Badge
                        variant={camp.status === "ACTIVE" ? "default" : "secondary"}
                        className="text-[10px] shrink-0"
                      >
                        {camp.status}
                      </Badge>
                      <ArrowRight className="h-3 w-3 shrink-0 text-muted-foreground" />
                    </ResultItem>
                  );
                })}
              </ResultGroup>
            )}
          </div>

          {results && totalResults > 0 && (
            <div className="border-t px-3 py-2 text-[11px] text-muted-foreground flex items-center justify-between gap-2 flex-wrap">
              <span>
                {totalResults} result{totalResults !== 1 ? "s" : ""} found
              </span>
              <span>
                <kbd className="rounded border bg-muted px-1 font-mono text-[10px]">&uarr;</kbd>{" "}
                <kbd className="rounded border bg-muted px-1 font-mono text-[10px]">&darr;</kbd>{" "}
                navigate{" "}
                <kbd className="rounded border bg-muted px-1 font-mono text-[10px]">Enter</kbd>{" "}
                open
              </span>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground text-[10px] font-medium">
      {label}
      <button onClick={onRemove} className="hover:text-foreground">
        <X className="h-2.5 w-2.5" />
      </button>
    </span>
  );
}

function ResultGroup({
  title,
  icon: Icon,
  count,
  children,
}: {
  title: string;
  icon: React.ElementType;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-2">
      <div className="flex items-center gap-2 px-2 py-1.5">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {title}
        </span>
        <Badge variant="secondary" className="text-[10px] ml-auto">
          {count}
        </Badge>
      </div>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function ResultItem({
  active,
  children,
  onClick,
  ...props
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
  "data-testid"?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={props["data-testid"]}
      className={cn(
        "w-full flex items-center gap-2 rounded-md px-2 py-2 text-left transition-colors",
        active ? "bg-accent text-accent-foreground" : "hover-elevate"
      )}
    >
      {children}
    </button>
  );
}
