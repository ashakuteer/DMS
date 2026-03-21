"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { format, isPast, differenceInDays } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Loader2,
  Plus,
  Search,
  FileText,
  Download,
  Trash2,
  Edit,
  Upload,
  History,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FolderLock,
  Eye,
  X,
  Calendar,
  Shield,
  FileCheck,
  Handshake,
  Scale,
  Landmark,
  BookOpen,
  File,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { fetchWithAuth, authStorage } from "@/lib/auth";
import { canAccessModule, hasPermission } from "@/lib/permissions";
import { AccessDenied } from "@/components/access-denied";

interface NgoDocument {
  id: string;
  title: string;
  description: string | null;
  category: string;
  fileName: string;
  filePath: string;
  mimeType: string;
  sizeBytes: number;
  expiryDate: string | null;
  isActive: boolean;
  currentVersion: number;
  uploadedById: string;
  createdAt: string;
  updatedAt: string;
  uploadedBy: { id: string; name: string };
  _count: { versions: number };
}

interface DocVersion {
  id: string;
  documentId: string;
  versionNumber: number;
  fileName: string;
  filePath: string;
  mimeType: string;
  sizeBytes: number;
  changeNote: string | null;
  uploadedById: string;
  createdAt: string;
  uploadedBy: { id: string; name: string };
}

interface AccessLogEntry {
  id: string;
  documentId: string;
  userId: string;
  action: string;
  accessedAt: string;
  user: { id: string; name: string };
}

interface Stats {
  totalDocs: number;
  expiredCount: number;
  expiringSoonCount: number;
  validCount: number;
  categoryBreakdown: { category: string; count: number }[];
}

const CATEGORIES = [
  { value: "CERTIFICATE", label: "Certificate" },
  { value: "COMPLIANCE", label: "Compliance" },
  { value: "MOU", label: "MOU" },
  { value: "LEGAL", label: "Legal" },
  { value: "FINANCIAL", label: "Financial" },
  { value: "POLICY", label: "Policy" },
  { value: "REPORT", label: "Report" },
  { value: "OTHER", label: "Other" },
];

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  CERTIFICATE: FileCheck,
  COMPLIANCE: Shield,
  MOU: Handshake,
  LEGAL: Scale,
  FINANCIAL: Landmark,
  POLICY: BookOpen,
  REPORT: FileText,
  OTHER: File,
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getExpiryStatus(expiryDate: string | null): { label: string; variant: "default" | "destructive" | "secondary" | "outline"; daysLeft: number | null } {
  if (!expiryDate) return { label: "No Expiry", variant: "secondary", daysLeft: null };
  const expiry = new Date(expiryDate);
  const days = differenceInDays(expiry, new Date());
  if (days < 0) return { label: `Expired ${Math.abs(days)}d ago`, variant: "destructive", daysLeft: days };
  if (days <= 30) return { label: `${days}d left`, variant: "default", daysLeft: days };
  return { label: `Valid (${days}d)`, variant: "outline", daysLeft: days };
}

