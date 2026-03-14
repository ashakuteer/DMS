import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { resolveImageUrl } from "@/lib/image-url"
import { Donor } from "../../../types"

interface Props {
  donors: Donor[]
  onOpen: (id: string) => void
}

function getCategoryLabel(category: string) {
  return category.replace(/_/g, " ")
}

function getHealthBadge(healthStatus?: string, healthScore?: number) {
  if (!healthStatus) return null
  const score = healthScore ?? 100
  if (healthStatus === "GREEN")
    return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs">{score}</Badge>
  if (healthStatus === "YELLOW")
    return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 text-xs">{score}</Badge>
  if (healthStatus === "RED")
    return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 text-xs">{score}</Badge>
  return null
}

function getEngagementBadge(level?: string) {
  if (!level) return null
  if (level === "HOT")
    return <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 text-xs">HOT</Badge>
  if (level === "WARM")
    return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs">WARM</Badge>
  if (level === "COLD")
    return <Badge className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 text-xs">COLD</Badge>
  return null
}

function getInitials(donor: Donor) {
  const first = donor.firstName?.charAt(0) ?? ""
  const last = donor.lastName?.charAt(0) ?? ""
  return (first + last).toUpperCase() || donor.donorCode.slice(0, 2)
}

export default function DonorTable({ donors, onOpen }: Props) {
  return (
    <div className="rounded-md border">
      <Table>

        <TableHeader>
          <TableRow>
            <TableHead>Donor</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Location</TableHead>
            <TableHead className="text-center">Donations</TableHead>
            <TableHead>Health</TableHead>
            <TableHead>Engagement</TableHead>
            <TableHead>Assigned To</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {donors.map((d) => (
            <TableRow
              key={d.id}
              onClick={() => onOpen(d.id)}
              className="cursor-pointer hover:bg-muted/50"
              data-testid={`row-donor-${d.id}`}
            >
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={resolveImageUrl((d as any).profilePicUrl)} />
                    <AvatarFallback className="text-xs">{getInitials(d)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium leading-tight">
                      {d.firstName} {d.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono">{d.donorCode}</p>
                  </div>
                </div>
              </TableCell>

              <TableCell>
                <Badge variant="outline" className="text-xs whitespace-nowrap">
                  {getCategoryLabel(d.category)}
                </Badge>
              </TableCell>

              <TableCell>
                <div className="text-sm space-y-0.5">
                  {d.primaryPhone && <p>{d.primaryPhone}</p>}
                  {d.personalEmail && (
                    <p className="text-muted-foreground text-xs truncate max-w-[160px]">{d.personalEmail}</p>
                  )}
                </div>
              </TableCell>

              <TableCell>
                <span className="text-sm text-muted-foreground">
                  {[d.city, d.state].filter(Boolean).join(", ") || "—"}
                </span>
              </TableCell>

              <TableCell className="text-center">
                <span className="text-sm font-medium">
                  {d._count?.donations ?? 0}
                </span>
              </TableCell>

              <TableCell>
                {getHealthBadge(d.healthStatus, d.healthScore)}
              </TableCell>

              <TableCell>
                {getEngagementBadge(d.engagementLevel)}
              </TableCell>

              <TableCell>
                {d.assignedToUser ? (
                  <span className="text-sm">{d.assignedToUser.name}</span>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </TableCell>

            </TableRow>
          ))}
        </TableBody>

      </Table>
    </div>
  )
}
