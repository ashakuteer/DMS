import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"

interface Props {
  searchInput: string
  setSearchInput: (v: string) => void
  handleSearch: () => void
}

export default function DonorFilters({
  searchInput,
  setSearchInput,
  handleSearch,
}: Props) {
  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />

        <Input
          placeholder="Search by name, code, phone, or email…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          className="pl-10"
          data-testid="input-donor-search"
        />
      </div>

      <Button onClick={handleSearch} data-testid="button-search">
        Search
      </Button>
    </div>
  )
}
