import React from 'react';
import { Button } from '@/components/ui/button';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  FileText,
  Highlighter,
  Languages,
  MessageSquare,
  Library,
} from 'lucide-react';

interface ToolbarProps {
  currentPage: number;
  totalPages: number;
  scale: number;
  onPageChange: (page: number) => void;
  onScaleChange: (scale: number) => void;
  onOpenFile: () => void;
  onToggleHighlight: () => void;
  onTranslate: () => void;
  isHighlightMode: boolean;
  onToggleChat?: () => void;
  isChatOpen?: boolean;
  onBackToLibrary?: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  currentPage,
  totalPages,
  scale,
  onPageChange,
  onScaleChange,
  onOpenFile,
  onToggleHighlight,
  onTranslate,
  isHighlightMode,
  onToggleChat,
  isChatOpen,
  onBackToLibrary,
}) => {
  const handlePageInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const page = parseInt(e.target.value);
    if (page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
  };

  const zoomIn = () => {
    onScaleChange(Math.min(scale * 1.2, 3));
  };

  const zoomOut = () => {
    onScaleChange(Math.max(scale / 1.2, 0.5));
  };

  const resetZoom = () => {
    onScaleChange(1);
  };

  return (
    <div className="h-14 border-b border-gray-200 bg-white px-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        {onBackToLibrary && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onBackToLibrary}
            title="返回文档库"
          >
            <Library className="h-4 w-4" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onOpenFile}
        >
          <FileText className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center gap-4">
        {/* Page navigation */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={currentPage}
              onChange={handlePageInput}
              className="w-16 px-2 py-1 text-center border rounded"
              min={1}
              max={totalPages}
            />
            <span className="text-sm text-gray-600">/ {totalPages}</span>
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Zoom controls */}
        <div className="flex items-center gap-2 border-l pl-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={zoomOut}
            title="缩小"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          
          <button
            onClick={resetZoom}
            className="px-3 py-1 text-sm hover:bg-gray-100 rounded min-w-[60px]"
          >
            {Math.round(scale * 100)}%
          </button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={zoomIn}
            title="放大"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant={isHighlightMode ? "default" : "ghost"}
          size="icon"
          onClick={onToggleHighlight}
        >
          <Highlighter className="h-4 w-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={onTranslate}
        >
          <Languages className="h-4 w-4" />
        </Button>
        
        {onToggleChat && (
          <Button
            variant={isChatOpen ? "default" : "ghost"}
            size="icon"
            onClick={onToggleChat}
            title="对话助手"
          >
            <MessageSquare className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};