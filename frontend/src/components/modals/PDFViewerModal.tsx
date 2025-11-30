import React, { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import {
  X,
  Download,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Configure PDF worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  pdfBase64: string | null;
  title: string;
  fileName: string;
  onRegenerate?: () => void;
  isRegenerating?: boolean;
}

const PDFViewerModal: React.FC<PDFViewerModalProps> = ({
  isOpen,
  onClose,
  pdfBase64,
  title,
  fileName,
  onRegenerate,
  isRegenerating = false,
}) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);

  if (!isOpen) return null;

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setPageNumber(1);
  };

  const changePage = (offset: number) => {
    setPageNumber((prevPageNumber) => prevPageNumber + offset);
  };

  const previousPage = () => changePage(-1);
  const nextPage = () => changePage(1);

  const handleDownload = () => {
    if (!pdfBase64) return;
    const link = document.createElement("a");
    link.href = `data:application/pdf;base64,${pdfBase64}`;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">
            {title}
          </h2>
          <div className="flex items-center gap-2">
            {onRegenerate && (
              <button
                onClick={onRegenerate}
                disabled={isRegenerating}
                className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
                title="Regenerate PDF"
              >
                <RefreshCw
                  size={20}
                  className={isRegenerating ? "animate-spin" : ""}
                />
              </button>
            )}
            <button
              onClick={handleDownload}
              className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              title="Download PDF"
            >
              <Download size={20} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between p-2 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setScale((s) => Math.max(0.5, s - 0.1))}
              className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg"
              title="Zoom Out"
            >
              <ZoomOut size={18} />
            </button>
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300 w-12 text-center">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={() => setScale((s) => Math.min(2.0, s + 0.1))}
              className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg"
              title="Zoom In"
            >
              <ZoomIn size={18} />
            </button>
          </div>
          <div className="flex items-center gap-4">
            <button
              disabled={pageNumber <= 1}
              onClick={previousPage}
              className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg disabled:opacity-50"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
              Page {pageNumber} of {numPages || "--"}
            </span>
            <button
              disabled={numPages === null || pageNumber >= numPages}
              onClick={nextPage}
              className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg disabled:opacity-50"
            >
              <ChevronRight size={18} />
            </button>
          </div>
          <div className="w-20"></div> {/* Spacer for balance */}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto bg-slate-50 dark:bg-slate-900/50 flex justify-center p-8">
          {pdfBase64 ? (
            <Document
              file={`data:application/pdf;base64,${pdfBase64}`}
              onLoadSuccess={onDocumentLoadSuccess}
              loading={
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              }
              error={
                <div className="flex flex-col items-center justify-center h-full text-red-500">
                  <p>Failed to load PDF.</p>
                </div>
              }
            >
              <Page
                pageNumber={pageNumber}
                scale={scale}
                renderTextLayer={true}
                renderAnnotationLayer={true}
                className="shadow-lg"
              />
            </Document>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-500">
              No PDF data available
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PDFViewerModal;
