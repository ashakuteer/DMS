import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"

export default function EngagementFilter({
  value,
  onChange
}:{
  value:string
  onChange:(v:string)=>void
}){

  return(
    <div className="flex items-center gap-3 flex-wrap">

      <span className="text-sm font-medium text-muted-foreground">
        Filter by Engagement
      </span>

      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-[140px]">
          <SelectValue/>
        </SelectTrigger>

        <SelectContent>
          <SelectItem value="ALL">All Levels</SelectItem>
          <SelectItem value="HOT">HOT</SelectItem>
          <SelectItem value="WARM">WARM</SelectItem>
          <SelectItem value="COLD">COLD</SelectItem>
        </SelectContent>
      </Select>

    </div>
  )

}
