import { Donor } from "../../../types"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"

interface Props {
  donors: Donor[]
  onOpen: (id: string) => void
}

export default function DonorTable({ donors, onOpen }: Props) {
  return (
    <div className="rounded-md border">
      <Table>

        <TableHeader>
          <TableRow>
            <TableHead>Code</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>City</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {donors.map((d) => (
            <TableRow
              key={d.id}
              onClick={() => onOpen(d.id)}
              className="cursor-pointer"
            >
              <TableCell>{d.donorCode}</TableCell>

              <TableCell>
                {d.firstName} {d.lastName}
              </TableCell>

              <TableCell>{d.primaryPhone}</TableCell>

              <TableCell>{d.personalEmail}</TableCell>

              <TableCell>{d.city}</TableCell>

            </TableRow>
          ))}
        </TableBody>

      </Table>
    </div>
  )
}
