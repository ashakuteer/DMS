import { Layout } from "@/components/layout";
import { useListSponsorships, useCreateSponsorship, useListDonors, useListBeneficiaries } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { sponsorshipSchema } from "@/lib/zod-schemas";
import { useState } from "react";
import { Plus, Ribbon, User, Baby, Calendar } from "lucide-react";
import { format } from "date-fns";
import { z } from "zod";

export default function Sponsorships() {
  const { data: sponsorships } = useListSponsorships();
  const { data: donors } = useListDonors();
  const { data: beneficiaries } = useListBeneficiaries();
  const createMutation = useCreateSponsorship();
  const [open, setOpen] = useState(false);

  const form = useForm<z.infer<typeof sponsorshipSchema>>({
    resolver: zodResolver(sponsorshipSchema),
    defaultValues: {
      donorId: "", beneficiaryId: "", startDate: new Date().toISOString().split('T')[0], endDate: "", monthlyAmount: 50, currency: "USD", status: "Active", notes: ""
    }
  });

  const onSubmit = (values: z.infer<typeof sponsorshipSchema>) => {
    createMutation.mutate({ data: values }, {
      onSuccess: () => {
        setOpen(false);
        form.reset();
      }
    });
  };

  const getDonor = (id: string) => donors?.find(d => d.id === id);
  const getBeneficiary = (id: string) => beneficiaries?.find(b => d => b.id === id); //typo fixed below
  
  return (
    <Layout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Sponsorships</h1>
          <p className="text-muted-foreground mt-1">Manage ongoing support connections.</p>
        </div>
        
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-full shadow-lg shadow-primary/20">
              <Plus className="w-5 h-5 mr-2" /> New Sponsorship
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] rounded-2xl">
            <DialogHeader>
              <DialogTitle className="font-display">Create Sponsorship</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                <FormField control={form.control} name="donorId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sponsor (Donor)</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger className="rounded-xl"><SelectValue placeholder="Select sponsor" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {donors?.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
                <FormField control={form.control} name="beneficiaryId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Beneficiary (Child/Elderly)</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger className="rounded-xl"><SelectValue placeholder="Select beneficiary" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {beneficiaries?.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="monthlyAmount" render={({ field }) => (
                    <FormItem><FormLabel>Monthly Amount</FormLabel><FormControl><Input type="number" className="rounded-xl" {...field} /></FormControl></FormItem>
                  )} />
                  <FormField control={form.control} name="startDate" render={({ field }) => (
                    <FormItem><FormLabel>Start Date</FormLabel><FormControl><Input type="date" className="rounded-xl" {...field} /></FormControl></FormItem>
                  )} />
                </div>
                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={createMutation.isPending} className="rounded-xl">Create Link</Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sponsorships?.map(sp => {
          const donor = donors?.find(d => d.id === sp.donorId);
          const ben = beneficiaries?.find(b => b.id === sp.beneficiaryId);
          return (
            <Card key={sp.id} className="border-border/50 shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
              <div className="h-2 bg-purple-500 w-full"></div>
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <Badge variant={sp.status === 'Active' ? 'default' : 'secondary'} className="bg-purple-100 text-purple-700 hover:bg-purple-200 border-0">
                    {sp.status}
                  </Badge>
                  <p className="font-display font-bold text-xl text-foreground">
                    ${sp.monthlyAmount}<span className="text-sm font-normal text-muted-foreground">/mo</span>
                  </p>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600"><User className="w-5 h-5" /></div>
                    <div><p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Sponsor</p><p className="font-medium text-sm">{donor?.name || 'Unknown'}</p></div>
                  </div>
                  
                  <div className="flex justify-center -my-2 relative z-10"><Ribbon className="w-5 h-5 text-purple-400" /></div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600"><Baby className="w-5 h-5" /></div>
                    <div><p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Beneficiary</p><p className="font-medium text-sm">{ben?.name || 'Unknown'}</p></div>
                  </div>
                </div>
                
                <div className="mt-6 pt-4 border-t border-border/50 flex items-center text-xs text-muted-foreground">
                  <Calendar className="w-3.5 h-3.5 mr-1" />
                  Started {format(new Date(sp.startDate), "MMM yyyy")}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </Layout>
  );
}
