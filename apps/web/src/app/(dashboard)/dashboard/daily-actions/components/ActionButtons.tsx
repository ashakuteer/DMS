"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { ExternalLink, Check } from "lucide-react"

export function ActionButtons({
  donorId,
  onDone,
}: {
  donorId: string
  onDone?: () => void
}) {
  return (
    <div className="flex items-center gap-1 justify-end">

      <Tooltip>
        <TooltipTrigger asChild>
          <Link href={`/dashboard/donors/${donorId}`}>
            <Button size="icon" variant="ghost">
              <ExternalLink className="h-4 w-4" />
            </Button>
          </Link>
        </TooltipTrigger>
        <TooltipContent>Open Profile</TooltipContent>
      </Tooltip>

      {onDone && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button size="icon" variant="ghost" onClick={onDone}>
              <Check className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Mark Done</TooltipContent>
        </Tooltip>
      )}

    </div>
  )
}
