import React, { useState, useCallback, useRef } from 'react';
import { PDFViewer } from '@/components/PDFViewer';
import { Sidebar } from '@/components/Sidebar';
import { Toolbar } from '@/components/Toolbar';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import { TopAnnotationBar } from '@/components/TopAnnotationBar';
import { ChatPanel, ChatPanelRef } from '@/components/ChatPanel';
import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels';
import { usePdfViewer } from '@/hooks/usePdfViewer';
import { useAnnotations } from '@/hooks/useAnnotations';

function App() {
  const {
    pdfFile,
    pdfDoc,
    currentPage,
    scale,
    notes,
    pdfText,
    viewerContainerRef,
    setPdfDoc,
    setCurrentPage,
    setScale,
    setNotes,
    handleFileSelect,
    handleDrop,
    handleDragOver,
    handleFitToWidth,
    handleFitToPage,
    handleNoteClick,
    handleNoteDelete,
  } = usePdfViewer();

  const {
    highlights,
    isHighlightMode,
    activeTool,
    highlightStyle,
    drawingColor,
    lineWidth,
    showAnnotationBar,
    setActiveTool,
    setHighlightStyle,
    setDrawingColor,
    setLineWidth,
    handleTextSelect,
    toggleHighlightMode,
    toggleAnnotationBar,
  } = useAnnotations();

  const [showChatPanel, setShowChatPanel] = useState(true);
  const [selectedTextForAsk, setSelectedTextForAsk] = useState('');
  const chatPanelRef = useRef<ChatPanelRef>(null);

  const handleTranslate = useCallback(() => {
    const selection = window.getSelection();
    const selectedText = selection?.toString().trim();
    if (selectedText) {
      console.log('Translate:', selectedText);
    }
  }, []);

  const handleAsk = useCallback(() => {
    if (selectedTextForAsk && chatPanelRef.current) {
      chatPanelRef.current.addPromptText(`关于这段文本: "${selectedTextForAsk}"`);
    }
  }, [selectedTextForAsk]);

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
    <div className="h-screen flex flex-col overflow-hidden">
      <Toolbar
        currentPage={currentPage}
        totalPages={pdfDoc?.numPages || 0}
        scale={scale}
        onPageChange={setCurrentPage}
        onScaleChange={setScale}
        onOpenFile={handleFileSelect}
        onToggleHighlight={toggleHighlightMode}
        onTranslate={handleTranslate}
        isHighlightMode={isHighlightMode}
        onFitToWidth={handleFitToWidth}
        onFitToPage={handleFitToPage}
        onToggleChat={() => setShowChatPanel(!showChatPanel)}
        isChatOpen={showChatPanel}
      />

      <div className="flex-1 flex overflow-hidden">
        <div className="w-64 border-r border-gray-200 overflow-y-auto">
          <Sidebar
            pdfDoc={pdfDoc}
            currentPage={currentPage}
            onPageSelect={setCurrentPage}
            notes={notes}
            onNoteClick={handleNoteClick}
            onNoteDelete={handleNoteDelete}
          />
        </div>
        
        {showChatPanel ? (
          <PanelGroup direction="horizontal" className="flex-1">
            <Panel defaultSize={65} minSize={30}>
              <div ref={viewerContainerRef} className="h-full overflow-auto">
                <PDFViewer
                  key={`pdf-viewer-${showChatPanel}`}
                  file={pdfFile}
                  currentPage={currentPage}
                  scale={scale}
                  onPageChange={setCurrentPage}
                  onDocumentLoad={setPdfDoc}
                  onTextSelect={handleTextSelect}
                  onNotesUpdate={setNotes}
                  highlights={highlights}
                  drawingTool={
                    ['highlight', 'text', 'stamp', 'eraser'].includes(activeTool || '') 
                      ? null 
                      : activeTool
                  }
                  drawingColor={drawingColor}
                  lineWidth={lineWidth}
                  onAnnotationsUpdate={(annotations) => {
                    console.log('Annotations updated:', annotations);
                  }}
                  onSelectedTextChange={setSelectedTextForAsk}
                  onAsk={handleAsk}
                />
              </div>
            </Panel>
            <PanelResizeHandle className="w-1 bg-gray-200 hover:bg-gray-300 transition-colors" />
            <Panel defaultSize={35} minSize={20} maxSize={50}>
              <ChatPanel
                ref={chatPanelRef}
                onClose={() => setShowChatPanel(false)}
                className="h-full"
                pdfContent={pdfText}
                fileName={typeof pdfFile === 'string' ? pdfFile : pdfFile?.name}
                pdfKey={pdfFile ? (typeof pdfFile === 'string' ? pdfFile : pdfFile.name) : undefined}
              />
            </Panel>
          </PanelGroup>
        ) : (
          <div ref={viewerContainerRef} className="flex-1 overflow-auto">
            <PDFViewer
              key={`pdf-viewer-${showChatPanel}`}
              file={pdfFile}
              currentPage={currentPage}
              scale={scale}
              onPageChange={setCurrentPage}
              onDocumentLoad={setPdfDoc}
              onTextSelect={handleTextSelect}
              onNotesUpdate={setNotes}
              highlights={highlights}
              drawingTool={
                ['highlight', 'text', 'stamp', 'eraser'].includes(activeTool || '') 
                  ? null 
                  : activeTool
              }
              drawingColor={drawingColor}
              lineWidth={lineWidth}
              onAnnotationsUpdate={(annotations) => {
                console.log('Annotations updated:', annotations);
              }}
              onSelectedTextChange={setSelectedTextForAsk}
              onAsk={handleAsk}
            />
          </div>
        )}
      </div>
      
      {pdfDoc && (
        <TopAnnotationBar
          activeTool={activeTool}
          onToolChange={setActiveTool}
          highlightStyle={highlightStyle}
          onHighlightStyleChange={setHighlightStyle}
          color={drawingColor}
          onColorChange={setDrawingColor}
          lineWidth={lineWidth}
          onLineWidthChange={setLineWidth}
          isOpen={showAnnotationBar}
          onToggle={toggleAnnotationBar}
        />
      )}
    </div>
  );
}

export default App;