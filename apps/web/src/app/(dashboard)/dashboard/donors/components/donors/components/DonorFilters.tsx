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
  handleSearch
}: Props) {
  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />

        <Input
          placeholder="Search donors..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="pl-10"
        />
      </div>

      <Button onClick={handleSearch}>
        Search
      </Button>
    </div>
  )
}
