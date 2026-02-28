'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { fetchWithAuth, authStorage } from '@/lib/auth';
import { canAccessModule } from '@/lib/permissions';
import { AccessDenied } from '@/components/access-denied';
import {
  Users,
  ArrowLeft,
  GitMerge,
  Phone,
  Mail,
  AlertTriangle,
  Check,
  Loader2,
  RefreshCw,
} from 'lucide-react';

interface DonorSummary {
  id: string;
  donorCode: string;
  firstName: string;
  lastName?: string;
  primaryPhone?: string;
  personalEmail?: string;
  createdAt: string;
  donationCount: number;
  totalDonations: number;
}

interface DuplicateGroup {
  matchType: 'phone' | 'email';
  matchValue: string;
  donors: DonorSummary[];
}

interface MergeResult {
  success: boolean;
  primaryDonorId: string;
  mergedCount: number;
  donationsMoved: number;
  pledgesMoved: number;
  remindersMoved: number;
  communicationLogsMoved: number;
  familyMembersMoved: number;
  specialDaysMoved: number;
}

export default function DuplicateDonorsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [duplicates, setDuplicates] = useState<DuplicateGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [merging, setMerging] = useState<string | null>(null);
  const [selectedPrimary, setSelectedPrimary] = useState<Record<string, string>>({});
  const [user, setUser] = useState<{role?: string} | null>(null);
  const [userLoaded, setUserLoaded] = useState(false);

  const isAdmin = user?.role === 'ADMIN';

  useEffect(() => {
    const stored = authStorage.getUser();
    setUser(stored);
    setUserLoaded(true);
  }, []);

  const getGroupKey = (group: DuplicateGroup) => `${group.matchType}-${group.matchValue}`;

  useEffect(() => {
    if (!userLoaded) return;
    if (!isAdmin) {
      return;
    }
    fetchDuplicates();
  }, [userLoaded, isAdmin, router]);

  const fetchDuplicates = async () => {
    setLoading(true);
    try {
      const response = await fetchWithAuth('/api/donors/duplicates');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
      }
      const data = await response.json() as DuplicateGroup[];
      setDuplicates(data || []);
      const initialSelections: Record<string, string> = {};
      (data || []).forEach((group) => {
        const sorted = [...group.donors].sort((a, b) => {
          if (b.donationCount !== a.donationCount) return b.donationCount - a.donationCount;
          return b.totalDonations - a.totalDonations;
        });
        if (sorted[0]) {
          initialSelections[getGroupKey(group)] = sorted[0].id;
        }
      });
      setSelectedPrimary(initialSelections);
    } catch (error: any) {
      console.error('Error fetching duplicates:', error);
      toast({
        title: 'Error loading duplicates',
        description: error.message || 'Failed to fetch duplicate donors',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMerge = async (group: DuplicateGroup) => {
    const groupKey = getGroupKey(group);
    const primaryId = selectedPrimary[groupKey];
    if (!primaryId) {
      toast({
        title: 'Select primary donor',
        description: 'Please select which donor record to keep as primary.',
        variant: 'destructive',
      });
      return;
    }

    const mergeFromIds = group.donors.filter((d) => d.id !== primaryId).map((d) => d.id);
    if (mergeFromIds.length === 0) {
      toast({
        title: 'Nothing to merge',
        description: 'No donors selected for merging.',
        variant: 'destructive',
      });
      return;
    }

    setMerging(groupKey);
    try {
      const response = await fetchWithAuth('/api/donors/duplicates/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          primaryDonorId: primaryId,
          mergeFromDonorIds: mergeFromIds,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to merge donors');
      }
      const result = await response.json() as MergeResult;

      toast({
        title: 'Merge successful',
        description: `Merged ${result.mergedCount} donor(s). Moved ${result.donationsMoved} donations, ${result.pledgesMoved} pledges, ${result.remindersMoved} reminders.`,
      });

      fetchDuplicates();
    } catch (error: any) {
      toast({
        title: 'Merge failed',
        description: error.message || 'Failed to merge donors',
        variant: 'destructive',
      });
    } finally {
      setMerging(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (!isAdmin) {
    return <AccessDenied />;
  }

  return (
    <div className="space-y-6" data-testid="duplicates-page">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/dashboard/donors')}
          data-testid="button-back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold" data-testid="text-page-title">
            Duplicate Donors Detection
          </h1>
          <p className="text-muted-foreground">
            Identify and merge duplicate donor records
          </p>
        </div>
        <Button
          variant="outline"
          onClick={fetchDuplicates}
          disabled={loading}
          data-testid="button-refresh"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : duplicates.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Check className="h-12 w-12 mx-auto mb-4 text-green-500" />
            <h3 className="text-lg font-semibold mb-2">No Duplicates Found</h3>
            <p className="text-muted-foreground">
              All donor records appear to be unique. No action needed.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                {duplicates.length} Duplicate Groups Found
              </CardTitle>
              <CardDescription>
                Review each group and select the primary record to keep. All data from
                other records will be merged into the primary.
              </CardDescription>
            </CardHeader>
          </Card>

          <div className="space-y-6">
            {duplicates.map((group) => {
              const groupKey = getGroupKey(group);
              return (
              <Card key={groupKey} data-testid={`duplicate-group-${groupKey}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {group.matchType === 'phone' ? (
                        <Phone className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <Mail className="h-5 w-5 text-muted-foreground" />
                      )}
                      <div>
                        <CardTitle className="text-base">
                          Match by {group.matchType === 'phone' ? 'Phone' : 'Email'}
                        </CardTitle>
                        <CardDescription>{group.matchValue}</CardDescription>
                      </div>
                    </div>
                    <Badge variant="secondary">
                      <Users className="h-3 w-3 mr-1" />
                      {group.donors.length} records
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground mb-2">
                    Click on a donor to select as primary (the record to keep):
                  </p>
                  <div className="grid gap-3">
                    {group.donors.map((donor) => {
                      const isSelected = selectedPrimary[groupKey] === donor.id;
                      return (
                        <button
                          key={donor.id}
                          type="button"
                          onClick={() =>
                            setSelectedPrimary((prev) => ({ ...prev, [groupKey]: donor.id }))
                          }
                          className={`w-full text-left p-4 rounded-lg border transition-colors hover-elevate ${
                            isSelected
                              ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                              : 'border-border'
                          }`}
                          data-testid={`select-donor-${donor.donorCode}`}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                {isSelected && (
                                  <Check className="h-4 w-4 text-primary" />
                                )}
                                <span className="font-medium">{donor.firstName} {donor.lastName || ''}</span>
                                <Badge variant="outline" className="text-xs">
                                  {donor.donorCode}
                                </Badge>
                                {isSelected && (
                                  <Badge variant="default" className="text-xs">
                                    Primary
                                  </Badge>
                                )}
                              </div>
                              <div className="text-sm text-muted-foreground mt-1">
                                {donor.personalEmail && <span>{donor.personalEmail}</span>}
                                {donor.personalEmail && donor.primaryPhone && <span className="mx-2">|</span>}
                                {donor.primaryPhone && <span>{donor.primaryPhone}</span>}
                              </div>
                            </div>
                            <div className="text-right text-sm">
                              <div className="font-medium">
                                {formatCurrency(donor.totalDonations)}
                              </div>
                              <div className="text-muted-foreground">
                                {donor.donationCount} donation
                                {donor.donationCount !== 1 ? 's' : ''}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span>Created: {formatDate(donor.createdAt)}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Selected: Keep{' '}
                      <span className="font-medium">
                        {group.donors.find((d) => d.id === selectedPrimary[groupKey])?.donorCode ||
                          'none'}
                      </span>{' '}
                      as primary
                    </p>
                    <Button
                      onClick={() => handleMerge(group)}
                      disabled={merging === groupKey || !selectedPrimary[groupKey]}
                      data-testid={`button-merge-${groupKey}`}
                    >
                      {merging === groupKey ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <GitMerge className="h-4 w-4 mr-2" />
                      )}
                      Merge Records
                    </Button>
                  </div>
                </CardContent>
              </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
