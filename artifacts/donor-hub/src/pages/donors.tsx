import { Layout } from "@/components/layout";
import { useListDonors, useCreateDonor } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { donorSchema } from "@/lib/zod-schemas";
import { useState } from "react";
import { Search, Plus, User, Building, MapPin, Phone, Mail } from "lucide-react";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { z } from "zod";

function DonorCard({ donor }: { donor: any }) {
  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  
  return (
    <Link href={`/donors/${donor.id}`} className="block group">
      <Card className="border-border/50 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 h-full rounded-2xl overflow-hidden bg-card">
        <div className="h-16 bg-gradient-to-r from-primary/10 to-secondary/10 w-full relative">
           <Badge className="absolute top-3 right-3 shadow-sm bg-background text-foreground hover:bg-background" variant="outline">
             {donor.status}
           </Badge>
        </div>
        <CardContent className="pt-0 px-6 pb-6 relative">
          <div className="flex justify-between items-end mb-4 -mt-8 relative z-10">
            <div className="w-16 h-16 rounded-2xl bg-white shadow-md border-4 border-white flex items-center justify-center overflow-hidden">
              {donor.photoUrl ? (
                <img src={donor.photoUrl} alt={donor.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-primary/10 text-primary font-display font-bold flex items-center justify-center text-xl">
                  {getInitials(donor.name)}
                </div>
              )}
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-display font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">{donor.name}</h3>
            <div className="flex items-center text-xs text-muted-foreground mt-1 mb-4 gap-1.5 font-medium">
              {donor.donorType === 'Individual' ? <User className="w-3.5 h-3.5" /> : <Building className="w-3.5 h-3.5" />}
              <span>{donor.donorType}</span>
            </div>
            
            <div className="space-y-2 text-sm text-muted-foreground">
              {donor.email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 opacity-70 shrink-0" />
                  <span className="truncate">{donor.email}</span>
                </div>
              )}
              {donor.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 opacity-70 shrink-0" />
                  <span className="truncate">{donor.phone}</span>
                </div>
              )}
              {donor.city && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 opacity-70 shrink-0" />
                  <span className="truncate">{donor.city}, {donor.country}</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function Donors() {
  const { data: donors, isLoading } = useListDonors();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const createMutation = useCreateDonor();

  const form = useForm<z.infer<typeof donorSchema>>({
    resolver: zodResolver(donorSchema),
    defaultValues: {
      name: "", email: "", phone: "", address: "", city: "", country: "", donorType: "Individual", status: "Active", notes: ""
    }
  });

  const onSubmit = (values: z.infer<typeof donorSchema>) => {
    createMutation.mutate({ data: values }, {
      onSuccess: () => {
        setOpen(false);
        form.reset();
      }
    });
  };

  const filtered = donors?.filter(d => 
    d.name.toLowerCase().includes(search.toLowerCase()) || 
    (d.email && d.email.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <Layout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Supporters</h1>
          <p className="text-muted-foreground mt-1">Manage and view all your donors and organizations.</p>
        </div>
        
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-full shadow-lg shadow-primary/20 hover:shadow-xl hover:-translate-y-0.5 transition-all">
              <Plus className="w-5 h-5 mr-2" /> New Donor
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] rounded-2xl">
            <DialogHeader>
              <DialogTitle className="font-display text-xl">Add New Supporter</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Full Name / Organization</FormLabel>
                      <FormControl><Input placeholder="John Doe" className="rounded-xl" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl><Input placeholder="john@example.com" className="rounded-xl" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="phone" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl><Input placeholder="+1 234 567 890" className="rounded-xl" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="donorType" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger className="rounded-xl"><SelectValue placeholder="Select type" /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="Individual">Individual</SelectItem>
                          <SelectItem value="Organization">Organization</SelectItem>
                          <SelectItem value="Corporate">Corporate</SelectItem>
                          <SelectItem value="Foundation">Foundation</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="status" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger className="rounded-xl"><SelectValue placeholder="Select status" /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="Active">Active</SelectItem>
                          <SelectItem value="Inactive">Inactive</SelectItem>
                          <SelectItem value="Prospect">Prospect</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="city" render={({ field }) => (
                    <FormItem><FormLabel>City</FormLabel><FormControl><Input className="rounded-xl" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="country" render={({ field }) => (
                    <FormItem><FormLabel>Country</FormLabel><FormControl><Input className="rounded-xl" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={createMutation.isPending} className="rounded-xl px-8">
                    {createMutation.isPending ? "Saving..." : "Save Donor"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-6 relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input 
          placeholder="Search donors by name or email..." 
          className="pl-10 rounded-xl bg-card border-border/50 shadow-sm h-12 text-base"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-64 rounded-2xl" />)}
        </div>
      ) : filtered?.length === 0 ? (
        <div className="text-center py-20 bg-card rounded-3xl border border-border/50 border-dashed">
          <Users className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-semibold">No donors found</h3>
          <p className="text-muted-foreground mt-2">Try adjusting your search or add a new donor.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered?.map(donor => <DonorCard key={donor.id} donor={donor} />)}
        </div>
      )}
    </Layout>
  );
}
