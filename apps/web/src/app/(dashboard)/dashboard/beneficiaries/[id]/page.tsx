"use client";

import { useEffect, useState, useCallback, useMemo, type ChangeEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  ArrowLeft,
  Loader2,
  HandHeart,
  Heart,
  MessageSquare,
  Plus,
  Send,
  Mail,
  Ruler,
  Stethoscope,
  GraduationCap,
  FileText,
  AlertTriangle,
  Check,
  Paperclip,
} from "lucide-react";
import { SiWhatsapp } from "react-icons/si";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { useToast } from "@/hooks/use-toast";
import { fetchWithAuth, authStorage } from "@/lib/auth";
import { canAccessModule } from "@/lib/permissions";
import { AccessDenied } from "@/components/access-denied";

import type {
  Beneficiary,
  Sponsorship,
  SponsorshipHistoryEntry,
  DonorSearchResult,
  BeneficiaryMetric,
  ProgressCard,
  HealthEvent,
  HealthTimelineItem,
  EducationTimelineItem,
  BeneficiaryDocument,
} from "./types";

import { MONTHS } from "./constants";
import { getTermLabel, formatFileSize } from "./utils";

import BeneficiaryHeader from "./components/BeneficiaryHeader";
import BeneficiaryOverviewTab from "./components/BeneficiaryOverviewTab";
import BeneficiarySponsorsTab from "./components/BeneficiarySponsorsTab";
import BeneficiaryUpdatesTab from "./components/BeneficiaryUpdatesTab";
import BeneficiaryTimelineTab from "./components/BeneficiaryTimelineTab";
import BeneficiaryHealthTab from "./components/BeneficiaryHealthTab";
import BeneficiaryAcademicsTab from "./components/BeneficiaryAcademicsTab";
import BeneficiaryDocumentsTab from "./components/BeneficiaryDocumentsTab";

