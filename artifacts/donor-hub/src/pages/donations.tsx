import { Layout } from "@/components/layout";
import { useListDonations, useCreateDonation, useListDonors } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { donationSchema } from "@/lib/zod-schemas";
import { useState } from "react";
import { Plus, CreditCard, Calendar } from "lucide-react";
import { format } from "date-fns";
import { z } from "zod";

export default function Donations() {
  const { data: donations } = useListDonations();
  const { data: donors } = useListDonors();
  const createMutation = useCreateDonation();
  const [open, setOpen] = useState(false);

  const form = useForm<z.infer<typeof donationSchema>>({
    resolver: zodResolver(donationSchema),
    defaultValues: {
      donorId: "", amount: 0, currency: "USD", donationDate: new Date().toISOString().split('T')[0], paymentMethod: "Credit Card", purpose: "General", receiptNumber: "", notes: ""
    }
  });

  const onSubmit = (values: z.infer<typeof donationSchema>) => {
    createMutation.mutate({ data: values }, {
      onSuccess: () => {
        setOpen(false);
        form.reset();
      }
    });
  };

  const getDonorName = (id: string) => donors?.find(d => d.id === id)?.name || "Unknown Donor";

  return (
    <Layout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Donations</h1>
          <p className="text-muted-foreground mt-1">Track all incoming contributions.</p>
        </div>
        
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-full shadow-lg shadow-primary/20">
              <Plus className="w-5 h-5 mr-2" /> Log Donation
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] rounded-2xl">
            <DialogHeader>
              <DialogTitle className="font-display">Log New Donation</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                <FormField control={form.control} name="donorId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Donor</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger className="rounded-xl"><SelectValue placeholder="Select a donor" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {donors?.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="amount" render={({ field }) => (
                    <FormItem><FormLabel>Amount</FormLabel><FormControl><Input type="number" className="rounded-xl" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="currency" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent><SelectItem value="USD">USD ($)</SelectItem><SelectItem value="INR">INR (₹)</SelectItem><SelectItem value="EUR">EUR (€)</SelectItem></SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="donationDate" render={({ field }) => (
                    <FormItem><FormLabel>Date</FormLabel><FormControl><Input type="date" className="rounded-xl" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="paymentMethod" render={({ field }) => (
                    <FormItem><FormLabel>Method</FormLabel><FormControl><Input className="rounded-xl" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={createMutation.isPending} className="rounded-xl">Save Donation</Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="rounded-2xl shadow-sm border-border/50 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Donor</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Purpose</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {donations?.map(donation => (
                <TableRow key={donation.id} className="hover:bg-muted/30">
                  <TableCell className="font-medium text-foreground">{getDonorName(donation.donorId)}</TableCell>
                  <TableCell className="text-muted-foreground flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5" />
                    {format(new Date(donation.donationDate), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell className="font-display font-bold text-emerald-600">
                    {donation.currency === 'USD' ? '$' : donation.currency}{donation.amount.toLocaleString()}
                  </TableCell>
                  <TableCell><Badge variant="outline" className="text-xs font-normal">{donation.paymentMethod}</Badge></TableCell>
                  <TableCell className="text-muted-foreground">{donation.purpose}</TableCell>
                </TableRow>
              ))}
              {donations?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">No donations recorded.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </Layout>
  );
}
