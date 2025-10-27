import { AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { DuplicateInfo } from "@/lib/api";

interface DuplicateWarningDialogProps {
  open: boolean;
  duplicates: Array<{ filename: string; duplicate: DuplicateInfo }>;
  onCancel: () => void;
  onUploadAnyway: () => void;
}

export function DuplicateWarningDialog({
  open,
  duplicates,
  onCancel,
  onUploadAnyway,
}: DuplicateWarningDialogProps) {
  const singleDuplicate = duplicates.length === 1;
  
  return (
    <AlertDialog open={open}>
      <AlertDialogContent data-testid="dialog-duplicate-warning">
        <AlertDialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-5 w-5 text-destructive" data-testid="icon-warning" />
            <AlertDialogTitle data-testid="text-duplicate-title">
              {singleDuplicate ? "Dokument bereits vorhanden" : "Dokumente bereits vorhanden"}
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p data-testid="text-duplicate-description">
                {singleDuplicate
                  ? "Dieses Dokument wurde bereits hochgeladen:"
                  : "Diese Dokumente wurden bereits hochgeladen:"}
              </p>
              
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {duplicates.map(({ filename, duplicate }, index) => (
                  <div
                    key={index}
                    className="p-3 rounded-md bg-muted/50 space-y-1"
                    data-testid={`duplicate-item-${index}`}
                  >
                    <p className="font-medium text-sm" data-testid={`text-filename-${index}`}>
                      {filename}
                    </p>
                    <div className="text-xs text-muted-foreground space-y-0.5">
                      <p data-testid={`text-original-title-${index}`}>
                        Original: <span className="font-medium">{duplicate.title}</span>
                      </p>
                      <p data-testid={`text-uploaded-date-${index}`}>
                        Hochgeladen:{" "}
                        <span className="font-medium">
                          {format(new Date(duplicate.uploadedAt), "dd.MM.yyyy", { locale: de })}
                        </span>
                      </p>
                      <p data-testid={`text-category-${index}`}>
                        Kategorie: <span className="font-medium">{duplicate.category}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              
              <p className="text-sm" data-testid="text-duplicate-question">
                Möchten Sie {singleDuplicate ? "dieses Dokument" : "diese Dokumente"} trotzdem
                nochmal hochladen?
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel} data-testid="button-cancel-upload">
            Abbrechen
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={onUploadAnyway}
            className="bg-destructive text-destructive-foreground hover-elevate"
            data-testid="button-upload-anyway"
          >
            Trotzdem hochladen
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
