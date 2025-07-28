import React, { useEffect, useState } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { cn } from '@/lib/utils';

interface SidebarProps {
  pdfDoc: PDFDocumentProxy | null;
  currentPage: number;
  onPageSelect: (page: number) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  pdfDoc,
  currentPage,
  onPageSelect,
}) => {
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!pdfDoc) return;

    const generateThumbnails = async () => {
      setLoading(true);
      const thumbs: string[] = [];

      for (let i = 1; i <= pdfDoc.numPages; i++) {
        const page = await pdfDoc.getPage(i);
        const viewport = page.getViewport({ scale: 0.3 });
        
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        if (context) {
          await page.render({
            canvasContext: context,
            viewport: viewport,
          }).promise;

          thumbs.push(canvas.toDataURL());
        }
      }

      setThumbnails(thumbs);
      setLoading(false);
    };

    generateThumbnails();
  }, [pdfDoc]);

  return (
    <div className="w-64 bg-gray-50 border-r border-gray-200 overflow-y-auto">
      <div className="p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">页面</h3>
        
        {loading && (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        )}

        <div className="space-y-3">
          {thumbnails.map((thumb, index) => {
            const pageNum = index + 1;
            const isActive = pageNum === currentPage;

            return (
              <div
                key={pageNum}
                className={cn(
                  "cursor-pointer rounded-lg overflow-hidden transition-all",
                  "hover:ring-2 hover:ring-primary",
                  isActive && "ring-2 ring-primary"
                )}
                onClick={() => onPageSelect(pageNum)}
              >
                <img
                  src={thumb}
                  alt={`Page ${pageNum}`}
                  className="w-full"
                />
                <div className={cn(
                  "text-center py-2 text-sm",
                  isActive ? "bg-primary text-white" : "bg-gray-100 text-gray-700"
                )}>
                  {pageNum}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};