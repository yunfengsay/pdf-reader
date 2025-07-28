import React, { useState, useCallback } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { PDFViewer } from '@/components/PDFViewer';
import { Sidebar } from '@/components/Sidebar';
import { Toolbar } from '@/components/Toolbar';
import { ChatPanel } from '@/components/ChatPanel';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';

interface Highlight {
  id: string;
  page: number;
  text: string;
  color: string;
}

function App() {
  const [pdfFile, setPdfFile] = useState<File | string | null>(null);
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [isHighlightMode, setIsHighlightMode] = useState(false);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const viewerContainerRef = React.useRef<HTMLDivElement>(null);

  const handleFileSelect = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        setPdfFile(file);
      }
    };
    input.click();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleTextSelect = useCallback((text: string, pageNum: number) => {
    if (isHighlightMode && text) {
      const newHighlight: Highlight = {
        id: Date.now().toString(),
        page: pageNum,
        text,
        color: 'rgba(255, 255, 0, 0.4)',
      };
      setHighlights(prev => [...prev, newHighlight]);
    }
  }, [isHighlightMode]);

  const handleTranslate = useCallback(() => {
    const selection = window.getSelection();
    const selectedText = selection?.toString().trim();
    if (selectedText) {
      // In a real app, this would call a translation API
      alert(`翻译: ${selectedText}`);
    } else {
      alert('请先选择要翻译的文本');
    }
  }, []);

  const handleFitToWidth = useCallback(() => {
    if (!pdfDoc || !viewerContainerRef.current) return;
    
    pdfDoc.getPage(1).then(page => {
      const viewport = page.getViewport({ scale: 1 });
      const containerWidth = viewerContainerRef.current!.offsetWidth - 64; // Subtract padding
      const newScale = containerWidth / viewport.width;
      setScale(newScale);
    });
  }, [pdfDoc]);

  const handleFitToPage = useCallback(() => {
    if (!pdfDoc || !viewerContainerRef.current) return;
    
    pdfDoc.getPage(1).then(page => {
      const viewport = page.getViewport({ scale: 1 });
      const containerWidth = viewerContainerRef.current!.offsetWidth - 64;
      const containerHeight = viewerContainerRef.current!.offsetHeight - 64;
      const widthScale = containerWidth / viewport.width;
      const heightScale = containerHeight / viewport.height;
      const newScale = Math.min(widthScale, heightScale);
      setScale(newScale);
    });
  }, [pdfDoc]);

  if (!pdfFile) {
    return (
      <div 
        className="h-screen flex items-center justify-center bg-gray-50"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <div className="text-center">
          <Upload className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-2xl font-semibold mb-2">拖拽PDF文件到这里</h2>
          <p className="text-gray-600 mb-4">或者</p>
          <Button onClick={handleFileSelect}>选择文件</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <Toolbar
        currentPage={currentPage}
        totalPages={pdfDoc?.numPages || 0}
        scale={scale}
        onPageChange={setCurrentPage}
        onScaleChange={setScale}
        onOpenFile={handleFileSelect}
        onToggleHighlight={() => setIsHighlightMode(!isHighlightMode)}
        onTranslate={handleTranslate}
        isHighlightMode={isHighlightMode}
        onFitToWidth={handleFitToWidth}
        onFitToPage={handleFitToPage}
      />

      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel defaultSize={15} minSize={10} maxSize={25}>
            <Sidebar
              pdfDoc={pdfDoc}
              currentPage={currentPage}
              onPageSelect={setCurrentPage}
            />
          </ResizablePanel>
          
          <ResizableHandle withHandle />
          
          <ResizablePanel defaultSize={55}>
            <div ref={viewerContainerRef} className="h-full">
              <PDFViewer
                file={pdfFile}
                currentPage={currentPage}
                scale={scale}
                onPageChange={setCurrentPage}
                onDocumentLoad={setPdfDoc}
                onTextSelect={handleTextSelect}
                highlights={highlights}
              />
            </div>
          </ResizablePanel>
          
          <ResizableHandle withHandle />
          
          <ResizablePanel defaultSize={30} minSize={20} maxSize={40}>
            <ChatPanel />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}

export default App;