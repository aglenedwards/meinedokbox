import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, X } from "lucide-react";
import { Document, Page, pdfjs } from 'react-pdf';
import type { Document as DocumentType } from "@shared/schema";
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

interface DocumentViewerProps {
  document: DocumentType | null;
  open: boolean;
  onClose: () => void;
}

export function DocumentViewer({ document, open, onClose }: DocumentViewerProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [pdfNumPages, setPdfNumPages] = useState<number | null>(null);
  const [pdfScale, setPdfScale] = useState(1.0);
  const [pdfLoading, setPdfLoading] = useState(true);

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
  
  // For PDFs, use our proxy endpoint instead of direct S3 URL
  const pdfViewUrl = isPdf ? `/api/documents/${document.id}/view` : currentPageUrl;

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
    if (isPdf && pdfNumPages) {
      if (currentPage < pdfNumPages - 1) {
        setCurrentPage(currentPage + 1);
      }
    } else {
      if (currentPage < totalPages - 1) {
        setCurrentPage(currentPage + 1);
      }
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setPdfNumPages(numPages);
    setPdfLoading(false);
    setCurrentPage(0);
  };

  const handleZoomIn = () => {
    setPdfScale(scale => Math.min(2.5, scale + 0.2));
  };

  const handleZoomOut = () => {
    setPdfScale(scale => Math.max(0.5, scale - 0.2));
  };

  const displayedPages = isPdf && pdfNumPages ? pdfNumPages : totalPages;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full h-[90vh] flex flex-col p-0 gap-0">
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 border-b relative">
          {/* Close and Download buttons - top right corner */}
          <div className="absolute top-2 right-2 flex flex-col gap-1 z-10">
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              data-testid="button-close-viewer"
              className="h-8 w-8 rounded-full hover:bg-accent"
              aria-label="Schließen"
            >
              <X className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={isPdf ? handleDownloadPDF : () => handleDownloadPage(currentPage)}
              data-testid="button-download-viewer"
              className="h-8 w-8 rounded-full hover:bg-accent"
              aria-label={isPdf ? 'PDF herunterladen' : 'Bild herunterladen'}
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>

          {/* Title and info - with padding to avoid button overlap */}
          <div className="pr-12">
            <h2 className="text-lg sm:text-xl font-semibold truncate">{document.title}</h2>
            <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1 flex-wrap">
              <span>{document.category}</span>
              {displayedPages > 1 && (
                <>
                  <span>•</span>
                  <span>Seite {currentPage + 1} von {displayedPages}</span>
                </>
              )}
              {isPdf && (
                <>
                  <span>•</span>
                  <span>{Math.round(pdfScale * 100)}%</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Main viewer area */}
        <div className="flex-1 overflow-auto bg-muted/30 relative">
          {/* Floating toolbar for PDF - desktop only */}
          {isPdf && (
            <div className="hidden sm:flex absolute top-4 right-4 z-10 gap-2">
              <Button
                variant="default"
                size="icon"
                onClick={handleZoomOut}
                disabled={pdfScale <= 0.5}
                data-testid="button-zoom-out"
                className="h-9 w-9 shadow-lg"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button
                variant="default"
                size="icon"
                onClick={handleZoomIn}
                disabled={pdfScale >= 2.5}
                data-testid="button-zoom-in"
                className="h-9 w-9 shadow-lg"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
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
          )}

          {/* Floating download button for images - desktop only */}
          {!isPdf && (
            <div className="hidden sm:block absolute top-4 right-4 z-10">
              <Button
                variant="default"
                size="sm"
                onClick={() => handleDownloadPage(currentPage)}
                data-testid="button-download-image"
                className="h-9 shadow-lg"
              >
                <Download className="h-4 w-4 mr-2" />
                <span>Bild</span>
              </Button>
            </div>
          )}

          <div className="flex items-center justify-center h-full p-4 overflow-x-hidden">
            {isPdf ? (
              <div className="flex flex-col items-center justify-center w-full h-full max-w-full">
                {pdfLoading && (
                  <div className="text-center text-muted-foreground mb-4">
                    PDF wird geladen...
                  </div>
                )}
                <div className="w-full max-w-full overflow-hidden flex justify-center">
                  <Document
                    file={pdfViewUrl}
                    onLoadSuccess={onDocumentLoadSuccess}
                    onLoadError={(error) => {
                      console.error('PDF load error:', error);
                      setPdfLoading(false);
                    }}
                    loading=""
                    className="flex items-center justify-center max-w-full"
                  >
                    <Page 
                      pageNumber={currentPage + 1}
                      scale={pdfScale}
                      renderTextLayer={true}
                      renderAnnotationLayer={true}
                      className="shadow-lg sm:max-w-none max-w-full"
                      data-testid={`pdf-page-${currentPage + 1}`}
                      width={window.innerWidth < 640 ? Math.min(window.innerWidth - 32, 800) : undefined}
                    />
                  </Document>
                </div>
              </div>
            ) : (
              <img
                src={currentPageUrl}
                alt={`${document.title} - Seite ${currentPage + 1}`}
                className="max-w-full max-h-full object-contain"
                data-testid={`img-page-${currentPage}`}
              />
            )}
          </div>

          {/* Navigation arrows for multi-page documents */}
          {displayedPages > 1 && (
            <>
              <Button
                variant="outline"
                size="icon"
                onClick={goToPreviousPage}
                disabled={currentPage === 0}
                className="absolute left-4 bottom-4 sm:left-4 sm:top-1/2 sm:-translate-y-1/2 sm:bottom-auto h-12 w-12 bg-background/90 hover:bg-background shadow-lg z-10"
                data-testid="button-previous-page"
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={goToNextPage}
                disabled={currentPage === displayedPages - 1}
                className="absolute right-4 bottom-4 sm:right-4 sm:top-1/2 sm:-translate-y-1/2 sm:bottom-auto h-12 w-12 bg-background/90 hover:bg-background shadow-lg z-10"
                data-testid="button-next-page"
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </>
          )}

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
