import { Layout } from "@/components/layout";
import { useGetDonor, useUpdateDonor, useDeleteDonor, useListDonations } from "@workspace/api-client-react";
import { useUploadDonorPhotoNative } from "@/hooks/use-uploads";
import { useRoute, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, Trash2, MapPin, Phone, Mail, Building, Calendar, Upload, Camera } from "lucide-react";
import { format } from "date-fns";
import { useRef } from "react";
import { useToast } from "@/hooks/use-toast";

export default function DonorDetail() {
  const [, params] = useRoute("/donors/:id");
  const [, setLocation] = useLocation();
  const id = params?.id || "";
  const { toast } = useToast();
  
  const { data: donor, isLoading } = useGetDonor(id);
  const { data: donations } = useListDonations();
  const deleteMutation = useDeleteDonor();
  const uploadPhotoMutation = useUploadDonorPhotoNative();
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (isLoading) return <Layout><Skeleton className="h-[600px] rounded-3xl" /></Layout>;
  if (!donor) return <Layout><div>Donor not found</div></Layout>;

  const donorDonations = donations?.filter(d => d.donorId === id) || [];
  const totalDonated = donorDonations.reduce((acc, curr) => acc + curr.amount, 0);

  const handleDelete = () => {
    if(confirm("Are you sure you want to delete this donor?")) {
      deleteMutation.mutate({ id }, {
        onSuccess: () => {
          toast({ title: "Donor deleted" });
          setLocation("/donors");
        }
      });
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    uploadPhotoMutation.mutate({ id, file }, {
      onSuccess: () => {
        toast({ title: "Photo updated successfully" });
      },
      onError: () => {
        toast({ title: "Failed to upload photo", variant: "destructive" });
      }
    });
  };

  return (
    <Layout>
      <div className="mb-6 flex items-center justify-between">
        <Button variant="ghost" className="rounded-full -ml-4" onClick={() => setLocation("/donors")}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Donors
        </Button>
        <div className="flex gap-2">
          {/* Edit would open a dialog with prefilled data, similar to create. Omitting for brevity, focusing on view */}
          <Button variant="outline" className="rounded-full text-destructive hover:bg-destructive/10 border-destructive/20" onClick={handleDelete}>
            <Trash2 className="w-4 h-4 mr-2" /> Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Profile */}
        <Card className="col-span-1 border-border/50 shadow-md rounded-3xl overflow-hidden relative">
          <div className="h-32 bg-gradient-to-br from-primary to-secondary w-full"></div>
          <CardContent className="px-6 pb-8 relative">
            <div className="flex justify-center -mt-16 mb-6">
              <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <div className="w-32 h-32 rounded-full border-4 border-card bg-muted flex items-center justify-center overflow-hidden shadow-lg">
                  {donor.photoUrl ? (
                    <img src={donor.photoUrl} alt={donor.name} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-12 h-12 text-muted-foreground" />
                  )}
                </div>
                <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity">
                  <Camera className="w-6 h-6 mb-1" />
                  <span className="text-[10px] uppercase font-bold tracking-wider">Change</span>
                </div>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoUpload} />
              </div>
            </div>

            <div className="text-center mb-6">
              <h2 className="text-2xl font-display font-bold text-foreground">{donor.name}</h2>
              <div className="flex items-center justify-center gap-2 mt-2">
                <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">{donor.donorType}</Badge>
                <Badge variant="outline" className={donor.status === 'Active' ? 'border-emerald-500 text-emerald-600' : ''}>{donor.status}</Badge>
              </div>
            </div>

            <div className="space-y-4">
              {donor.email && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border/50">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0"><Mail className="w-4 h-4" /></div>
                  <div className="min-w-0 flex-1"><p className="text-xs text-muted-foreground mb-0.5">Email Address</p><p className="text-sm font-medium truncate">{donor.email}</p></div>
                </div>
              )}
              {donor.phone && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border/50">
                  <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center text-secondary shrink-0"><Phone className="w-4 h-4" /></div>
                  <div className="min-w-0 flex-1"><p className="text-xs text-muted-foreground mb-0.5">Phone Number</p><p className="text-sm font-medium truncate">{donor.phone}</p></div>
                </div>
              )}
              {(donor.city || donor.country) && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border/50">
                  <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent-foreground shrink-0"><MapPin className="w-4 h-4" /></div>
                  <div className="min-w-0 flex-1"><p className="text-xs text-muted-foreground mb-0.5">Location</p><p className="text-sm font-medium truncate">{[donor.city, donor.country].filter(Boolean).join(', ')}</p></div>
                </div>
              )}
            </div>
            
            {donor.notes && (
              <div className="mt-6 p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 text-sm text-amber-900 dark:text-amber-200">
                <p className="font-semibold mb-1">Notes</p>
                <p>{donor.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Column: Details & History */}
        <div className="col-span-1 lg:col-span-2 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <Card className="rounded-2xl border-border/50 shadow-sm">
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground mb-1">Total Contributions</p>
                <p className="text-3xl font-display font-bold text-emerald-600">${totalDonated.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border-border/50 shadow-sm">
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground mb-1">Donation Count</p>
                <p className="text-3xl font-display font-bold text-primary">{donorDonations.length}</p>
              </CardContent>
            </Card>
          </div>

          <Card className="rounded-2xl border-border/50 shadow-sm">
            <CardHeader className="border-b border-border/30 pb-4">
              <CardTitle className="font-display">Donation History</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {donorDonations.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">No donations recorded yet.</div>
              ) : (
                <div className="divide-y divide-border/30">
                  {donorDonations.map(donation => (
                    <div key={donation.id} className="p-4 px-6 flex justify-between items-center hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                          <CreditCard className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{format(new Date(donation.donationDate), "MMMM d, yyyy")}</p>
                          <p className="text-xs text-muted-foreground">{donation.purpose || "General Fund"}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-display font-bold text-foreground">${donation.amount.toLocaleString()}</p>
                        <Badge variant="outline" className="mt-1 text-[10px] uppercase font-semibold">{donation.paymentMethod}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
