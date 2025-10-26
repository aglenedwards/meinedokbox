import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { updateDocument } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Document } from "@shared/schema";

// Helper to parse German date format (DD.MM.YYYY) or ISO (YYYY-MM-DD)
const parseDateString = (dateStr: string): Date | null => {
  if (!dateStr || dateStr.trim() === "") return null;
  
  // Try German format DD.MM.YYYY
  if (dateStr.includes('.')) {
    const parts = dateStr.split('.');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // months are 0-indexed
      const year = parseInt(parts[2], 10);
      const date = new Date(year, month, day);
      if (!isNaN(date.getTime())) return date;
    }
  }
  
  // Try ISO format or other standard formats
  const date = new Date(dateStr);
  return !isNaN(date.getTime()) ? date : null;
};

const editDocumentSchema = z.object({
  title: z.string().min(1, "Titel muss mindestens 1 Zeichen lang sein").max(500),
  documentDate: z.string().optional().refine((val) => {
    if (!val || val.trim() === "") return true; // Empty is OK
    return parseDateString(val) !== null; // Check if valid date
  }, {
    message: "Ungültiges Datumsformat. Bitte verwenden Sie TT.MM.JJJJ oder JJJJ-MM-TT"
  }),
  amount: z.string().optional(),
  sender: z.string().max(200).optional(),
});

type EditDocumentFormData = z.infer<typeof editDocumentSchema>;

interface EditDocumentDialogProps {
  document: Document;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function EditDocumentDialog({ document, trigger, open: controlledOpen, onOpenChange }: EditDocumentDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const { toast } = useToast();
  
  // Use controlled state if provided, otherwise use internal state
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  // Format documentDate for input (DD.MM.YYYY German format)
  const formatDateForInput = (date?: Date | string | null) => {
    if (!date) return "";
    
    const parsedDate = parseDateString(typeof date === 'string' ? date : date.toISOString());
    if (!parsedDate) return "";
    
    // Return in German format DD.MM.YYYY
    const day = String(parsedDate.getDate()).padStart(2, '0');
    const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
    const year = parsedDate.getFullYear();
    
    return `${day}.${month}.${year}`;
  };

  const form = useForm<EditDocumentFormData>({
    resolver: zodResolver(editDocumentSchema),
    defaultValues: {
      title: document.title || "",
      documentDate: formatDateForInput(document.documentDate),
      amount: document.amount?.toString() || "",
      sender: document.sender || "",
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: EditDocumentFormData) => {
      // Convert form data to API format
      const updateData: {
        title?: string;
        documentDate?: string | null;
        amount?: number | null;
        sender?: string | null;
      } = {};

      if (data.title !== document.title) {
        updateData.title = data.title;
      }

      // Handle documentDate
      if (data.documentDate && data.documentDate.trim() !== "") {
        const parsedDate = parseDateString(data.documentDate);
        if (parsedDate) {
          const dateValue = parsedDate.toISOString();
          const currentDateStr = document.documentDate ? new Date(document.documentDate).toISOString() : null;
          if (dateValue !== currentDateStr) {
            updateData.documentDate = dateValue;
          }
        }
      } else if (document.documentDate) {
        // User cleared the date
        updateData.documentDate = null;
      }

      // Handle amount
      if (data.amount) {
        const amountValue = parseFloat(data.amount);
        if (!isNaN(amountValue) && amountValue !== document.amount) {
          updateData.amount = amountValue;
        }
      } else if (document.amount) {
        // User cleared the amount
        updateData.amount = null;
      }

      // Handle sender
      if (data.sender !== document.sender) {
        updateData.sender = data.sender || null;
      }

      return updateDocument(document.id, updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/documents", document.id] });
      setOpen(false);
      toast({
        title: "Dokument aktualisiert",
        description: "Die Änderungen wurden erfolgreich gespeichert.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Fehler beim Aktualisieren",
        description: error.message || "Das Dokument konnte nicht aktualisiert werden.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EditDocumentFormData) => {
    updateMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {/* Only render trigger in uncontrolled mode */}
      {controlledOpen === undefined && (
        <DialogTrigger asChild>
          {trigger || (
            <Button variant="ghost" size="sm" data-testid="button-edit-document">
              <Edit className="h-4 w-4 mr-2" />
              Bearbeiten
            </Button>
          )}
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[500px]" data-testid="dialog-edit-document">
        <DialogHeader>
          <DialogTitle>Dokument bearbeiten</DialogTitle>
          <DialogDescription>
            Ändern Sie die Metadaten des Dokuments.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Titel</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Dokumententitel"
                      data-testid="input-title"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="documentDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dokumentdatum</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="text"
                      placeholder="TT.MM.JJJJ (z.B. 08.08.2023)"
                      data-testid="input-document-date"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Betrag (€)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      data-testid="input-amount"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sender"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Absender</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Name des Absenders"
                      data-testid="input-sender"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                data-testid="button-cancel"
              >
                Abbrechen
              </Button>
              <Button
                type="submit"
                disabled={updateMutation.isPending}
                data-testid="button-save"
              >
                {updateMutation.isPending ? "Wird gespeichert..." : "Speichern"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
