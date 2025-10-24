import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, ChevronLeft, ChevronRight } from "lucide-react";
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
  
  // Check if the document is a PDF using mimeType
  const isPdf = document.mimeType === 'application/pdf';
  
  // For PDFs, use our proxy endpoint instead of direct S3 URL to avoid Chrome blocking
  const viewUrl = isPdf ? `/api/documents/${document.id}/view` : currentPageUrl;

  // Get file extension from MIME type
  const getExtensionFromMimeType = (mimeType: string | null | undefined): string => {
    if (!mimeType) return 'jpg';
    const mimeMap: Record<string, string> = {
      'application/pdf': 'pdf',
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/gif': 'gif',
    };
    return mimeMap[mimeType.toLowerCase()] || 'jpg';
  };

  const handleDownloadPDF = () => {
    const link = window.document.createElement('a');
    link.href = `/api/documents/${document.id}/download-pdf`;
    link.download = `${document.title}.pdf`;
    link.click();
  };

  const handleDownloadPage = (pageIndex: number) => {
    const urlToDownload = pageUrls[pageIndex];
    const extension = getExtensionFromMimeType(document.mimeType);
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
        <div className="px-4 sm:px-6 py-4 border-b">
          <h2 className="text-lg sm:text-xl font-semibold truncate pr-10">{document.title}</h2>
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

        {/* Main viewer area */}
        <div className="flex-1 overflow-auto bg-muted/30 relative">
          {/* Floating download button - desktop only */}
          <div className="hidden sm:block absolute top-4 right-4 z-10">
            <Button
              variant="default"
              size="sm"
              onClick={handleDownloadPDF}
              data-testid="button-download-pdf"
              className="h-9 shadow-lg"
            >
              <Download className="h-4 w-4 mr-2" />
              <span>PDF</span>
            </Button>
          </div>
          <div className="flex items-center justify-center h-full p-4">
            {isPdf ? (
              <div className="flex flex-col items-center justify-center gap-6 max-w-md mx-auto text-center">
                <div className="rounded-full bg-primary/10 p-6">
                  <svg className="w-16 h-16 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">{document.title}</h3>
                  <p className="text-muted-foreground mb-4">
                    PDF-Dokument • {document.category}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Browser können PDFs nicht immer direkt anzeigen. Laden Sie das PDF herunter, um es zu öffnen.
                  </p>
                </div>
                <Button
                  size="lg"
                  onClick={handleDownloadPDF}
                  data-testid="button-download-pdf-viewer"
                  className="w-full"
                >
                  <Download className="h-5 w-5 mr-2" />
                  PDF herunterladen und öffnen
                </Button>
              </div>
            ) : (
              <img
                src={viewUrl}
                alt={`${document.title} - Seite ${currentPage + 1}`}
                className="max-w-full max-h-full object-contain"
                data-testid={`img-page-${currentPage}`}
              />
            )}
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

          {/* Floating download button for mobile */}
          <div className="sm:hidden absolute bottom-6 left-1/2 -translate-x-1/2">
            <Button
              variant="default"
              size="lg"
              onClick={handleDownloadPDF}
              data-testid="button-download-pdf-mobile"
              className="shadow-lg"
            >
              <Download className="h-5 w-5 mr-2" />
              PDF herunterladen
            </Button>
          </div>
        </div>

        {/* Page thumbnails for multi-page documents (only for images, not PDFs) */}
        {totalPages > 1 && !isPdf && (
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
