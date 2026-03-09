import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"

export default function FollowUpsTabs({
  activeTab,
  setActiveTab,
  stats,
  children
}:any){

  return(

    <Tabs value={activeTab} onValueChange={setActiveTab}>

      <TabsList>

        <TabsTrigger value="upcoming">
          Upcoming
          {stats.pending > 0 &&
            <Badge className="ml-1 bg-muted text-muted-foreground">
              {stats.pending}
            </Badge>}
        </TabsTrigger>

        <TabsTrigger value="completed">
          Completed
        </TabsTrigger>

        <TabsTrigger value="all">
          All
        </TabsTrigger>

      </TabsList>

      {children}

    </Tabs>

  )

}
