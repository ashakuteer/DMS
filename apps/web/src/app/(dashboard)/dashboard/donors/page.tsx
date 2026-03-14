"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Download, Plus, Upload } from "lucide-react"

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

      const res = await fetchWithAuth(`/api/donors?page=${page}&search=${search}`)

      if (res.ok) {

        const data = await res.json()

        setDonors(data.items)
        setTotalPages(data.totalPages)
        setTotal(data.total)

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
          <h1 className="text-3xl font-bold text-foreground">Donors</h1>
          <p className="text-muted-foreground mt-1">
            {loading
              ? "Loading donors…"
              : total > 0
                ? `${total} donor${total === 1 ? "" : "s"} total`
                : "No donors yet"}
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
              Export
            </Button>
          )}

          {canCreate && (
            <Button
              variant="outline"
              onClick={() => setShowImportModal(true)}
              data-testid="button-import"
            >
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
          )}

          {canCreate && (
            <Button
              onClick={() => router.push("/dashboard/donors/new")}
              data-testid="button-add-donor"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Donor
            </Button>
          )}
        </div>
      </div>

      <DonorFilters
        searchInput={searchInput}
        setSearchInput={setSearchInput}
        handleSearch={handleSearch}
      />

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : donors.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
          <p>No donors found</p>
          {canCreate && (
            <Button
              className="mt-4"
              onClick={() => router.push("/dashboard/donors/new")}
              data-testid="button-add-donor-empty"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add your first donor
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
