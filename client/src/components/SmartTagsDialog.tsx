import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Tag } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Document } from "@shared/schema";

// Der Smart Tag den wir verwenden
const SYSTEM_TAGS = [
  { value: "steuerrelevant", label: "Steuerrelevant", icon: "💰" },
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
      await apiRequest('PATCH', `/api/documents/${document.id}`, {
        systemTags: selectedTags.length > 0 ? selectedTags : null,
      });

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/documents", document.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/smart-folders"] });
      
      setOpen(false);
      toast({
        title: "Steuerrelevanz aktualisiert",
        description: "Die Markierung wurde erfolgreich gespeichert.",
      });
    } catch (error: any) {
      toast({
        title: "Fehler beim Aktualisieren",
        description: error.message || "Die Markierung konnte nicht aktualisiert werden.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-md" data-testid="dialog-smart-tags">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-xl">💰</span>
            Steuerrelevant markieren
          </DialogTitle>
          <DialogDescription>
            {document.title}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-2 py-4">
          {SYSTEM_TAGS.map((tag) => {
            const isSelected = selectedTags.includes(tag.value);
            return (
              <button
                key={tag.value}
                onClick={() => handleToggleTag(tag.value)}
                className={`w-full flex items-center justify-between p-3 rounded-md border transition-colors ${
                  isSelected
                    ? 'bg-primary/10 border-primary'
                    : 'bg-background border-border hover-elevate'
                }`}
                data-testid={`button-tag-${tag.value}`}
              >
                <span className="flex items-center gap-2.5">
                  <span className="text-lg">{tag.icon}</span>
                  <span className="font-medium">{tag.label}</span>
                </span>
                {isSelected && <span className="text-primary font-bold">✓</span>}
              </button>
            );
          })}
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
