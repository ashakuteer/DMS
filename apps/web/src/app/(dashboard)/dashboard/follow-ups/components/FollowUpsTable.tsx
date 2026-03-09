import {
Table,
TableBody,
TableCell,
TableHead,
TableHeader,
TableRow
} from "@/components/ui/table"

import { Card } from "@/components/ui/card"

import { getPhoneClean } from "../utils/followups.utils"

export default function FollowUpsTable({
  items,
  actions
}:any){

  return(

    <Card>

      <div className="overflow-x-auto">

        <Table>

          <TableHeader>
            <TableRow>
              <TableHead>Donor</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Note</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Assigned</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>

            {items.map((fu:any)=>{

              const phone = getPhoneClean(fu.donor.primaryPhone)

              return(

                <TableRow key={fu.id}>

                  <TableCell>
                    {fu.donor.firstName} {fu.donor.lastName}
                  </TableCell>

                  <TableCell>
                    {fu.donor.primaryPhone || "-"}
                  </TableCell>

                  <TableCell>
                    {fu.note}
                  </TableCell>

                  <TableCell>
                    {fu.status}
                  </TableCell>

                  <TableCell>
                    {fu.assignedTo.name}
                  </TableCell>

                  <TableCell className="text-right">
                    {actions(fu,phone)}
                  </TableCell>

                </TableRow>

              )

            })}

          </TableBody>

        </Table>

      </div>

    </Card>

  )

}
