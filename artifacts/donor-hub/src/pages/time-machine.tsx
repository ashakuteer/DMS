import { Layout } from "@/components/layout";
import { useListTimeMachineEntries, useCreateTimeMachineEntry } from "@workspace/api-client-react";
import { useUploadTimeMachinePhotosNative } from "@/hooks/use-uploads";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { timeMachineSchema } from "@/lib/zod-schemas";
import { useState } from "react";
import { Plus, Image as ImageIcon, MapPin, Calendar, Clock } from "lucide-react";
import { format } from "date-fns";
import { z } from "zod";
import { Link } from "wouter";

function EntryCard({ entry }: { entry: any }) {
  // Use first photo as thumbnail if exists, else placeholder
  const thumbnailUrl = entry.photos?.[0] || `https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=600&h=400&fit=crop&q=80`;
  
  const categoryColors: Record<string, string> = {
    "Success Story": "bg-emerald-500/10 text-emerald-700 border-emerald-200",
    "Inspiring Story": "bg-amber-500/10 text-amber-700 border-amber-200",
    "Recognition": "bg-blue-500/10 text-blue-700 border-blue-200",
    "Donor Support": "bg-purple-500/10 text-purple-700 border-purple-200",
    "Event by Kids": "bg-pink-500/10 text-pink-700 border-pink-200",
  };

  const colorClass = categoryColors[entry.category] || "bg-gray-500/10 text-gray-700 border-gray-200";

  return (
    <Link href={`/time-machine/${entry.id}`} className="block group">
      <Card className="border-border/50 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden rounded-2xl h-full flex flex-col">
        <div className="relative h-48 w-full overflow-hidden">
          {/* placeholder event smiling kids */}
          <img src={thumbnailUrl} alt={entry.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
          <Badge className={`absolute top-3 left-3 shadow-sm border ${colorClass}`}>
            {entry.category}
          </Badge>
          <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center text-white">
            <div className="flex items-center text-xs font-medium bg-black/40 backdrop-blur-md px-2 py-1 rounded-md">
              <Calendar className="w-3 h-3 mr-1.5" />
              {format(new Date(entry.eventDate), "MMM d, yyyy")}
            </div>
            {entry.photos?.length > 1 && (
              <div className="flex items-center text-xs font-medium bg-black/40 backdrop-blur-md px-2 py-1 rounded-md">
                <ImageIcon className="w-3 h-3 mr-1" />
                {entry.photos.length}
              </div>
            )}
          </div>
        </div>
        <CardContent className="p-5 flex-1 flex flex-col">
          <div className="flex items-center text-xs font-semibold text-primary mb-2 uppercase tracking-wider">
            <MapPin className="w-3 h-3 mr-1" /> {entry.home}
          </div>
          <h3 className="text-lg font-display font-bold text-foreground leading-tight mb-2 group-hover:text-primary transition-colors line-clamp-2">
            {entry.title}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-3 mb-4 flex-1">
            {entry.description}
          </p>
          <div className="text-xs text-muted-foreground flex items-center mt-auto pt-4 border-t border-border/40">
            <Clock className="w-3 h-3 mr-1" /> Added {format(new Date(entry.createdAt), "MMM d")}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function TimeMachine() {
  const { data: entries, isLoading } = useListTimeMachineEntries();
  const createMutation = useCreateTimeMachineEntry();
  const uploadPhotosMutation = useUploadTimeMachinePhotosNative();
  const [open, setOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const form = useForm<z.infer<typeof timeMachineSchema>>({
    resolver: zodResolver(timeMachineSchema),
    defaultValues: {
      title: "", description: "", category: "General Update", home: "All Homes", eventDate: new Date().toISOString().split('T')[0]
    }
  });

  const onSubmit = (values: z.infer<typeof timeMachineSchema>) => {
    // 1. Create entry
    createMutation.mutate({ data: values }, {
      onSuccess: (newEntry) => {
        // 2. Upload photos if selected
        if (selectedFiles.length > 0) {
          uploadPhotosMutation.mutate({ id: newEntry.id, files: selectedFiles }, {
            onSuccess: () => {
              setOpen(false);
              form.reset();
              setSelectedFiles([]);
            }
          });
        } else {
          setOpen(false);
          form.reset();
        }
      }
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  return (
    <Layout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-2">
            Time Machine <Clock className="w-6 h-6 text-primary" />
          </h1>
          <p className="text-muted-foreground mt-1">Chronicle the journey, success stories, and memories.</p>
        </div>
        
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-full shadow-lg shadow-primary/20 hover:shadow-xl hover:-translate-y-0.5 transition-all">
              <Plus className="w-5 h-5 mr-2" /> Add Memory
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[700px] rounded-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-display text-xl">Create a New Memory</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 pt-4">
                <FormField control={form.control} name="title" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl><Input placeholder="A memorable day..." className="rounded-xl" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="category" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          {timeMachineSchema.shape.category.options.map(o => (
                            <SelectItem key={o} value={o}>{o}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="home" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location / Home</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          {timeMachineSchema.shape.home.options.map(o => (
                            <SelectItem key={o} value={o}>{o}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="eventDate" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event Date</FormLabel>
                      <FormControl><Input type="date" className="rounded-xl" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description / Story</FormLabel>
                    <FormControl><Textarea placeholder="Tell the story..." className="min-h-[120px] rounded-xl" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                
                {/* Photo Upload Section */}
                <div className="space-y-2">
                  <FormLabel>Photos</FormLabel>
                  <div className="border-2 border-dashed border-border/60 rounded-xl p-6 flex flex-col items-center justify-center bg-muted/20 hover:bg-muted/40 transition-colors">
                    <ImageIcon className="w-8 h-8 text-muted-foreground mb-2" />
                    <p className="text-sm font-medium">Click to select photos</p>
                    <p className="text-xs text-muted-foreground mb-4">You can select multiple images</p>
                    <Input type="file" multiple accept="image/*" onChange={handleFileSelect} className="max-w-[250px]" />
                    {selectedFiles.length > 0 && (
                      <p className="mt-4 text-sm font-semibold text-primary">{selectedFiles.length} file(s) selected</p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-border/50">
                  <Button type="submit" disabled={createMutation.isPending || uploadPhotosMutation.isPending} className="rounded-xl px-8">
                    {createMutation.isPending || uploadPhotosMutation.isPending ? "Saving..." : "Save Memory"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {entries?.map(entry => <EntryCard key={entry.id} entry={entry} />)}
      </div>
    </Layout>
  );
}
