"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Download, Plus, Upload } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { fetchWithAuth, authStorage } from "@/lib/auth"
import { hasPermission } from "@/lib/permissions"

import DonorTable from "./components/DonorTable"
import DonorFilters from "./components/DonorFilters"
import DonorPagination from "./components/DonorPagination"
import ImportDialog from "./import/ImportDialog"
import MasterExportDialog from "./export/MasterExportDialog"

import { Donor } from "./types"

export default function DonorsPage() {

  const router = useRouter()
  const { t } = useTranslation()

  const user = authStorage.getUser()
  const canCreate = hasPermission(user?.role, "donors", "create")
  const canExport  = hasPermission(user?.role, "donors", "export")

  const [donors, setDonors] = useState<Donor[]>([])
  const [loading, setLoading] = useState(true)

  const [searchInput, setSearchInput] = useState("")
  const [search, setSearch] = useState("")

  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  const [showImportModal, setShowImportModal] = useState(false)
  const [showExportDialog, setShowExportDialog] = useState(false)

  const fetchDonors = async () => {

    setLoading(true)

    try {

      const params = new URLSearchParams()
      params.set("page", String(page))
      if (search) params.set("search", search)

      const res = await fetchWithAuth(`/api/donors?${params.toString()}`)

      if (res.ok) {

        const data = await res.json()

        setDonors(data.items ?? [])
        setTotalPages(data.totalPages ?? 1)
        setTotal(data.total ?? 0)

      }

    } catch (err) {

      console.error(err)

    } finally {

      setLoading(false)

    }

  }

  useEffect(() => {
    fetchDonors()
  }, [page, search])

  const handleSearch = () => {
    setSearch(searchInput)
    setPage(1)
  }

  return (

    <div className="p-6 space-y-6">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t("donors.title")}</h1>
          <p className="text-muted-foreground mt-1">
            {loading
              ? t("common.loading")
              : total > 0
                ? `${total} ${t("donors.title").toLowerCase()}`
                : t("donors.no_donors")}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {canExport && (
            <Button
              variant="outline"
              onClick={() => setShowExportDialog(true)}
              data-testid="button-export"
            >
              <Download className="h-4 w-4 mr-2" />
              {t("common.export")}
            </Button>
          )}

          {canCreate && (
            <Button
              variant="outline"
              onClick={() => setShowImportModal(true)}
              data-testid="button-import"
            >
              <Upload className="h-4 w-4 mr-2" />
              {t("common.import")}
            </Button>
          )}

          {canCreate && (
            <Button
              onClick={() => router.push("/dashboard/donors/new")}
              data-testid="button-add-donor"
            >
              <Plus className="h-4 w-4 mr-2" />
              {t("donors.add_donor")}
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <DonorFilters
          searchInput={searchInput}
          setSearchInput={setSearchInput}
          handleSearch={handleSearch}
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : donors.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
          <p>{t("donors.no_donors")}</p>
          {canCreate && (
            <Button
              className="mt-4"
              onClick={() => router.push("/dashboard/donors/new")}
              data-testid="button-add-donor-empty"
            >
              <Plus className="h-4 w-4 mr-2" />
              {t("donors.add_donor")}
            </Button>
          )}
        </div>
      ) : (
        <DonorTable
          donors={donors}
          onOpen={(id) => router.push(`/dashboard/donors/${id}`)}
        />
      )}

      <DonorPagination
        page={page}
        totalPages={totalPages}
        total={total}
        setPage={setPage}
      />

      <ImportDialog
        open={showImportModal}
        setOpen={setShowImportModal}
      />

      <MasterExportDialog
        open={showExportDialog}
        setOpen={setShowExportDialog}
      />

    </div>
  )
}
