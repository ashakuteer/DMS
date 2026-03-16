import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useGetReportSummary } from "@workspace/api-client-react";
import { Users, CreditCard, Baby, Ribbon, ArrowRight, TrendingUp, Mail, Clock } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

function DashboardStats() {
  const { data: summary, isLoading } = useGetReportSummary();

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-36 rounded-2xl" />)}
      </div>
    );
  }

  if (!summary) return null;

  const stats = [
    {
      title: "Total Donors",
      value: summary.totalDonors,
      subtext: `${summary.activeDonors} active currently`,
      icon: Users,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      title: "Total Donations",
      value: `$${summary.totalDonations.toLocaleString()}`,
      subtext: "Lifetime contributions",
      icon: CreditCard,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
    {
      title: "Beneficiaries",
      value: summary.totalBeneficiaries,
      subtext: `${summary.activeBeneficiaries} active in homes`,
      icon: Baby,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
    },
    {
      title: "Sponsorships",
      value: summary.activeSponsorships,
      subtext: "Active recurring support",
      icon: Ribbon,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
    }
  ];

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, i) => (
        <Card key={i} className="border-border/50 shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl overflow-hidden group">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                <p className="text-3xl font-display font-bold tracking-tight text-foreground">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-xl ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform duration-300`}>
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs text-muted-foreground">
              <TrendingUp className="w-3 h-3 mr-1 text-secondary" />
              <span>{stat.subtext}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function RecentDonations() {
  const { data: summary, isLoading } = useGetReportSummary();

  if (isLoading) {
    return <Skeleton className="h-96 w-full rounded-2xl" />;
  }

  const recent = summary?.recentDonations || [];

  return (
    <Card className="border-border/50 shadow-sm rounded-2xl flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-border/20 px-6 pt-6">
        <div className="space-y-1">
          <CardTitle className="text-lg font-display">Recent Contributions</CardTitle>
          <CardDescription>Latest donations from our supporters</CardDescription>
        </div>
        <Button variant="outline" size="sm" asChild className="rounded-full">
          <Link href="/donations" className="text-xs">
            View All
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="p-0 flex-1">
        {recent.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">No recent donations.</div>
        ) : (
          <div className="divide-y divide-border/30">
            {recent.slice(0, 5).map((donation) => (
              <div key={donation.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors px-6">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    {donation.currency}
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm">Donation #{donation.id.slice(0,6)}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(donation.donationDate), "MMM d, yyyy")}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-display font-bold text-emerald-600">
                    +${donation.amount.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground uppercase">{donation.paymentMethod || 'Unknown'}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  return (
    <Layout>
      <div className="space-y-8">
        
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-3xl bg-primary px-6 py-10 sm:px-10 sm:py-14 shadow-lg">
          <div className="absolute inset-0">
            <img 
              src={`${import.meta.env.BASE_URL}images/hero-bg.png`}
              alt="Background" 
              className="w-full h-full object-cover opacity-20 mix-blend-overlay"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary/40 mix-blend-multiply"></div>
          </div>
          <div className="relative z-10 max-w-2xl text-primary-foreground">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold mb-4 text-white drop-shadow-md">
              Making a Difference, Together.
            </h1>
            <p className="text-primary-foreground/90 text-lg mb-8 max-w-xl leading-relaxed">
              Welcome to the NGO Donor Hub. Manage your supporters, track impact, and share beautiful stories from our homes.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button size="lg" className="bg-white text-primary hover:bg-white/90 rounded-full font-semibold shadow-xl shadow-black/10 transition-all hover:-translate-y-0.5" asChild>
                <Link href="/donors">
                  Add New Donor
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 rounded-full font-semibold backdrop-blur-sm" asChild>
                <Link href="/time-machine">
                  View Time Machine <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div>
          <h2 className="text-xl font-display font-semibold mb-4 text-foreground">Impact Overview</h2>
          <DashboardStats />
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xl font-display font-semibold text-foreground">Quick Actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { title: "Record Donation", desc: "Log a new contribution", icon: CreditCard, href: "/donations", color: "bg-emerald-500/10 text-emerald-600" },
                { title: "New Beneficiary", desc: "Admit someone to a home", icon: Baby, href: "/beneficiaries", color: "bg-amber-500/10 text-amber-600" },
                { title: "Send Communication", desc: "Email or letter to donors", icon: Mail, href: "/communications", color: "bg-blue-500/10 text-blue-600" },
                { title: "Share a Story", desc: "Add to Time Machine", icon: Clock, href: "/time-machine", color: "bg-purple-500/10 text-purple-600" },
              ].map((action, i) => (
                <Link key={i} href={action.href} className="block group">
                  <Card className="border-border/50 shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-300 h-full rounded-2xl">
                    <CardContent className="p-5 flex items-center gap-4">
                      <div className={`p-3 rounded-xl ${action.color} group-hover:scale-110 transition-transform duration-300`}>
                        <action.icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">{action.title}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">{action.desc}</p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
          
          <div className="lg:col-span-1">
             <RecentDonations />
          </div>
        </div>

      </div>
    </Layout>
  );
}
