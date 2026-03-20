"use client"

import {
Table,
TableBody,
TableCell,
TableHead,
TableHeader,
TableRow
} from "@/components/ui/table"

import { Card } from "@/components/ui/card"
import { useTranslation } from "react-i18next"

import { getPhoneClean } from "../utils/followups.utils"

export default function FollowUpsTable({
  items,
  actions
}:any){
  const { t } = useTranslation()

  return(

    <Card>

      <div className="overflow-x-auto">

        <Table>

          <TableHeader>
            <TableRow>
              <TableHead>{t("follow_ups.col_donor")}</TableHead>
              <TableHead>{t("follow_ups.col_phone")}</TableHead>
              <TableHead>{t("follow_ups.col_note")}</TableHead>
              <TableHead>{t("users.status")}</TableHead>
              <TableHead>{t("follow_ups.col_assigned")}</TableHead>
              <TableHead className="text-right">{t("common.actions")}</TableHead>
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
