import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient as qc } from "@/lib/queryClient";
import type { Document } from "@shared/schema";

const SYSTEM_TAGS = [
  { value: "steuerrelevant", label: "Steuerrelevant", description: "Für Steuererklärung wichtig" },
  { value: "geschäftlich", label: "Geschäftlich", description: "Geschäftliche Dokumente" },
  { value: "privat", label: "Privat", description: "Private Dokumente" },
  { value: "versicherung", label: "Versicherung", description: "Versicherungsdokumente" },
  { value: "miete", label: "Miete", description: "Miet- und Nebenkostenabrechnungen" },
  { value: "gesundheit", label: "Gesundheit", description: "Gesundheits- und Arztdokumente" },
  { value: "bank", label: "Bank", description: "Bankunterlagen" },
  { value: "vertrag", label: "Vertrag", description: "Verträge und Vereinbarungen" },
  { value: "rechnung", label: "Rechnung", description: "Rechnungen und Belege" },
  { value: "lohnabrechnung", label: "Lohnabrechnung", description: "Gehaltsabrechnungen" },
  { value: "spende", label: "Spende", description: "Spendenquittungen" },
] as const;

interface SmartTagsDialogProps {
  document: Document;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function SmartTagsDialog({ document, trigger, open: controlledOpen, onOpenChange }: SmartTagsDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>(document.systemTags || []);
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Use controlled state if provided, otherwise use internal state
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  const handleToggleTag = (tag: string) => {
    setSelectedTags(prev => {
      if (prev.includes(tag)) {
        return prev.filter(t => t !== tag);
      } else {
        return [...prev, tag];
      }
    });
  };

  const handleSave = async () => {
    setIsUpdating(true);
    try {
      await apiRequest(`/api/documents/${document.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ systemTags: selectedTags.length > 0 ? selectedTags : null }),
        headers: { 'Content-Type': 'application/json' },
      });

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/documents", document.id] });
      
      setOpen(false);
      toast({
        title: "Smart-Tags aktualisiert",
        description: "Die Smart-Tags wurden erfolgreich gespeichert.",
      });
    } catch (error: any) {
      toast({
        title: "Fehler beim Aktualisieren",
        description: error.message || "Die Smart-Tags konnten nicht aktualisiert werden.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-[500px]" data-testid="dialog-smart-tags">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Smart-Tags bearbeiten
          </DialogTitle>
          <DialogDescription>
            Weisen Sie diesem Dokument Smart-Tags zu, um es in den entsprechenden Smart-Ordnern zu finden.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="space-y-3">
            {SYSTEM_TAGS.map((tag) => {
              const isChecked = selectedTags.includes(tag.value);
              
              return (
                <div key={tag.value} className="flex items-start space-x-3 p-3 rounded-lg hover-elevate active-elevate-2 cursor-pointer" onClick={() => handleToggleTag(tag.value)}>
                  <Checkbox
                    id={`tag-${tag.value}`}
                    checked={isChecked}
                    onCheckedChange={() => handleToggleTag(tag.value)}
                    data-testid={`checkbox-tag-${tag.value}`}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="flex-1 space-y-0.5">
                    <Label
                      htmlFor={`tag-${tag.value}`}
                      className="text-sm font-medium leading-none cursor-pointer"
                    >
                      {tag.label}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {tag.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isUpdating}
            data-testid="button-cancel"
          >
            Abbrechen
          </Button>
          <Button
            onClick={handleSave}
            disabled={isUpdating}
            data-testid="button-save"
          >
            {isUpdating ? "Speichern..." : "Speichern"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
