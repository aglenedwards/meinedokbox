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
        {/* Custom close button - larger and more mobile-friendly */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="absolute right-4 top-4 z-50 h-10 w-10"
          data-testid="button-close-viewer"
        >
          <X className="h-6 w-6" />
        </Button>

        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="text-xl pr-12">{document.title}</DialogTitle>
          <div className="flex items-center gap-3 text-sm text-muted-foreground mt-2 flex-wrap">
            <span>{document.category}</span>
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
            <object
              data={documentUrl}
              type="application/pdf"
              className="w-full h-full"
              data-testid="object-pdf-viewer"
            >
              <div className="flex flex-col items-center justify-center h-full p-8 text-center gap-4">
                <p className="text-muted-foreground">
                  PDF kann in diesem Browser nicht angezeigt werden.
                </p>
                <Button onClick={handleDownload} variant="default">
                  <Download className="h-4 w-4 mr-2" />
                  PDF herunterladen
                </Button>
              </div>
            </object>
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
