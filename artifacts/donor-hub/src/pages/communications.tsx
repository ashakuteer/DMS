import { Layout } from "@/components/layout";
import { useListCommunications, useCreateCommunication } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { communicationSchema } from "@/lib/zod-schemas";
import { useState } from "react";
import { Send, Mail, MessageSquare, Phone } from "lucide-react";
import { format } from "date-fns";
import { z } from "zod";

export default function Communications() {
  const { data: comms } = useListCommunications();
  const createMutation = useCreateCommunication();
  const [open, setOpen] = useState(false);

  const form = useForm<z.infer<typeof communicationSchema>>({
    resolver: zodResolver(communicationSchema),
    defaultValues: { subject: "", body: "", type: "Email", sentAt: new Date().toISOString().split('T')[0] }
  });

  const onSubmit = (values: z.infer<typeof communicationSchema>) => {
    createMutation.mutate({ data: values }, {
      onSuccess: () => {
        setOpen(false);
        form.reset();
      }
    });
  };

  const getIcon = (type: string) => {
    switch(type) {
      case 'Email': return <Mail className="w-5 h-5 text-blue-500" />;
      case 'SMS': return <MessageSquare className="w-5 h-5 text-emerald-500" />;
      case 'Phone': return <Phone className="w-5 h-5 text-purple-500" />;
      default: return <Mail className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <Layout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Communications</h1>
          <p className="text-muted-foreground mt-1">Log outgoing messages and campaigns.</p>
        </div>
        
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-full shadow-lg shadow-primary/20">
              <Send className="w-4 h-4 mr-2" /> Compose
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] rounded-2xl">
            <DialogHeader>
              <DialogTitle className="font-display">New Communication</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                <FormField control={form.control} name="subject" render={({ field }) => (
                  <FormItem><FormLabel>Subject / Title</FormLabel><FormControl><Input className="rounded-xl" {...field} /></FormControl></FormItem>
                )} />
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="type" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Channel</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="Email">Email</SelectItem>
                          <SelectItem value="Letter">Letter</SelectItem>
                          <SelectItem value="SMS">SMS</SelectItem>
                          <SelectItem value="Phone">Phone</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="body" render={({ field }) => (
                  <FormItem><FormLabel>Message Body</FormLabel><FormControl><Textarea className="min-h-[150px] rounded-xl" {...field} /></FormControl></FormItem>
                )} />
                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={createMutation.isPending} className="rounded-xl px-8">Save Record</Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {comms?.map(c => (
          <Card key={c.id} className="border-border/50 shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
            <CardContent className="p-5 flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center shrink-0">
                {getIcon(c.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-semibold text-foreground truncate pr-4">{c.subject}</h3>
                  <span className="text-xs text-muted-foreground shrink-0">{format(new Date(c.createdAt), "MMM d, yyyy")}</span>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">{c.body}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </Layout>
  );
}
