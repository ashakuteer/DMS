"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"

interface Props {
  search: string
  setSearch: (v: string) => void
}

export default function DonationFilters({ search, setSearch }: Props) {

  return (
    <div className="flex items-center gap-2">

      <div className="relative">

        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />

        <Input
          placeholder="Search donor..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />

      </div>

      <Button>Search</Button>

    </div>
  )
}