import AddHealthEventDialog from "./dialogs/AddHealthEventDialog";
import AddProgressCardDialog from "./dialogs/AddProgressCardDialog";
import UploadDocumentDialog from "./dialogs/UploadDocumentDialog";
import LinkPhotoDialog from "./dialogs/LinkPhotoDialog";
import SponsorshipStatusDialog from "./dialogs/SponsorshipStatusDialog";
import SponsorshipHistoryDialog from "./dialogs/SponsorshipHistoryDialog";
import EditBeneficiaryDialog from "./dialogs/EditBeneficiaryDialog";


    } catch (error) {
      console.error("Failed to fetch education timeline:", error);
    } finally {
      setEducationTimelineLoading(false);
    }
  }, [beneficiaryId]);

  useEffect(() => {
    fetchBeneficiary().then(() => {
      fetchMetrics();
      fetchProgressCards();
      fetchHealthEvents();
      fetchDocuments();
      fetchHealthTimeline();
      fetchEducationTimeline();
    });
  }, [
    fetchBeneficiary,
    fetchMetrics,
    fetchProgressCards,
    fetchHealthEvents,
    fetchDocuments,
    fetchHealthTimeline,
    fetchEducationTimeline,
  ]);

  

      toast({ title: "Success", description: "Sponsor linked successfully" });

      setShowAddSponsorDialog(false);
      setSelectedDonor(null);
      setDonorSearch("");
      setNewSponsorship({
        sponsorshipType: "FULL",
        amount: "",
        inKindItem: "",
        frequency: "ADHOC",
        startDate: format(new Date(), "yyyy-MM-dd"),
        notes: "",
      });
      fetchBeneficiary();
    } catch (error: any) {
      console.error("Failed to add sponsor:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to add sponsor",
        variant: "destructive",
      });
    } finally {
      setAddSponsorLoading(false);
    }
  };

 

      if (!response.ok) throw new Error("Failed to add update");

      toast({ title: "Success", description: "Update added successfully" });

      setShowAddUpdateDialog(false);
      setNewUpdate({ title: "", content: "", updateType: "GENERAL", isPrivate: false });
      setSelectedAttachmentIds([]);
      fetchBeneficiary();
    } catch (error) {
      console.error("Failed to add update:", error);
      toast({
        title: "Error",
        description: "Failed to add update",
        variant: "destructive",
      });
    } finally {
      setAddUpdateLoading(false);
    }
  };

 
  const user = authStorage.getUser();
  const canEdit = user?.role === "ADMIN" || user?.role === "STAFF";
  const isAdmin = user?.role === "ADMIN";

  if (user && !canAccessModule(user?.role, "beneficiaries")) {
    return <AccessDenied />;
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!beneficiary) {
    return (
      <div className="p-6">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <HandHeart className="h-12 w-12 mb-4 opacity-50 text-muted-foreground" />
            <p className="text-lg font-medium">Beneficiary not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <Button
        variant="ghost"
        onClick={() => router.push("/dashboard/beneficiaries")}
        className="mb-2"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Beneficiaries
      </Button>

      <Card>
        <CardContent>
          <BeneficiaryHeader
            beneficiary={beneficiary}
            canEdit={canEdit}
            isAdmin={isAdmin}
            photoUploading={photoUploading}
            onPhotoUpload={handlePhotoUpload}
            onPhotoRemove={handlePhotoRemove}
            onOpenLinkPhoto={() => setShowLinkPhotoDialog(true)}
            onOpenEdit={openEditDialog}
          />
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex flex-wrap gap-1 w-full max-w-2xl h-auto">
          <TabsTrigger value="overview" data-testid="tab-overview">
            Overview
          </TabsTrigger>
          <TabsTrigger value="sponsors" data-testid="tab-sponsors">
            Sponsors
          </TabsTrigger>
          <TabsTrigger value="updates" data-testid="tab-updates">
            Updates
          </TabsTrigger>
          <TabsTrigger value="timeline" data-testid="tab-timeline">
            Timeline
          </TabsTrigger>
          <TabsTrigger value="health" data-testid="tab-health">
            Health & Growth
          </TabsTrigger>
          <TabsTrigger value="academics" data-testid="tab-academics">
            Academics
          </TabsTrigger>
          <TabsTrigger value="documents" data-testid="tab-documents">
            Documents
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <BeneficiaryOverviewTab beneficiary={beneficiary} />
        </TabsContent>

        <TabsContent value="sponsors" className="space-y-4">
          <BeneficiarySponsorsTab
            beneficiary={beneficiary}
            canEdit={canEdit}
            onOpenAddSponsor={() => setShowAddSponsorDialog(true)}
            onOpenStatusChange={handleOpenStatusChange}
            onViewHistory={handleViewHistory}
            onDeleteSponsorship={handleDeleteSponsorship}
            onCopyMessage={copyMessage}
            onViewDonorProfile={(donorId) => router.push(`/dashboard/donors/${donorId}`)}
            onSendWhatsApp={async (sponsorship) => {
              try {
                const res = await fetchWithAuth("/api/communications/whatsapp/send-freeform", {
                  method: "POST",
                  body: JSON.stringify({
                    donorId: sponsorship.donorId || sponsorship.donor?.id || "",
                    toE164: sponsorship.donor.primaryPhone,
                    message: decodeURIComponent(generateWhatsAppMessage(sponsorship)),
                  }),
                });

                if (res.ok) {
                  toast({ title: "WhatsApp Sent", description: "Message sent to sponsor" });
                } else {
                  toast({ title: "WhatsApp Failed", variant: "destructive" });
                }
              } catch {
                toast({ title: "Error sending WhatsApp", variant: "destructive" });
              }
            }}
          />
        </TabsContent>

        <TabsContent value="updates" className="space-y-4">
          <BeneficiaryUpdatesTab
            beneficiary={beneficiary}
            onOpenAddUpdate={() => setShowAddUpdateDialog(true)}
            onOpenSendToSponsors={handleOpenSendToSponsors}
          />
        </TabsContent>

        <TabsContent value="timeline" className="space-y-4">
          <BeneficiaryTimelineTab
            timelineEvents={beneficiary.timelineEvents}
            loading={loading}
          />
        </TabsContent>

        <TabsContent value="health" className="space-y-6">
          <BeneficiaryHealthTab
            metrics={metrics}
            metricsLoading={metricsLoading}
            healthEvents={healthEvents}
            healthEventsLoading={healthEventsLoading}
            healthTimeline={healthTimeline}
            healthTimelineLoading={healthTimelineLoading}
            growthChartData={growthChartData}
            exportingPdf={exportingPdf}
            beneficiaryName={beneficiary.fullName}
            onOpenAddMetric={() => setShowAddMetricDialog(true)}
            onOpenAddHealthEvent={() => setShowAddHealthEventDialog(true)}
            onExportHealthPdf={handleExportHealthPdf}
            onNotifySponsors={handleNotifySponsors}
            onCopyHealthWhatsApp={(event) => {
              const text = `Health Update - ${beneficiary.fullName}\n\n${event.title}\n\n${event.description}\n\nDate: ${format(new Date(event.eventDate), "MMM d, yyyy")}\nSeverity: ${event.severity}\n\nPlease reach out if you have any questions.`;
              navigator.clipboard.writeText(text);
              toast({
                title: "Copied",
                description: "WhatsApp message copied to clipboard",
              });
            }}
          />
        </TabsContent>

        <TabsContent value="academics" className="space-y-6">
          <BeneficiaryAcademicsTab
            progressCards={progressCards}
            progressCardsLoading={progressCardsLoading}
            educationTimeline={educationTimeline}
            educationTimelineLoading={educationTimelineLoading}
            educationExporting={educationExporting}
            hasSponsors={beneficiary.sponsorships.length > 0}
            onExportEducationPdf={handleExportEducationPdf}
            onOpenAddProgressCard={() => setShowAddProgressCardDialog(true)}
            onShareProgressCard={handleShareProgressCard}
          />
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <BeneficiaryDocumentsTab
            documents={documents}
            documentsLoading={documentsLoading}
            onOpenUploadDocument={() => setShowUploadDocumentDialog(true)}
            onViewDocument={handleViewDocument}
          />
        </TabsContent>
      </Tabs>

      {/* Keep inline for now: exact original behavior */}
      <Dialog open={showAddSponsorDialog} onOpenChange={setShowAddSponsorDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5" />
              Link Sponsor
            </DialogTitle>
            <DialogDescription>
              Connect a donor as a sponsor for {beneficiary.fullName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Search Donor *</Label>
              {selectedDonor ? (
                <div className="flex items-center justify-between p-3 border rounded-md bg-muted/50">
                  <div>
                    <p className="font-medium">
                      {selectedDonor.firstName} {selectedDonor.lastName || ""}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {selectedDonor.donorCode}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedDonor(null)}>
                    Change
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Input
                    placeholder="Search by name, code, or phone..."
                    value={donorSearch}
                    onChange={(e) => setDonorSearch(e.target.value)}
                    data-testid="input-search-donor"
                  />
                  {donorSearchLoading && (
                    <p className="text-sm text-muted-foreground">Searching...</p>
                  )}
                  {donorSearchResults.length > 0 && (
                    <div className="border rounded-md max-h-40 overflow-y-auto">
                      {donorSearchResults.map((donor) => (
                        <button
                          key={donor.id}
                          type="button"
                          className="w-full px-3 py-2 text-left hover:bg-muted flex items-center justify-between"
                          onClick={() => {
                            setSelectedDonor(donor);
                            setDonorSearch("");
                            setDonorSearchResults([]);
                          }}
                        >
                          <span>
                            {donor.firstName} {donor.lastName || ""}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {donor.donorCode}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={newSponsorship.sponsorshipType}
                  onValueChange={(v) =>
                    setNewSponsorship((prev) => ({ ...prev, sponsorshipType: v }))
                  }
                >
                  <SelectTrigger data-testid="select-sponsorship-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SPONSORSHIP_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Frequency</Label>
                <Select
                  value={newSponsorship.frequency}
                  onValueChange={(v) =>
                    setNewSponsorship((prev) => ({ ...prev, frequency: v }))
                  }
                >
                  <SelectTrigger data-testid="select-frequency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FREQUENCIES.map((f) => (
                      <SelectItem key={f.value} value={f.value}>
                        {f.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Amount (optional)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={newSponsorship.amount}
                  onChange={(e) =>
                    setNewSponsorship((prev) => ({ ...prev, amount: e.target.value }))
                  }
                  data-testid="input-amount"
                />
              </div>

              <div className="space-y-2">
                <Label>In-Kind Item (optional)</Label>
                <Input
                  placeholder='e.g. "Rice bag"'
                  value={newSponsorship.inKindItem}
                  onChange={(e) =>
                    setNewSponsorship((prev) => ({ ...prev, inKindItem: e.target.value }))
                  }
                  data-testid="input-inkind"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={newSponsorship.startDate}
                onChange={(e) =>
                  setNewSponsorship((prev) => ({ ...prev, startDate: e.target.value }))
                }
                data-testid="input-start-date"
              />
            </div>

            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Textarea
                placeholder="Additional notes..."
                value={newSponsorship.notes}
                onChange={(e) =>
                  setNewSponsorship((prev) => ({ ...prev, notes: e.target.value }))
                }
                data-testid="textarea-notes"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddSponsorDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddSponsor}
              disabled={addSponsorLoading || !selectedDonor}
              data-testid="button-submit-sponsor"
            >
              {addSponsorLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Link Sponsor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showAddUpdateDialog} onOpenChange={setShowAddUpdateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Add Update
            </DialogTitle>
            <DialogDescription>
              Share an update about {beneficiary.fullName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                placeholder="Enter update title"
                value={newUpdate.title}
                onChange={(e) =>
                  setNewUpdate((prev) => ({ ...prev, title: e.target.value }))
                }
                data-testid="input-update-title"
              />
            </div>

            <div className="space-y-2">
              <Label>Update Type</Label>
              <Select
                value={newUpdate.updateType}
                onValueChange={(value) =>
                  setNewUpdate((prev) => ({ ...prev, updateType: value }))
                }
              >
                <SelectTrigger data-testid="select-update-type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GENERAL">General Update</SelectItem>
                  <SelectItem value="MILESTONE">Milestone</SelectItem>
                  <SelectItem value="ACADEMIC">Academic Progress</SelectItem>
                  <SelectItem value="EDUCATION">Education</SelectItem>
                  <SelectItem value="ACHIEVEMENT">Achievement</SelectItem>
                  <SelectItem value="HEALTH">Health Update</SelectItem>
                  <SelectItem value="PHOTO">Photo Update</SelectItem>
                  <SelectItem value="EVENT">Event / Activity</SelectItem>
                  <SelectItem value="THANK_YOU">Thank You Message</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Content *</Label>
              <Textarea
                placeholder="Write update content..."
                value={newUpdate.content}
                onChange={(e) =>
                  setNewUpdate((prev) => ({ ...prev, content: e.target.value }))
                }
                rows={4}
                data-testid="textarea-update-content"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is-private"
                checked={newUpdate.isPrivate}
                onCheckedChange={(checked) =>
                  setNewUpdate((prev) => ({ ...prev, isPrivate: checked }))
                }
              />
              <Label htmlFor="is-private" className="text-sm">
                Private update (only visible to staff)
              </Label>
            </div>

            {beneficiary.documents && beneficiary.documents.length > 0 && (
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <Paperclip className="h-4 w-4" />
                  Attach Documents
                </Label>
                <p className="text-xs text-muted-foreground">
                  Select documents from the vault to attach to this update
                </p>
                <div className="max-h-32 overflow-y-auto space-y-1 border rounded-md p-2">
                  {beneficiary.documents
                    .filter((doc: any) => !doc.isSensitive)
                    .map((doc: any) => (
                      <div
                        key={doc.id}
                        className={`flex items-center gap-2 p-1.5 rounded cursor-pointer text-sm hover-elevate ${
                          selectedAttachmentIds.includes(doc.id) ? "bg-primary/10" : ""
                        }`}
                        onClick={() => {
                          setSelectedAttachmentIds((prev) =>
                            prev.includes(doc.id)
                              ? prev.filter((id) => id !== doc.id)
                              : [...prev, doc.id]
                          );
                        }}
                        data-testid={`attachment-option-${doc.id}`}
                      >
                        <div
                          className={`h-4 w-4 rounded border flex items-center justify-center flex-shrink-0 ${
                            selectedAttachmentIds.includes(doc.id)
                              ? "bg-primary border-primary text-primary-foreground"
                              : "border-muted-foreground/30"
                          }`}
                        >
                          {selectedAttachmentIds.includes(doc.id) && (
                            <Check className="h-3 w-3" />
                          )}
                        </div>
                        <FileText className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                        <span className="truncate">{doc.title}</span>
                        <Badge variant="secondary" className="ml-auto text-xs">
                          {doc.docType?.replace(/_/g, " ")}
                        </Badge>
                      </div>
                    ))}
                </div>
                {selectedAttachmentIds.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {selectedAttachmentIds.length} document
                    {selectedAttachmentIds.length !== 1 ? "s" : ""} selected
                  </p>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddUpdateDialog(false);
                setSelectedAttachmentIds([]);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddUpdate}
              disabled={addUpdateLoading}
              data-testid="button-submit-update"
            >
              {addUpdateLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Add Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showSendToSponsorsDialog} onOpenChange={setShowSendToSponsorsDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Send Update to Sponsors
            </DialogTitle>
            <DialogDescription>
              Share this update with the beneficiary&apos;s sponsors
            </DialogDescription>
          </DialogHeader>

          {loadingSponsorData ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : sponsorDispatchData ? (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Update</Label>
                <p className="text-sm font-medium">{sponsorDispatchData.update?.title}</p>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {sponsorDispatchData.update?.content}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Sponsors ({sponsorDispatchData.sponsors?.length || 0})</Label>
                {sponsorDispatchData.sponsors?.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No sponsors linked to this beneficiary
                  </p>
                ) : (
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {sponsorDispatchData.sponsors?.map((sponsor: any) => (
                      <div
                        key={sponsor.donorId}
                        className="text-sm flex justify-between items-center"
                      >
                        <span>{sponsor.donorName}</span>
                        <div className="flex gap-1">
                          {sponsor.personalEmail && (
                            <Badge variant="outline" className="text-xs">
                              Email
                            </Badge>
                          )}
                          {sponsor.primaryPhone && (
                            <Badge variant="outline" className="text-xs">
                              Phone
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {sponsorDispatchData.sponsors?.length > 0 && (
                <div className="space-y-2">
                  <Label>Send via</Label>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => handleSendToSponsors("EMAIL")}
                      disabled={sendingToSponsors}
                      className="flex-1"
                    >
                      {sendingToSponsors ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Mail className="h-4 w-4 mr-2" />
                      )}
                      Email
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleSendToSponsors("WHATSAPP")}
                      disabled={sendingToSponsors}
                      className="flex-1"
                    >
                      {sendingToSponsors ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <SiWhatsapp className="h-4 w-4 mr-2" />
                      )}
                      WhatsApp
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Failed to load sponsor information
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSendToSponsorsDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showAddMetricDialog} onOpenChange={setShowAddMetricDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Ruler className="h-5 w-5" />
              Add Measurement
            </DialogTitle>
            <DialogDescription>
              Record height and weight measurements for {beneficiary.fullName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Date *</Label>
              <Input
                type="date"
                value={newMetric.recordedOn}
                onChange={(e) =>
                  setNewMetric((prev) => ({ ...prev, recordedOn: e.target.value }))
                }
                data-testid="input-metric-date"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Height (cm)</Label>
                <Input
                  type="number"
                  placeholder="e.g. 120"
                  value={newMetric.heightCm}
                  onChange={(e) =>
                    setNewMetric((prev) => ({ ...prev, heightCm: e.target.value }))
                  }
                  data-testid="input-metric-height"
                />
              </div>

              <div className="space-y-2">
                <Label>Weight (kg)</Label>
                <Input
                  type="number"
                  placeholder="e.g. 30"
                  value={newMetric.weightKg}
                  onChange={(e) =>
                    setNewMetric((prev) => ({ ...prev, weightKg: e.target.value }))
                  }
                  data-testid="input-metric-weight"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Health Status</Label>
              <Select
                value={newMetric.healthStatus || "NORMAL"}
                onValueChange={(value) =>
                  setNewMetric((prev) => ({ ...prev, healthStatus: value }))
                }
              >
                <SelectTrigger data-testid="select-metric-health-status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NORMAL">Normal</SelectItem>
                  <SelectItem value="SICK">Sick</SelectItem>
                  <SelectItem value="HOSPITALIZED">Hospitalized</SelectItem>
                  <SelectItem value="UNDER_TREATMENT">Under Treatment</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Textarea
                placeholder="Any observations..."
                value={newMetric.notes}
                onChange={(e) =>
                  setNewMetric((prev) => ({ ...prev, notes: e.target.value }))
                }
                data-testid="textarea-metric-notes"
              />
            </div>
          </div>

        
}
