import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, X, ChevronLeft, ChevronRight } from "lucide-react";
import type { Document } from "@shared/schema";

interface DocumentViewerProps {
  document: Document | null;
  open: boolean;
  onClose: () => void;
}

export function DocumentViewer({ document, open, onClose }: DocumentViewerProps) {
  const [currentPage, setCurrentPage] = useState(0);

  if (!document) return null;

  // Get all page URLs (either from pageUrls array or single fileUrl)
  const pageUrls = document.pageUrls && document.pageUrls.length > 0 
    ? document.pageUrls 
    : document.fileUrl 
      ? [document.fileUrl] 
      : [];

  if (pageUrls.length === 0) return null;

  const totalPages = pageUrls.length;
  const currentPageUrl = pageUrls[currentPage];

  const handleDownloadPDF = () => {
    const link = window.document.createElement('a');
    link.href = `/api/documents/${document.id}/download-pdf`;
    link.download = `${document.title}.pdf`;
    link.click();
  };

  const handleDownloadPage = (pageIndex: number) => {
    const urlToDownload = pageUrls[pageIndex];
    const extension = urlToDownload.split('.').pop()?.toLowerCase() || 'jpg';
    const link = window.document.createElement('a');
    link.href = urlToDownload;
    link.download = totalPages > 1
      ? `${document.title}_Seite_${pageIndex + 1}.${extension}`
      : `${document.title}.${extension}`;
    link.click();
  };

  const goToNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full h-[90vh] flex flex-col p-0 gap-0">
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-semibold truncate">{document.title}</h2>
            <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1 flex-wrap">
              <span>{document.category}</span>
              {totalPages > 1 && (
                <>
                  <span>•</span>
                  <span>Seite {currentPage + 1} von {totalPages}</span>
                </>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadPDF}
              data-testid="button-download-pdf"
            >
              <Download className="h-4 w-4 mr-1" />
              PDF
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-10 w-10"
              data-testid="button-close-viewer"
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
        </div>

        {/* Main viewer area */}
        <div className="flex-1 overflow-auto bg-muted/30 relative">
          <div className="flex items-center justify-center h-full p-4">
            <img
              src={currentPageUrl}
              alt={`${document.title} - Seite ${currentPage + 1}`}
              className="max-w-full max-h-full object-contain"
              data-testid={`img-page-${currentPage}`}
            />
          </div>

          {/* Navigation arrows for multi-page documents */}
          {totalPages > 1 && (
            <>
              <Button
                variant="outline"
                size="icon"
                onClick={goToPreviousPage}
                disabled={currentPage === 0}
                className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 bg-background/90 hover:bg-background"
                data-testid="button-previous-page"
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={goToNextPage}
                disabled={currentPage === totalPages - 1}
                className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 bg-background/90 hover:bg-background"
                data-testid="button-next-page"
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </>
          )}
        </div>

        {/* Page thumbnails for multi-page documents */}
        {totalPages > 1 && (
          <div className="border-t p-3 bg-background">
            <div className="flex gap-2 overflow-x-auto">
              {pageUrls.map((url, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentPage(index)}
                  className={`relative flex-shrink-0 w-16 h-20 rounded border-2 overflow-hidden transition-all ${
                    currentPage === index
                      ? 'border-primary ring-2 ring-primary/20'
                      : 'border-border hover:border-primary/50'
                  }`}
                  data-testid={`button-thumbnail-${index}`}
                >
                  <img
                    src={url}
                    alt={`Seite ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-background/90 text-xs text-center py-0.5">
                    {index + 1}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
