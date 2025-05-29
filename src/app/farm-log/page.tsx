
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon, PlusCircle, Trash2, Edit3, Leaf, Notebook, Image as ImageIcon } from "lucide-react";
import { format } from "date-fns";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";

interface LogEntry {
  id: string;
  cropType: string;
  plantingDate: Date | undefined;
  notes: string;
  imagePreview?: string;
}

export default function FarmLogPage() {
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
  const [cropType, setCropType] = useState("");
  const [plantingDate, setPlantingDate] = useState<Date | undefined>();
  const [notes, setNotes] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [editingEntry, setEditingEntry] = useState<LogEntry | null>(null);

  const { toast } = useToast();

  // Load entries from local storage on mount
  useEffect(() => {
    const storedEntries = localStorage.getItem("farmLogEntries");
    if (storedEntries) {
      setLogEntries(JSON.parse(storedEntries).map((entry: LogEntry) => ({
        ...entry,
        plantingDate: entry.plantingDate ? new Date(entry.plantingDate) : undefined,
      })));
    }
  }, []);

  // Save entries to local storage whenever they change
  useEffect(() => {
    localStorage.setItem("farmLogEntries", JSON.stringify(logEntries));
  }, [logEntries]);


  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setImageFile(null);
      setImagePreview(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cropType.trim()) {
      toast({ title: "Error", description: "Crop type is required.", variant: "destructive" });
      return;
    }

    const newEntry: LogEntry = {
      id: editingEntry ? editingEntry.id : Date.now().toString(),
      cropType,
      plantingDate,
      notes,
      imagePreview: imagePreview || undefined,
    };

    if (editingEntry) {
      setLogEntries(logEntries.map(entry => entry.id === editingEntry.id ? newEntry : entry));
      setEditingEntry(null);
      toast({ title: "Log Updated", description: `Entry for ${newEntry.cropType} has been updated.`});
    } else {
      setLogEntries([newEntry, ...logEntries]);
      toast({ title: "Log Added", description: `New entry for ${newEntry.cropType} has been added.`});
    }
    
    // Reset form
    setCropType("");
    setPlantingDate(undefined);
    setNotes("");
    setImageFile(null);
    setImagePreview(null);
  };

  const handleEdit = (entry: LogEntry) => {
    setEditingEntry(entry);
    setCropType(entry.cropType);
    setPlantingDate(entry.plantingDate);
    setNotes(entry.notes);
    setImagePreview(entry.imagePreview || null);
    // Note: imageFile is not reset here, user needs to re-upload if they want to change it
  };

  const handleDelete = (id: string) => {
    setLogEntries(logEntries.filter(entry => entry.id !== id));
    toast({ title: "Log Deleted", description: "The farm log entry has been removed.", variant: "destructive" });
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-bold flex items-center gap-2">
            <Notebook className="w-8 h-8 text-primary" /> {editingEntry ? "Edit Farm Log Entry" : "Add New Farm Log Entry"}
          </CardTitle>
          <CardDescription>
            {editingEntry ? "Update the details for this farm log entry." : "Keep track of your farming activities and observations."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="cropType">Crop Type</Label>
                <Input id="cropType" placeholder="e.g., Corn, Soybeans" value={cropType} onChange={(e) => setCropType(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="plantingDate">Planting Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !plantingDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {plantingDate ? format(plantingDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={plantingDate}
                      onSelect={setPlantingDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Notes / Observations</Label>
              <Textarea id="notes" placeholder="e.g., Weather conditions, growth stage, pest sightings" value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="image">Image (Optional)</Label>
              <Input id="image" type="file" accept="image/*" onChange={handleImageChange} />
              {imagePreview && (
                <div className="mt-2">
                  <Image src={imagePreview} alt="Preview" width={200} height={200} className="rounded-md border object-cover" data-ai-hint="farm field" />
                </div>
              )}
            </div>

            <Button type="submit" className="w-full md:w-auto">
              <PlusCircle className="mr-2 h-4 w-4" /> {editingEntry ? "Update Entry" : "Add Entry"}
            </Button>
            {editingEntry && (
              <Button type="button" variant="outline" onClick={() => { setEditingEntry(null); setCropType(""); setPlantingDate(undefined); setNotes(""); setImagePreview(null); }} className="w-full md:w-auto md:ml-2">
                Cancel Edit
              </Button>
            )}
          </form>
        </CardContent>
      </Card>

      {logEntries.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold">Logged Entries</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {logEntries.map((entry) => (
              <Card key={entry.id} className="shadow-md flex flex-col">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Leaf className="w-6 h-6 text-primary" />{entry.cropType}</CardTitle>
                  {entry.plantingDate && (
                    <CardDescription>Planted: {format(entry.plantingDate, "PPP")}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="flex-grow">
                  {entry.imagePreview && (
                    <div className="mb-4">
                      <Image src={entry.imagePreview} alt={entry.cropType} width={300} height={200} className="rounded-md w-full object-cover aspect-[3/2]" data-ai-hint="crop field" />
                    </div>
                  )}
                  {entry.notes && <p className="text-sm text-muted-foreground whitespace-pre-wrap">{entry.notes}</p>}
                  {!entry.notes && !entry.imagePreview && <p className="text-sm text-muted-foreground italic">No notes or image for this entry.</p>}
                </CardContent>
                <CardFooter className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(entry)}>
                    <Edit3 className="mr-1 h-4 w-4" /> Edit
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(entry.id)}>
                    <Trash2 className="mr-1 h-4 w-4" /> Delete
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      )}
       {logEntries.length === 0 && !editingEntry && (
         <Card className="shadow-lg text-center">
            <CardHeader>
                <CardTitle>No Farm Log Entries Yet</CardTitle>
            </CardHeader>
            <CardContent>
                <ImageIcon className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Start by adding your first farm log entry using the form above.</p>
            </CardContent>
         </Card>
       )}
    </div>
  );
}