export default function NgoDocumentsPage() {
  const { toast } = useToast();
  const user = authStorage.getUser();
  const userRole = user?.role;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const versionFileRef = useRef<HTMLInputElement>(null);

  const [documents, setDocuments] = useState<NgoDocument[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [expiryFilter, setExpiryFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    title: "",
    description: "",
    category: "CERTIFICATE",
    expiryDate: "",
    file: null as File | null,
  });

  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingDoc, setEditingDoc] = useState<NgoDocument | null>(null);
  const [editForm, setEditForm] = useState({ title: "", description: "", category: "", expiryDate: "" });
  const [saving, setSaving] = useState(false);

  const [showVersionDialog, setShowVersionDialog] = useState(false);
  const [versionDoc, setVersionDoc] = useState<NgoDocument | null>(null);
  const [versions, setVersions] = useState<DocVersion[]>([]);
  const [versionsLoading, setVersionsLoading] = useState(false);

  const [showNewVersionDialog, setShowNewVersionDialog] = useState(false);
  const [newVersionFile, setNewVersionFile] = useState<File | null>(null);
  const [newVersionNote, setNewVersionNote] = useState("");
  const [uploadingVersion, setUploadingVersion] = useState(false);

  const [showAccessLog, setShowAccessLog] = useState(false);
  const [accessLog, setAccessLog] = useState<AccessLogEntry[]>([]);
  const [accessLogLoading, setAccessLogLoading] = useState(false);
  const [accessLogDocId, setAccessLogDocId] = useState("");

  if (!canAccessModule(userRole, "ngoDocuments")) {
    return <AccessDenied />;
  }

  const fetchDocuments = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: p.toString(),
        limit: "20",
      });
      if (categoryFilter !== "ALL") params.append("category", categoryFilter);
      if (search.trim()) params.append("search", search.trim());
      if (expiryFilter !== "ALL") params.append("expiryStatus", expiryFilter);

      const res = await fetchWithAuth(`/api/ngo-documents?${params}`);
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.items);
        setTotal(data.total);
        setTotalPages(data.totalPages);
        setPage(data.page);
        setStats(data.stats);
      } else if (res.status === 401) {
        toast({ title: "Session Expired", description: "Please log in again.", variant: "destructive" });
      } else if (res.status === 403) {
        toast({ title: "Access Denied", description: "You do not have permission to view documents.", variant: "destructive" });
      } else {
        toast({ title: "Error", description: `Failed to load documents (${res.status})`, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Network Error", description: "Unable to reach the server. Check your connection.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, search, expiryFilter]);

  useEffect(() => {
    fetchDocuments(1);
  }, [categoryFilter, expiryFilter]);

  const handleSearch = () => fetchDocuments(1);

  const handleUpload = async () => {
    if (!uploadForm.file || !uploadForm.title.trim()) {
      toast({ title: "Error", description: "Title and file are required", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", uploadForm.file);
      formData.append("title", uploadForm.title.trim());
      formData.append("description", uploadForm.description.trim());
      formData.append("category", uploadForm.category);
      if (uploadForm.expiryDate) formData.append("expiryDate", uploadForm.expiryDate);

      const res = await fetchWithAuth("/api/ngo-documents", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        toast({ title: "Success", description: "Document uploaded successfully" });
        setShowUploadDialog(false);
        setUploadForm({ title: "", description: "", category: "CERTIFICATE", expiryDate: "", file: null });
        fetchDocuments(1);
      } else {
        const err = await res.json();
        toast({ title: "Error", description: err.message || "Upload failed", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Upload failed", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (doc: NgoDocument) => {
    setEditingDoc(doc);
    setEditForm({
      title: doc.title,
      description: doc.description || "",
      category: doc.category,
      expiryDate: doc.expiryDate ? doc.expiryDate.split("T")[0] : "",
    });
    setShowEditDialog(true);
  };

  const handleSaveEdit = async () => {
    if (!editingDoc) return;
    setSaving(true);
    try {
      const res = await fetchWithAuth(`/api/ngo-documents/${editingDoc.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editForm.title.trim(),
          description: editForm.description.trim(),
          category: editForm.category,
          expiryDate: editForm.expiryDate || null,
        }),
      });
      if (res.ok) {
        toast({ title: "Success", description: "Document updated" });
        setShowEditDialog(false);
        fetchDocuments(page);
      } else {
        const err = await res.json();
        toast({ title: "Error", description: err.message || "Update failed", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Update failed", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (doc: NgoDocument) => {
    if (!confirm(`Delete "${doc.title}"? This action cannot be undone.`)) return;
    try {
      const res = await fetchWithAuth(`/api/ngo-documents/${doc.id}`, { method: "DELETE" });
      if (res.ok) {
        toast({ title: "Success", description: "Document deleted" });
        fetchDocuments(page);
      } else {
        toast({ title: "Error", description: "Delete failed", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Delete failed", variant: "destructive" });
    }
  };

  const handleDownload = async (docId: string, versionId?: string) => {
    try {
      const url = versionId
        ? `/api/ngo-documents/${docId}/download?versionId=${versionId}`
        : `/api/ngo-documents/${docId}/download`;
      const res = await fetchWithAuth(url);
      if (res.ok) {
        const blob = await res.blob();
        const contentDisposition = res.headers.get("Content-Disposition");
        let fileName = "download";
        if (contentDisposition) {
          const match = contentDisposition.match(/filename="?([^"]+)"?/);
          if (match) fileName = decodeURIComponent(match[1]);
        }
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(a.href);
      } else {
        toast({ title: "Error", description: "Download failed", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Download failed", variant: "destructive" });
    }
  };

  const openVersionHistory = async (doc: NgoDocument) => {
    setVersionDoc(doc);
    setShowVersionDialog(true);
    setVersionsLoading(true);
    try {
      const res = await fetchWithAuth(`/api/ngo-documents/${doc.id}`);
      if (res.ok) {
        const data = await res.json();
        setVersions(data.versions || []);
      }
    } catch {
      toast({ title: "Error", description: "Failed to load versions", variant: "destructive" });
    } finally {
      setVersionsLoading(false);
    }
  };

  const handleUploadNewVersion = async () => {
    if (!versionDoc || !newVersionFile) return;
    setUploadingVersion(true);
    try {
      const formData = new FormData();
      formData.append("file", newVersionFile);
      if (newVersionNote.trim()) formData.append("changeNote", newVersionNote.trim());

      const res = await fetchWithAuth(`/api/ngo-documents/${versionDoc.id}/version`, {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        toast({ title: "Success", description: "New version uploaded" });
        setShowNewVersionDialog(false);
        setNewVersionFile(null);
        setNewVersionNote("");
        openVersionHistory(versionDoc);
        fetchDocuments(page);
      } else {
        const err = await res.json();
        toast({ title: "Error", description: err.message || "Upload failed", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Version upload failed", variant: "destructive" });
    } finally {
      setUploadingVersion(false);
    }
  };

  const openAccessLog = async (docId: string) => {
    setAccessLogDocId(docId);
    setShowAccessLog(true);
    setAccessLogLoading(true);
    try {
      const res = await fetchWithAuth(`/api/ngo-documents/${docId}/access-log`);
      if (res.ok) {
        const data = await res.json();
        setAccessLog(data);
      }
    } catch {
      toast({ title: "Error", description: "Failed to load access log", variant: "destructive" });
    } finally {
      setAccessLogLoading(false);
    }
  };

  const CategoryIcon = ({ category }: { category: string }) => {
    const Icon = CATEGORY_ICONS[category] || File;
    return <Icon className="h-4 w-4" />;
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-page-title">
            <FolderLock className="h-6 w-6" />
            Document Vault
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Store and manage NGO certificates, compliance documents, and MOUs
          </p>
        </div>
        {hasPermission(userRole, "ngoDocuments", "upload") && (
          <Button onClick={() => setShowUploadDialog(true)} data-testid="button-upload-document">
            <Plus className="h-4 w-4 mr-2" />
            Upload Document
          </Button>
        )}
      </div>

      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-primary/10">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold" data-testid="text-stat-total">{stats.totalDocs}</p>
                  <p className="text-xs text-muted-foreground">Total Documents</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-green-500/10">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold" data-testid="text-stat-valid">{stats.validCount}</p>
                  <p className="text-xs text-muted-foreground">Valid</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-yellow-500/10">
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold" data-testid="text-stat-expiring">{stats.expiringSoonCount}</p>
                  <p className="text-xs text-muted-foreground">Expiring Soon</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-red-500/10">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold" data-testid="text-stat-expired">{stats.expiredCount}</p>
                  <p className="text-xs text-muted-foreground">Expired</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="text-lg">All Documents</CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Search documents..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="w-48"
                  data-testid="input-search-documents"
                />
                <Button size="icon" variant="outline" onClick={handleSearch} data-testid="button-search">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-36" data-testid="select-category-filter">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Categories</SelectItem>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={expiryFilter} onValueChange={setExpiryFilter}>
                <SelectTrigger className="w-36" data-testid="select-expiry-filter">
                  <SelectValue placeholder="Expiry Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="VALID">Valid</SelectItem>
                  <SelectItem value="EXPIRING_SOON">Expiring Soon</SelectItem>
                  <SelectItem value="EXPIRED">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FolderLock className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-lg font-medium">No documents found</p>
              <p className="text-sm">Upload your first document to get started</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Document</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Expiry</TableHead>
                      <TableHead>Version</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Uploaded By</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {documents.map((doc) => {
                      const expiry = getExpiryStatus(doc.expiryDate);
                      return (
                        <TableRow key={doc.id} data-testid={`row-document-${doc.id}`}>
                          <TableCell>
                            <div className="flex items-start gap-2 min-w-0">
                              <CategoryIcon category={doc.category} />
                              <div className="min-w-0">
                                <p className="font-medium truncate max-w-[200px]" data-testid={`text-doc-title-${doc.id}`}>{doc.title}</p>
                                {doc.description && (
                                  <p className="text-xs text-muted-foreground truncate max-w-[200px]">{doc.description}</p>
                                )}
                                <p className="text-xs text-muted-foreground">{doc.fileName}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" data-testid={`badge-category-${doc.id}`}>
                              {CATEGORIES.find((c) => c.value === doc.category)?.label || doc.category}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={expiry.variant} data-testid={`badge-expiry-${doc.id}`}>
                              {expiry.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm" data-testid={`text-version-${doc.id}`}>v{doc.currentVersion}</span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">{formatFileSize(doc.sizeBytes)}</span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">{doc.uploadedBy.name}</span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">
                              {format(new Date(doc.createdAt), "MMM d, yyyy")}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-end gap-1">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button size="icon" variant="ghost" onClick={() => handleDownload(doc.id)} data-testid={`button-download-${doc.id}`}>
                                    <Download className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Download</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button size="icon" variant="ghost" onClick={() => openVersionHistory(doc)} data-testid={`button-versions-${doc.id}`}>
                                    <History className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Version History</TooltipContent>
                              </Tooltip>
                              {hasPermission(userRole, "ngoDocuments", "edit") && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button size="icon" variant="ghost" onClick={() => handleEdit(doc)} data-testid={`button-edit-${doc.id}`}>
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Edit</TooltipContent>
                                </Tooltip>
                              )}
                              {hasPermission(userRole, "ngoDocuments", "accessLog") && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button size="icon" variant="ghost" onClick={() => openAccessLog(doc.id)} data-testid={`button-access-log-${doc.id}`}>
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Access Log</TooltipContent>
                                </Tooltip>
                              )}
                              {hasPermission(userRole, "ngoDocuments", "delete") && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button size="icon" variant="ghost" onClick={() => handleDelete(doc)} data-testid={`button-delete-${doc.id}`}>
                                      <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Delete</TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {(page - 1) * 20 + 1}-{Math.min(page * 20, total)} of {total}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={page <= 1}
                      onClick={() => fetchDocuments(page - 1)}
                      data-testid="button-prev-page"
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {page} of {totalPages}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={page >= totalPages}
                      onClick={() => fetchDocuments(page + 1)}
                      data-testid="button-next-page"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>Add a new document to the vault</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Title *</label>
              <Input
                value={uploadForm.title}
                onChange={(e) => setUploadForm((p) => ({ ...p, title: e.target.value }))}
                placeholder="e.g. NGO Registration Certificate"
                data-testid="input-upload-title"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={uploadForm.description}
                onChange={(e) => setUploadForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="Brief description of the document"
                rows={2}
                data-testid="input-upload-description"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Category *</label>
              <Select
                value={uploadForm.category}
                onValueChange={(v) => setUploadForm((p) => ({ ...p, category: v }))}
              >
                <SelectTrigger data-testid="select-upload-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Expiry Date</label>
              <Input
                type="date"
                value={uploadForm.expiryDate}
                onChange={(e) => setUploadForm((p) => ({ ...p, expiryDate: e.target.value }))}
                data-testid="input-upload-expiry"
              />
            </div>
            <div>
              <label className="text-sm font-medium">File *</label>
              <div className="mt-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.txt,.csv"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setUploadForm((p) => ({ ...p, file }));
                  }}
                  data-testid="input-upload-file"
                />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full justify-start"
                  data-testid="button-choose-file"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {uploadForm.file ? uploadForm.file.name : "Choose file (max 25MB)"}
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUploadDialog(false)}>Cancel</Button>
            <Button onClick={handleUpload} disabled={uploading} data-testid="button-submit-upload">
              {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
              Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Document</DialogTitle>
            <DialogDescription>Update document metadata</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Title</label>
              <Input
                value={editForm.title}
                onChange={(e) => setEditForm((p) => ({ ...p, title: e.target.value }))}
                data-testid="input-edit-title"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={editForm.description}
                onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))}
                rows={2}
                data-testid="input-edit-description"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Category</label>
              <Select
                value={editForm.category}
                onValueChange={(v) => setEditForm((p) => ({ ...p, category: v }))}
              >
                <SelectTrigger data-testid="select-edit-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Expiry Date</label>
              <Input
                type="date"
                value={editForm.expiryDate}
                onChange={(e) => setEditForm((p) => ({ ...p, expiryDate: e.target.value }))}
                data-testid="input-edit-expiry"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveEdit} disabled={saving} data-testid="button-save-edit">
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showVersionDialog} onOpenChange={setShowVersionDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Version History - {versionDoc?.title}</DialogTitle>
            <DialogDescription>View and download previous versions</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end mb-2">
            {hasPermission(userRole, "ngoDocuments", "upload") && (
              <Button size="sm" onClick={() => setShowNewVersionDialog(true)} data-testid="button-upload-new-version">
                <Upload className="h-4 w-4 mr-2" />
                Upload New Version
              </Button>
            )}
          </div>
          {versionsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : versions.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No versions found</p>
          ) : (
            <div className="max-h-80 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Version</TableHead>
                    <TableHead>File</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Note</TableHead>
                    <TableHead>Uploaded By</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {versions.map((v) => (
                    <TableRow key={v.id} data-testid={`row-version-${v.id}`}>
                      <TableCell>
                        <Badge variant="outline">v{v.versionNumber}</Badge>
                      </TableCell>
                      <TableCell className="text-sm truncate max-w-[150px]">{v.fileName}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatFileSize(v.sizeBytes)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground truncate max-w-[150px]">{v.changeNote || "-"}</TableCell>
                      <TableCell className="text-sm">{v.uploadedBy.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(v.createdAt), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDownload(v.documentId, v.id)}
                          data-testid={`button-download-version-${v.id}`}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showNewVersionDialog} onOpenChange={setShowNewVersionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload New Version</DialogTitle>
            <DialogDescription>Upload a new version of "{versionDoc?.title}"</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">File *</label>
              <div className="mt-1">
                <input
                  ref={versionFileRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.txt,.csv"
                  className="hidden"
                  onChange={(e) => setNewVersionFile(e.target.files?.[0] || null)}
                  data-testid="input-version-file"
                />
                <Button
                  variant="outline"
                  onClick={() => versionFileRef.current?.click()}
                  className="w-full justify-start"
                  data-testid="button-choose-version-file"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {newVersionFile ? newVersionFile.name : "Choose file"}
                </Button>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Change Note</label>
              <Textarea
                value={newVersionNote}
                onChange={(e) => setNewVersionNote(e.target.value)}
                placeholder="What changed in this version?"
                rows={2}
                data-testid="input-version-note"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewVersionDialog(false)}>Cancel</Button>
            <Button onClick={handleUploadNewVersion} disabled={uploadingVersion || !newVersionFile} data-testid="button-submit-version">
              {uploadingVersion && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Upload Version
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showAccessLog} onOpenChange={setShowAccessLog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Access Log</DialogTitle>
            <DialogDescription>History of who accessed this document</DialogDescription>
          </DialogHeader>
          {accessLogLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : accessLog.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No access history</p>
          ) : (
            <div className="max-h-80 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accessLog.map((entry) => (
                    <TableRow key={entry.id} data-testid={`row-access-${entry.id}`}>
                      <TableCell className="text-sm">{entry.user.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{entry.action}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(entry.accessedAt), "MMM d, yyyy HH:mm")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
