import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { GlobalWorkerOptions } from 'pdfjs-dist';
import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';
import { cn } from '@/lib/utils';

// Configure PDF.js worker
GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

interface PDFViewerProps {
  file: File | string | null;
  currentPage: number;
  scale: number;
  onPageChange: (page: number) => void;
  onDocumentLoad: (doc: PDFDocumentProxy) => void;
  onTextSelect?: (text: string, pageNum: number) => void;
  highlights?: Array<{
    page: number;
    text: string;
    color: string;
    id: string;
  }>;
}

export const PDFViewer: React.FC<PDFViewerProps> = ({
  file,
  currentPage,
  scale,
  onPageChange,
  onDocumentLoad,
  onTextSelect,
  highlights = [],
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [pages, setPages] = useState<PDFPageProxy[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load PDF document
  useEffect(() => {
    if (!file) return;

    const loadPDF = async () => {
      setLoading(true);
      setError(null);

      try {
        let url: string;
        if (typeof file === 'string') {
          url = file;
        } else {
          url = URL.createObjectURL(file);
        }

        const loadingTask = pdfjsLib.getDocument(url);
        const pdf = await loadingTask.promise;
        setPdfDoc(pdf);
        onDocumentLoad(pdf);

        // Load all pages
        const pagePromises: Promise<PDFPageProxy>[] = [];
        for (let i = 1; i <= pdf.numPages; i++) {
          pagePromises.push(pdf.getPage(i));
        }
        const loadedPages = await Promise.all(pagePromises);
        setPages(loadedPages);

        // Clean up object URL
        if (typeof file !== 'string') {
          URL.revokeObjectURL(url);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load PDF');
      } finally {
        setLoading(false);
      }
    };

    loadPDF();
  }, [file, onDocumentLoad]);

  // Render pages
  useEffect(() => {
    if (!containerRef.current || pages.length === 0) return;

    const container = containerRef.current;
    container.innerHTML = '';

    pages.forEach(async (page, index) => {
      const pageNum = index + 1;
      const pageDiv = document.createElement('div');
      pageDiv.className = 'pdf-page relative mb-4 bg-white shadow-md';
      pageDiv.id = `page-${pageNum}`;
      
      // Get device pixel ratio for high-quality rendering
      const devicePixelRatio = window.devicePixelRatio || 1;
      const viewport = page.getViewport({ scale: scale * devicePixelRatio });
      
      // Canvas for PDF rendering
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      // Set actual size based on device pixel ratio
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      // Set display size (CSS pixels)
      canvas.style.width = `${viewport.width / devicePixelRatio}px`;
      canvas.style.height = `${viewport.height / devicePixelRatio}px`;
      canvas.className = 'block';

      // Text layer
      const textLayerDiv = document.createElement('div');
      textLayerDiv.className = 'textLayer';
      textLayerDiv.style.width = `${viewport.width / devicePixelRatio}px`;
      textLayerDiv.style.height = `${viewport.height / devicePixelRatio}px`;

      pageDiv.appendChild(canvas);
      pageDiv.appendChild(textLayerDiv);
      container.appendChild(pageDiv);

      // Render PDF with high quality
      if (context) {
        await page.render({
          canvasContext: context,
          viewport: viewport,
          // Enable high quality rendering
          renderInteractiveForms: true,
        }).promise;
      }

      // Render text layer
      const textContent = await page.getTextContent();
      const textLayerViewport = page.getViewport({ scale });
      pdfjsLib.renderTextLayer({
        textContent,
        container: textLayerDiv,
        viewport: textLayerViewport,
        textDivs: [],
      });

      // Add text selection handler
      textLayerDiv.addEventListener('mouseup', () => {
        const selection = window.getSelection();
        const selectedText = selection?.toString().trim();
        if (selectedText && onTextSelect) {
          onTextSelect(selectedText, pageNum);
        }
      });

      // Apply highlights
      const pageHighlights = highlights.filter(h => h.page === pageNum);
      pageHighlights.forEach(highlight => {
        // This is a simplified highlight implementation
        // In production, you'd want more sophisticated text matching
        const textDivs = textLayerDiv.querySelectorAll('span');
        textDivs.forEach(span => {
          if (span.textContent?.includes(highlight.text)) {
            span.style.backgroundColor = highlight.color;
            span.style.opacity = '0.4';
          }
        });
      });
    });

    // Scroll to current page
    const targetPage = document.getElementById(`page-${currentPage}`);
    if (targetPage) {
      targetPage.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [pages, scale, currentPage, highlights, onTextSelect]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  if (!file) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">No PDF loaded</div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="pdf-container p-8 overflow-auto h-full bg-gray-100"
    >
      <style jsx>{`
        .textLayer {
          position: absolute;
          text-align: initial;
          left: 0;
          top: 0;
          right: 0;
          bottom: 0;
          overflow: hidden;
          line-height: 1;
          text-size-adjust: none;
          forced-color-adjust: none;
          transform-origin: 0 0;
          z-index: 2;
        }
        
        .textLayer :is(span, br) {
          color: transparent;
          position: absolute;
          white-space: pre;
          cursor: text;
          transform-origin: 0% 0%;
        }
        
        .textLayer span.markedContent {
          top: 0;
          height: 0;
        }
        
        .textLayer .highlight {
          margin: -1px;
          padding: 1px;
          background-color: rgba(180, 0, 170, 0.2);
          border-radius: 4px;
        }
        
        .textLayer .highlight.appended {
          position: initial;
        }
        
        .textLayer .highlight.begin {
          border-radius: 4px 0 0 4px;
        }
        
        .textLayer .highlight.end {
          border-radius: 0 4px 4px 0;
        }
        
        .textLayer .highlight.middle {
          border-radius: 0;
        }
        
        .textLayer .highlight.selected {
          background-color: rgba(0, 100, 0, 0.2);
        }
        
        .textLayer ::-moz-selection {
          background: rgba(0, 0, 255, 0.3);
        }
        
        .textLayer ::selection {
          background: rgba(0, 0, 255, 0.3);
        }
        
        .textLayer br::-moz-selection {
          background: transparent;
        }
        
        .textLayer br::selection {
          background: transparent;
        }
        
        .textLayer .endOfContent {
          display: block;
          position: absolute;
          left: 0;
          top: 100%;
          right: 0;
          bottom: 0;
          z-index: -1;
          cursor: default;
          user-select: none;
        }
        
        .textLayer .endOfContent.active {
          top: 0;
        }
      `}</style>
    </div>
  );
};