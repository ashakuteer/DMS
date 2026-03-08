"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

import DonorTable from "./components/DonorTable"
import DonorFilters from "./components/DonorFilters"
import DonorPagination from "./components/DonorPagination"

import ImportDialog from "./import/ImportDialog"
import MasterExportDialog from "./export/MasterExportDialog"

import { Donor } from "./types"

import { fetchWithAuth } from "@/lib/auth"

export default function DonorsPage() {

  const router = useRouter()

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

      <h1 className="text-3xl font-bold">
        Donors
      </h1>

      <DonorFilters
        searchInput={searchInput}
        setSearchInput={setSearchInput}
        handleSearch={handleSearch}
      />

      {loading ? (
        <p>Loading...</p>
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
