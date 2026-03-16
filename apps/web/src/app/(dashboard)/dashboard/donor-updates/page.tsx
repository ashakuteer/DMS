"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Send,
  Plus,
  Loader2,
  RefreshCw,
  Eye,
  Trash2,
  Mail,
  Copy,
  ChevronLeft,
  ChevronRight,
  FileText,
  Users,
  History,
  X,
  Search,
  ExternalLink,
} from "lucide-react";
import { authStorage, fetchWithAuth } from "@/lib/auth";
import { canAccessModule, hasPermission } from "@/lib/permissions";
import { AccessDenied } from "@/components/access-denied";
import { useToast } from "@/hooks/use-toast";
import { DonorUpdate, DonorResult, BeneficiaryResult, DispatchItem, PreviewData } from "./_components/types";
import { HOME_TYPES } from "./_components/helpers";
import { ComposerDialog } from "./_components/ComposerDialog";
import { SendDialog } from "./_components/SendDialog";
import { PreviewDialog } from "./_components/PreviewDialog";

export default function DonorUpdatesPage() {
  const [updates, setUpdates] = useState<DonorUpdate[]>([]);
  const [updatesTotal, setUpdatesTotal] = useState(0);
  const [updatesPage, setUpdatesPage] = useState(1);
  const [updatesTotalPages, setUpdatesTotalPages] = useState(1);
  const [history, setHistory] = useState<DispatchItem[]>([]);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [showComposer, setShowComposer] = useState(false);
  const [composerTitle, setComposerTitle] = useState("");
  const [composerContent, setComposerContent] = useState("");
  const [composerPhotos, setComposerPhotos] = useState<string[]>([]);
  const [composerPhotoUrl, setComposerPhotoUrl] = useState("");
  const [selectedHomeTypes, setSelectedHomeTypes] = useState<string[]>([]);
  const [selectedBeneficiaries, setSelectedBeneficiaries] = useState<BeneficiaryResult[]>([]);
  const [beneficiarySearch, setBeneficiarySearch] = useState("");
  const [beneficiaryResults, setBeneficiaryResults] = useState<BeneficiaryResult[]>([]);
  const [beneficiarySearchLoading, setBeneficiarySearchLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [showSendDialog, setShowSendDialog] = useState(false);
  const [sendUpdateId, setSendUpdateId] = useState<string | null>(null);
  const [sendChannel, setSendChannel] = useState<"EMAIL" | "WHATSAPP">("EMAIL");
  const [selectedDonors, setSelectedDonors] = useState<DonorResult[]>([]);
  const [donorSearch, setDonorSearch] = useState("");
  const [donorResults, setDonorResults] = useState<DonorResult[]>([]);
  const [donorSearchLoading, setDonorSearchLoading] = useState(false);
  const [autoSelectMode, setAutoSelectMode] = useState<string>("");

  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const { toast } = useToast();
  const user = authStorage.getUser();

  if (user && !canAccessModule(user?.role, "donorUpdates")) return <AccessDenied />;

  const fetchUpdates = useCallback(async (page: number = 1) => {
    try {
      const res = await fetchWithAuth(`/api/donor-updates?page=${page}&limit=10`);
      if (res.ok) {
        const data = await res.json();
        setUpdates(data.items);
        setUpdatesTotal(data.total);
        setUpdatesPage(data.page);
        setUpdatesTotalPages(data.totalPages);
      }
    } catch (e) {
      console.error("Error fetching updates:", e);
    }
  }, []);

  const fetchHistory = useCallback(async (page: number = 1) => {
    try {
      const res = await fetchWithAuth(`/api/donor-updates/history?page=${page}&limit=15`);
      if (res.ok) {
        const data = await res.json();
        setHistory(data.items);
        setHistoryTotal(data.total);
        setHistoryPage(data.page);
        setHistoryTotalPages(data.totalPages);
      }
    } catch (e) {
      console.error("Error fetching history:", e);
    }
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchUpdates(1), fetchHistory(1)]);
    setLoading(false);
  }, [fetchUpdates, fetchHistory]);

  useEffect(() => { loadAll(); }, []);

  const searchBeneficiaries = useCallback(async (query: string) => {
    if (!query || query.length < 2) { setBeneficiaryResults([]); return; }
    setBeneficiarySearchLoading(true);
    try {
      const res = await fetchWithAuth(`/api/beneficiaries?search=${encodeURIComponent(query)}&limit=10`);
      if (res.ok) {
        const data = await res.json();
        setBeneficiaryResults(data.items || []);
      }
    } catch (e) { console.error(e); }
    finally { setBeneficiarySearchLoading(false); }
  }, []);

  const searchDonors = useCallback(async (query: string) => {
    if (!query || query.length < 2) { setDonorResults([]); return; }
    setDonorSearchLoading(true);
    try {
      const res = await fetchWithAuth(`/api/donor-updates/search-donors?search=${encodeURIComponent(query)}&limit=15`);
      if (res.ok) {
        setDonorResults(await res.json());
      }
    } catch (e) { console.error(e); }
    finally { setDonorSearchLoading(false); }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => searchBeneficiaries(beneficiarySearch), 300);
    return () => clearTimeout(timer);
  }, [beneficiarySearch, searchBeneficiaries]);

  useEffect(() => {
    const timer = setTimeout(() => searchDonors(donorSearch), 300);
    return () => clearTimeout(timer);
  }, [donorSearch, searchDonors]);

  const resetComposer = () => {
    setComposerTitle("");
    setComposerContent("");
    setComposerPhotos([]);
    setComposerPhotoUrl("");
    setSelectedHomeTypes([]);
    setSelectedBeneficiaries([]);
    setBeneficiarySearch("");
    setEditingId(null);
    setShowComposer(false);
  };

  const handleSave = async (isDraft: boolean = true) => {
    if (!composerTitle.trim() || !composerContent.trim()) {
      toast({ title: "Error", description: "Title and content are required", variant: "destructive" });
      return;
    }

    setActionLoading("save");
    try {
      const payload = {
        title: composerTitle,
        content: composerContent,
        photos: composerPhotos,
        relatedBeneficiaryIds: selectedBeneficiaries.map((b) => b.id),
        relatedHomeTypes: selectedHomeTypes,
        isDraft,
      };

      const url = editingId ? `/api/donor-updates/${editingId}` : "/api/donor-updates";
      const method = editingId ? "PATCH" : "POST";

      const res = await fetchWithAuth(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast({ title: "Saved", description: isDraft ? "Update saved as draft" : "Update published" });
        resetComposer();
        fetchUpdates(1);
      } else throw new Error("Failed to save");
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleEdit = (update: DonorUpdate) => {
    setEditingId(update.id);
    setComposerTitle(update.title);
    setComposerContent(update.content);
    setComposerPhotos(update.photos);
    setSelectedHomeTypes(update.relatedHomeTypes);
    setSelectedBeneficiaries(update.beneficiaries);
    setShowComposer(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this update?")) return;
    setActionLoading(`delete-${id}`);
    try {
      const res = await fetchWithAuth(`/api/donor-updates/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast({ title: "Deleted", description: "Update deleted" });
        fetchUpdates(updatesPage);
      } else throw new Error("Failed to delete");
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  const handlePreview = async (id: string) => {
    setPreviewLoading(true);
    setShowPreview(true);
    try {
      const res = await fetchWithAuth(`/api/donor-updates/${id}/preview`);
      if (res.ok) {
        setPreviewData(await res.json());
      } else throw new Error("Failed to load preview");
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
      setShowPreview(false);
    } finally {
      setPreviewLoading(false);
    }
  };

  const openSendDialog = (id: string) => {
    setSendUpdateId(id);
    setSelectedDonors([]);
    setDonorSearch("");
    setDonorResults([]);
    setSendChannel("EMAIL");
    setAutoSelectMode("");
    setShowSendDialog(true);
  };

  const handleAutoSelectDonors = async (mode: string) => {
    setAutoSelectMode(mode);
    try {
      let res;
      const update = updates.find((u) => u.id === sendUpdateId);
      if (!update) return;

      if (mode === "home" && update.relatedHomeTypes.length > 0) {
        res = await fetchWithAuth(`/api/donor-updates/donors-by-home?homeTypes=${update.relatedHomeTypes.join(",")}`);
      } else if (mode === "beneficiary" && update.relatedBeneficiaryIds.length > 0) {
        res = await fetchWithAuth(`/api/donor-updates/donors-by-beneficiaries?ids=${update.relatedBeneficiaryIds.join(",")}`);
      }

      if (res?.ok) {
        const donors = await res.json();
        setSelectedDonors((prev) => {
          const existing = new Set(prev.map((d) => d.id));
          const newDonors = donors.filter((d: DonorResult) => !existing.has(d.id));
          return [...prev, ...newDonors];
        });
        toast({ title: "Donors Added", description: `${donors.length} sponsor(s) found` });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSend = async () => {
    if (!sendUpdateId || selectedDonors.length === 0) {
      toast({ title: "Error", description: "Select at least one donor", variant: "destructive" });
      return;
    }

    setActionLoading("send");
    try {
      const res = await fetchWithAuth(`/api/donor-updates/${sendUpdateId}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          donorIds: selectedDonors.map((d) => d.id),
          channel: sendChannel,
        }),
      });

      const result = await res.json();
      if (res.ok) {
        toast({ title: "Sent", description: result.message });
        setShowSendDialog(false);
        fetchUpdates(updatesPage);
        fetchHistory(1);
      } else throw new Error(result.message || "Failed to send");
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  const addPhoto = () => {
    if (composerPhotoUrl.trim()) {
      setComposerPhotos((prev) => [...prev, composerPhotoUrl.trim()]);
      setComposerPhotoUrl("");
    }
  };

  const toggleHomeType = (ht: string) => {
    setSelectedHomeTypes((prev) =>
      prev.includes(ht) ? prev.filter((h) => h !== ht) : [...prev, ht]
    );
  };

  const addBeneficiary = (b: BeneficiaryResult) => {
    if (!selectedBeneficiaries.find((sb) => sb.id === b.id)) {
      setSelectedBeneficiaries((prev) => [...prev, b]);
    }
    setBeneficiarySearch("");
    setBeneficiaryResults([]);
  };

  const addDonor = (d: DonorResult) => {
    if (!selectedDonors.find((sd) => sd.id === d.id)) {
      setSelectedDonors((prev) => [...prev, d]);
    }
    setDonorSearch("");
    setDonorResults([]);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Donor Updates</h1>
          <p className="text-muted-foreground">Create and send updates to your donors</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadAll} data-testid="button-refresh">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={() => { resetComposer(); setShowComposer(true); }} data-testid="button-new-update">
            <Plus className="mr-2 h-4 w-4" />
            New Update
          </Button>
        </div>
      </div>

      <div className="grid gap-3 grid-cols-2 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <FileText className="h-3 w-3" /> Total Updates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-updates">{updatesTotal}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Send className="h-3 w-3" /> Messages Sent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-sent">{historyTotal}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <FileText className="h-3 w-3" /> Drafts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-drafts">{updates.filter((u) => u.isDraft).length}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="updates" className="space-y-4">
        <TabsList data-testid="tabs-donor-updates">
          <TabsTrigger value="updates" data-testid="tab-updates">
            <FileText className="mr-2 h-4 w-4" />
            Updates ({updatesTotal})
          </TabsTrigger>
          <TabsTrigger value="history" data-testid="tab-history">
            <History className="mr-2 h-4 w-4" />
            Sent History ({historyTotal})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="updates">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">All Updates</CardTitle>
            </CardHeader>
            <CardContent>
              {updates.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No updates yet. Create your first update to get started.
                </div>
              ) : (
                <>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Title</TableHead>
                          <TableHead>Related To</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Sent To</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {updates.map((update) => (
                          <TableRow key={update.id} data-testid={`row-update-${update.id}`}>
                            <TableCell>
                              <div className="font-medium">{update.title}</div>
                              <div className="text-xs text-muted-foreground line-clamp-1">{update.content.substring(0, 80)}...</div>
                              {update.photos.length > 0 && (
                                <span className="text-xs text-muted-foreground">{update.photos.length} photo(s)</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {update.relatedHomeTypes.map((h) => (
                                  <Badge key={h} variant="outline" className="text-xs">{h.replace(/_/g, " ")}</Badge>
                                ))}
                                {update.beneficiaries.map((b) => (
                                  <Badge key={b.id} variant="secondary" className="text-xs">{b.fullName}</Badge>
                                ))}
                                {update.relatedHomeTypes.length === 0 && update.beneficiaries.length === 0 && (
                                  <span className="text-xs text-muted-foreground">General</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={update.isDraft ? "secondary" : "default"}>
                                {update.isDraft ? "Draft" : "Published"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <span className="text-muted-foreground">{update.dispatchCount}</span>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {new Date(update.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center gap-1 justify-end">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button size="icon" variant="ghost" onClick={() => handlePreview(update.id)} data-testid={`button-preview-${update.id}`}>
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Preview</TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button size="icon" variant="ghost" onClick={() => handleEdit(update)} data-testid={`button-edit-${update.id}`}>
                                      <FileText className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Edit</TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button size="icon" variant="ghost" onClick={() => openSendDialog(update.id)} data-testid={`button-send-${update.id}`}>
                                      <Send className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Send to Donors</TooltipContent>
                                </Tooltip>
                                {hasPermission(user?.role, "donorUpdates", "delete") && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={() => handleDelete(update.id)}
                                        disabled={actionLoading === `delete-${update.id}`}
                                        data-testid={`button-delete-${update.id}`}
                                      >
                                        {actionLoading === `delete-${update.id}` ? (
                                          <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                          <Trash2 className="h-4 w-4" />
                                        )}
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Delete</TooltipContent>
                                  </Tooltip>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {updatesTotalPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <p className="text-sm text-muted-foreground">
                        Page {updatesPage} of {updatesTotalPages} ({updatesTotal} total)
                      </p>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => fetchUpdates(updatesPage - 1)} disabled={updatesPage <= 1} data-testid="button-updates-prev">
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => fetchUpdates(updatesPage + 1)} disabled={updatesPage >= updatesTotalPages} data-testid="button-updates-next">
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Sent Message History</CardTitle>
            </CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No messages sent yet</div>
              ) : (
                <>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Update</TableHead>
                          <TableHead>Donor</TableHead>
                          <TableHead>Channel</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {history.map((item) => (
                          <TableRow key={item.id} data-testid={`row-history-${item.id}`}>
                            <TableCell className="text-muted-foreground text-sm">
                              {new Date(item.createdAt).toLocaleDateString("en-IN", {
                                day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
                              })}
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">{item.updateTitle}</div>
                            </TableCell>
                            <TableCell>
                              <Link href={`/dashboard/donors/${item.donorId}`} className="hover:underline">
                                <div className="font-medium">{item.donorName}</div>
                                <div className="text-xs text-muted-foreground">{item.donorCode}</div>
                              </Link>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{item.channel}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={item.status === "SENT" ? "default" : item.status === "QUEUED" ? "secondary" : "outline"}>
                                {item.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {historyTotalPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <p className="text-sm text-muted-foreground">
                        Page {historyPage} of {historyTotalPages} ({historyTotal} total)
                      </p>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => fetchHistory(historyPage - 1)} disabled={historyPage <= 1} data-testid="button-history-prev">
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => fetchHistory(historyPage + 1)} disabled={historyPage >= historyTotalPages} data-testid="button-history-next">
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ComposerDialog
        open={showComposer}
        editingId={editingId}
        composerTitle={composerTitle}
        setComposerTitle={setComposerTitle}
        composerContent={composerContent}
        setComposerContent={setComposerContent}
        composerPhotos={composerPhotos}
        setComposerPhotos={setComposerPhotos}
        composerPhotoUrl={composerPhotoUrl}
        setComposerPhotoUrl={setComposerPhotoUrl}
        addPhoto={addPhoto}
        selectedHomeTypes={selectedHomeTypes}
        toggleHomeType={toggleHomeType}
        beneficiarySearch={beneficiarySearch}
        setBeneficiarySearch={setBeneficiarySearch}
        beneficiarySearchLoading={beneficiarySearchLoading}
        beneficiaryResults={beneficiaryResults}
        selectedBeneficiaries={selectedBeneficiaries}
        setSelectedBeneficiaries={setSelectedBeneficiaries}
        addBeneficiary={addBeneficiary}
        actionLoading={actionLoading}
        handleSave={handleSave}
        resetComposer={resetComposer}
      />

      <SendDialog
        open={showSendDialog}
        onOpenChange={setShowSendDialog}
        sendChannel={sendChannel}
        setSendChannel={setSendChannel}
        updates={updates}
        sendUpdateId={sendUpdateId}
        handleAutoSelectDonors={handleAutoSelectDonors}
        donorSearch={donorSearch}
        setDonorSearch={setDonorSearch}
        donorSearchLoading={donorSearchLoading}
        donorResults={donorResults}
        addDonor={addDonor}
        selectedDonors={selectedDonors}
        setSelectedDonors={setSelectedDonors}
        actionLoading={actionLoading}
        handleSend={handleSend}
      />

      <PreviewDialog
        open={showPreview}
        onOpenChange={setShowPreview}
        previewLoading={previewLoading}
        previewData={previewData}
      />
    </div>
  );
}
