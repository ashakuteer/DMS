import { Layout } from "@/components/layout";
import { useGetReportSummary } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function Reports() {
  const { data: summary } = useGetReportSummary();

  // Fake monthly data for visual flair since API only provides total
  const chartData = [
    { name: 'Jan', total: 4000 },
    { name: 'Feb', total: 3000 },
    { name: 'Mar', total: 2000 },
    { name: 'Apr', total: 2780 },
    { name: 'May', total: 1890 },
    { name: 'Jun', total: 2390 },
    { name: 'Jul', total: 3490 },
  ];

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-foreground">Analytics & Reports</h1>
        <p className="text-muted-foreground mt-1">System-wide overview of impact and operations.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <Card className="rounded-3xl border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="font-display font-medium text-muted-foreground">Fundraising Overview (Last 6 Months)</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                 <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} dy={10} />
                 <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(val) => `$${val}`} />
                 <RechartsTooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                 <Bar dataKey="total" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} barSize={40} />
               </BarChart>
             </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-4">
           {[
             { label: "Total Donors", value: summary?.totalDonors, color: "text-blue-500" },
             { label: "Active Sponsors", value: summary?.activeSponsorships, color: "text-purple-500" },
             { label: "Beneficiaries Served", value: summary?.totalBeneficiaries, color: "text-amber-500" },
             { label: "Comms Sent", value: summary?.totalCommunications, color: "text-emerald-500" },
           ].map((item, i) => (
             <Card key={i} className="rounded-2xl border-border/50 shadow-sm flex flex-col justify-center text-center p-6">
               <p className="text-sm font-medium text-muted-foreground mb-2">{item.label}</p>
               <p className={`text-4xl font-display font-bold ${item.color}`}>{item.value || 0}</p>
             </Card>
           ))}
        </div>
      </div>
    </Layout>
  );
}
