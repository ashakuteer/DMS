"use client";

import { useEffect, useState, useCallback } from "react";

import ReportsHeader from "./components/ReportsHeader";
import ReportsFilters from "./components/ReportsFilters";
import ReportsTable from "./components/ReportsTable";
import PaginationControls from "./components/PaginationControls";

import GenerateReportDialog from "./dialogs/GenerateReportDialog";
import ShareReportDialog from "./dialogs/ShareReportDialog";
import PreviewReportDialog from "./dialogs/PreviewReportDialog";
import TemplateManagerDialog from "./dialogs/TemplateManagerDialog";

import { useDonorReports } from "./hooks/useDonorReports";

import { authStorage } from "@/lib/auth";
import { canAccessModule, hasPermission } from "@/lib/permissions";
import { AccessDenied } from "@/components/access-denied";
import { useToast } from "@/hooks/use-toast";

import { fetchWithAuth } from "./services/donorReports.service";

export default function DonorReportsPage() {

  const { toast } = useToast()

  const user = authStorage.getUser()

  if (user && !canAccessModule(user?.role, "donorReports"))
    return <AccessDenied />

  const isAdmin = hasPermission(user?.role, "donorReports", "generate")

  const {
    reports,
    total,
    page,
    totalPages,
    loading,
    setPage,
    loadReports
  } = useDonorReports()

  const [filterType, setFilterType] = useState("")
  const [filterDonorId, setFilterDonorId] = useState("")

  const [showGenerate, setShowGenerate] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)

  const [previewReport, setPreviewReport] = useState<any>(null)
  const [shareReportId, setShareReportId] = useState("")

  useEffect(() => {
    loadReports({
      type: filterType,
      donorId: filterDonorId
    })
  }, [page, filterType, filterDonorId])

  const handlePreview = async (report: any) => {

    try {

      if (!report.reportData) {

        const res = await fetchWithAuth(`/api/donor-reports/${report.id}`)

        if (res.ok) {
          const data = await res.json()
          setPreviewReport(data)
        }

      } else {
        setPreviewReport(report)
      }

      setShowPreview(true)

    } catch {
      toast({ title: "Failed to load preview", variant: "destructive" })
    }
  }

  const handleDownload = async (id: string, format: "pdf" | "excel") => {

    try {

      const endpoint =
        format === "pdf"
          ? "download/pdf"
          : "download/excel"

      const res = await fetchWithAuth(`/api/donor-reports/${id}/${endpoint}`)

      if (!res.ok) {
        toast({ title: "Download failed", variant: "destructive" })
        return
      }

      const blob = await res.blob()

      const url = URL.createObjectURL(blob)

      const a = document.createElement("a")

      a.href = url
      a.download = `report-${id}.${format === "pdf" ? "pdf" : "xlsx"}`

      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)

      URL.revokeObjectURL(url)

    } catch {
      toast({ title: "Download failed", variant: "destructive" })
    }
  }

  const handleDelete = async (id: string) => {

    if (!confirm("Delete this report?"))
      return

    try {

      const res = await fetchWithAuth(`/api/donor-reports/${id}`, {
        method: "DELETE"
      })

      if (res.ok) {
        toast({ title: "Report deleted" })
        loadReports()
      }

    } catch {
      toast({ title: "Delete failed", variant: "destructive" })
    }
  }

  return (

    <div className="p-4 md:p-6 space-y-4 max-w-[1400px] mx-auto">

      <ReportsHeader
        isAdmin={isAdmin}
        onTemplates={() => setShowTemplates(true)}
        onGenerate={() => setShowGenerate(true)}
        onRefresh={loadReports}
      />

      <ReportsFilters
        filterType={filterType}
        setFilterType={setFilterType}
        filterDonorId={filterDonorId}
        setFilterDonorId={setFilterDonorId}
        setPage={setPage}
        total={total}
      />

      <ReportsTable
        reports={reports}
        loading={loading}
        actions={{
          preview: handlePreview,
          pdf: (id: string) => handleDownload(id, "pdf"),
          excel: (id: string) => handleDownload(id, "excel"),
          share: (id: string) => {
            setShareReportId(id)
            setShowShare(true)
          },
          delete: handleDelete
        }}
      />

      <PaginationControls
        page={page}
        totalPages={totalPages}
        setPage={setPage}
      />

      <GenerateReportDialog
        open={showGenerate}
        setOpen={setShowGenerate}
      >
        <p className="text-sm text-muted-foreground">
          Report generation form stays here
        </p>
      </GenerateReportDialog>

      <ShareReportDialog
        open={showShare}
        setOpen={setShowShare}
      >
        <p className="text-sm text-muted-foreground">
          Select donors to share this report
        </p>
      </ShareReportDialog>

      <PreviewReportDialog
        open={showPreview}
        setOpen={setShowPreview}
        title={previewReport?.title}
        description={
          previewReport
            ? `${new Date(previewReport.periodStart).toLocaleDateString()} - ${new Date(previewReport.periodEnd).toLocaleDateString()}`
            : ""
        }
      >

        {previewReport?.reportData && (
          <pre className="text-xs bg-muted p-3 rounded-md overflow-auto">
            {JSON.stringify(previewReport.reportData, null, 2)}
          </pre>
        )}

      </PreviewReportDialog>

      <TemplateManagerDialog
        open={showTemplates}
        setOpen={setShowTemplates}
      >
        <p className="text-sm text-muted-foreground">
          Template manager UI here
        </p>
      </TemplateManagerDialog>

    </div>

  )
}
