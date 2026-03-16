import { Layout } from "@/components/layout";
import { useListBeneficiaries, useCreateBeneficiary } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { beneficiarySchema } from "@/lib/zod-schemas";
import { useState } from "react";
import { Plus, Baby, MapPin } from "lucide-react";
import { z } from "zod";

export default function Beneficiaries() {
  const { data: beneficiaries, isLoading } = useListBeneficiaries();
  const createMutation = useCreateBeneficiary();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("All");

  const form = useForm<z.infer<typeof beneficiarySchema>>({
    resolver: zodResolver(beneficiarySchema),
    defaultValues: {
      name: "", dateOfBirth: "", gender: "Other", home: "Girls Home - Uppal", status: "Active", medicalInfo: "", educationInfo: "", notes: ""
    }
  });

  const onSubmit = (values: z.infer<typeof beneficiarySchema>) => {
    createMutation.mutate({ data: values }, {
      onSuccess: () => {
        setOpen(false);
        form.reset();
      }
    });
  };

  const filtered = filter === "All" ? beneficiaries : beneficiaries?.filter(b => b.home === filter);

  return (
    <Layout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Beneficiaries</h1>
          <p className="text-muted-foreground mt-1">Manage individuals in our care homes.</p>
        </div>
        
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-full shadow-lg shadow-primary/20">
              <Plus className="w-5 h-5 mr-2" /> Admit Beneficiary
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] rounded-2xl">
            <DialogHeader>
              <DialogTitle className="font-display text-xl">Admit New Beneficiary</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem className="col-span-2"><FormLabel>Full Name</FormLabel><FormControl><Input className="rounded-xl" {...field} /></FormControl></FormItem>
                  )} />
                  <FormField control={form.control} name="home" render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Assigned Home</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="Girls Home - Uppal">Girls Home - Uppal</SelectItem>
                          <SelectItem value="Blind Home - Begumpet">Blind Home - Begumpet</SelectItem>
                          <SelectItem value="Old Age Home - Peerzadiguda">Old Age Home - Peerzadiguda</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="dateOfBirth" render={({ field }) => (
                    <FormItem><FormLabel>Date of Birth</FormLabel><FormControl><Input type="date" className="rounded-xl" {...field} /></FormControl></FormItem>
                  )} />
                  <FormField control={form.control} name="status" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent><SelectItem value="Active">Active</SelectItem><SelectItem value="Graduated">Graduated</SelectItem></SelectContent>
                      </Select>
                    </FormItem>
                  )} />
                </div>
                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={createMutation.isPending} className="rounded-xl px-8">Save Record</Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-none">
        {["All", "Girls Home - Uppal", "Blind Home - Begumpet", "Old Age Home - Peerzadiguda"].map(h => (
          <Button 
            key={h} 
            variant={filter === h ? "default" : "outline"} 
            className="rounded-full whitespace-nowrap"
            onClick={() => setFilter(h)}
          >
            {h}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filtered?.map(ben => (
          <Card key={ben.id} className="border-border/50 shadow-sm hover:shadow-md transition-shadow rounded-2xl bg-card overflow-hidden">
             <div className="h-20 bg-amber-500/10 w-full flex items-center justify-center">
               {/* placeholder if no photo */}
               {ben.photoUrl ? (
                 <img src={ben.photoUrl} alt={ben.name} className="w-full h-full object-cover" />
               ) : (
                 <Baby className="w-8 h-8 text-amber-500/30" />
               )}
             </div>
             <CardContent className="p-5 pt-4">
               <h3 className="font-display font-bold text-lg text-foreground mb-1">{ben.name}</h3>
               <div className="flex items-center text-xs text-muted-foreground mb-3">
                 <MapPin className="w-3.5 h-3.5 mr-1" />
                 <span className="truncate">{ben.home}</span>
               </div>
               <Badge variant={ben.status === 'Active' ? 'default' : 'secondary'} className="font-normal">
                 {ben.status}
               </Badge>
             </CardContent>
          </Card>
        ))}
      </div>
    </Layout>
  );
}
