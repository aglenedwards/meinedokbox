import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";
import type { Document } from "@shared/schema";

interface DocumentViewerProps {
  document: Document | null;
  open: boolean;
  onClose: () => void;
}

export function DocumentViewer({ document, open, onClose }: DocumentViewerProps) {
  if (!document) return null;

  const isPDF = document.fileUrl.toLowerCase().endsWith('.pdf');
  const fileExtension = document.fileUrl.split('.').pop()?.toLowerCase();
  
  // fileUrl is stored as "/objects/uploads/xyz" in the database
  // The server endpoint expects just the path, so we use it as-is
  const documentUrl = document.fileUrl;

  const handleDownload = () => {
    const link = window.document.createElement('a');
    link.href = documentUrl;
    link.download = `${document.title}.${fileExtension}`;
    link.click();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="text-xl">{document.title}</DialogTitle>
          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
            <span>Kategorie: {document.category}</span>
            <span>•</span>
            <span>Vertrauen: {Math.round(document.confidence * 100)}%</span>
            <span>•</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDownload}
              data-testid="button-download-document"
              className="h-auto p-0 text-muted-foreground hover:text-foreground"
            >
              <Download className="h-4 w-4 mr-1" />
              Download
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto bg-muted/30">
          {isPDF ? (
            <iframe
              src={documentUrl}
              className="w-full h-full border-0"
              title={document.title}
              data-testid="iframe-pdf-viewer"
            />
          ) : (
            <div className="flex items-center justify-center h-full p-4">
              <img
                src={documentUrl}
                alt={document.title}
                className="max-w-full max-h-full object-contain"
                data-testid="img-document-viewer"
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
