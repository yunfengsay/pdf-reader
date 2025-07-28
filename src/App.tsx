import React, { useState, useCallback, useEffect } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { PDFViewer } from '@/components/PDFViewer';
import { Sidebar } from '@/components/Sidebar';
import { Toolbar } from '@/components/Toolbar';
import { ChatPanel } from '@/components/ChatPanel';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import { Note } from '@/models/Note';
import { StorageService } from '@/services/StorageService';
import { DrawingToolbar, DrawingTool, HighlightStyle } from '@/components/DrawingToolbar';

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
  const [notes, setNotes] = useState<Note[]>([]);
  // const [bookKey, setBookKey] = useState<string>('');
  const [activeTool, setActiveTool] = useState<DrawingTool>(null);
  const [highlightStyle, setHighlightStyle] = useState<HighlightStyle>('background');
  const [drawingColor, setDrawingColor] = useState('#ffeb3b');
  const [lineWidth, setLineWidth] = useState(2);
  const viewerContainerRef = React.useRef<HTMLDivElement>(null);

  // Load notes when file changes
  useEffect(() => {
    if (pdfFile) {
      const key = StorageService.generateBookKey(pdfFile);
      // setBookKey(key);
      StorageService.getNotes(key).then(setNotes);
    }
  }, [pdfFile]);

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

  const handleNoteClick = useCallback((note: Note) => {
    setCurrentPage(note.page);
    // The PDFViewer will handle highlighting the note
  }, []);

  const handleNoteDelete = useCallback(async (noteKey: string) => {
    await StorageService.deleteNote(noteKey);
    const updatedNotes = notes.filter(n => n.key !== noteKey);
    setNotes(updatedNotes);
  }, [notes]);

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
              notes={notes}
              onNoteClick={handleNoteClick}
              onNoteDelete={handleNoteDelete}
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
                onNotesUpdate={setNotes}
                highlights={highlights}
                drawingTool={
                  activeTool === 'highlight' || 
                  activeTool === 'text' || 
                  activeTool === 'stamp' || 
                  activeTool === 'eraser' 
                    ? null 
                    : activeTool
                }
                drawingColor={drawingColor}
                lineWidth={lineWidth}
                onAnnotationsUpdate={(annotations) => {
                  // Store annotations if needed
                  console.log('Annotations updated:', annotations);
                }}
              />
            </div>
          </ResizablePanel>
          
          <ResizableHandle withHandle />
          
          <ResizablePanel defaultSize={30} minSize={20} maxSize={40}>
            <ChatPanel />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
      
      {/* Drawing Toolbar */}
      {pdfDoc && (
        <DrawingToolbar
          activeTool={activeTool}
          onToolChange={setActiveTool}
          highlightStyle={highlightStyle}
          onHighlightStyleChange={setHighlightStyle}
          color={drawingColor}
          onColorChange={setDrawingColor}
          lineWidth={lineWidth}
          onLineWidthChange={setLineWidth}
        />
      )}
    </div>
  );
}

export default App;