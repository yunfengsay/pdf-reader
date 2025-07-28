import React, { useEffect, useRef, useState, useCallback } from 'react';
import ReactDOM from 'react-dom/client';
import * as pdfjsLib from 'pdfjs-dist';
import { GlobalWorkerOptions } from 'pdfjs-dist';
import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';
import { SelectionPopup } from './SelectionPopup';
import { NoteDialog } from './NoteDialog';
import { ContextMenu } from './ContextMenu';
import { TranslationPopup } from './TranslationPopup';
import { StorageService } from '@/services/StorageService';
import { TranslationService } from '@/services/TranslationService';
import { AnnotationStorageService } from '@/services/AnnotationStorageService';
import { NoteModel, Note } from '@/models/Note';
import { getSelectionInfo, SelectionInfo } from '@/utils/selectionUtils';
import { HighlightUtils } from '@/utils/highlightUtils';
import { AnnotationFactory, Annotation, HighlightAnnotation, DrawingAnnotation } from '@/models/Annotation';
import { AnnotationCanvas } from './AnnotationCanvas';
import '@/styles/pdf-text-layer.css';

// Configure PDF.js worker
GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

interface PDFViewerProps {
  file: File | string | null;
  currentPage: number;
  scale: number;
  onPageChange?: (page: number) => void;
  onDocumentLoad: (doc: PDFDocumentProxy) => void;
  onTextSelect?: (text: string, pageNum: number) => void;
  onNotesUpdate?: (notes: Note[]) => void;
  highlights?: Array<{
    page: number;
    text: string;
    color: string;
    id: string;
  }>;
  drawingTool?: 'pen' | 'rectangle' | 'circle' | 'arrow' | 'line' | null;
  drawingColor?: string;
  lineWidth?: number;
  onAnnotationsUpdate?: (annotations: Annotation[]) => void;
}

export const PDFViewer: React.FC<PDFViewerProps> = ({
  file,
  currentPage,
  scale,
  onPageChange,
  onDocumentLoad,
  onTextSelect,
  onNotesUpdate,
  highlights = [],
  drawingTool = null,
  drawingColor = '#000000',
  lineWidth = 2,
  onAnnotationsUpdate,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pages, setPages] = useState<PDFPageProxy[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [showPopup, setShowPopup] = useState(false);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  const [selectedText, setSelectedText] = useState('');
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [bookKey, setBookKey] = useState<string>('');
  const [selectionInfo, setSelectionInfo] = useState<SelectionInfo | null>(null);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [showTranslation, setShowTranslation] = useState(false);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const pageCharacterMapsRef = useRef<Map<number, Map<number, any>>>(new Map());

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
        // setPdfDoc(pdf);
        onDocumentLoad(pdf);

        // Generate book key for storage
        const key = StorageService.generateBookKey(file);
        setBookKey(key);

        // Load saved notes
        const savedNotes = await StorageService.getNotes(key);
        setNotes(savedNotes);
        onNotesUpdate?.(savedNotes);
        
        // Load saved annotations
        const savedAnnotations = await AnnotationStorageService.getAnnotations(key);
        setAnnotations(savedAnnotations);
        onAnnotationsUpdate?.(savedAnnotations);

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
      
      // Get device pixel ratio for high-quality rendering
      const devicePixelRatio = window.devicePixelRatio || 1;
      const viewport = page.getViewport({ scale: scale * devicePixelRatio });
      
      const pageDiv = document.createElement('div');
      pageDiv.className = 'pdf-page relative mb-4 bg-white shadow-md';
      pageDiv.id = `page-${pageNum}`;
      pageDiv.style.position = 'relative';
      pageDiv.style.width = `${viewport.width / devicePixelRatio}px`;
      pageDiv.style.height = `${viewport.height / devicePixelRatio}px`;
      // Set the scale factor CSS variable required by PDF.js
      pageDiv.style.setProperty('--scale-factor', scale.toString());
      
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

      // Text layer for selectable text
      const textLayerDiv = document.createElement('div');
      textLayerDiv.className = 'textLayer';
      textLayerDiv.style.width = `${viewport.width / devicePixelRatio}px`;
      textLayerDiv.style.height = `${viewport.height / devicePixelRatio}px`;
      textLayerDiv.style.position = 'absolute';
      textLayerDiv.style.left = '0';
      textLayerDiv.style.top = '0';
      textLayerDiv.style.setProperty('--scale-factor', scale.toString());

      // Create highlight layer
      const highlightLayer = document.createElement('div');
      highlightLayer.className = 'highlight-layer';
      
      // Ensure proper z-index ordering
      canvas.style.position = 'absolute';
      canvas.style.left = '0';
      canvas.style.top = '0';
      
      pageDiv.appendChild(canvas);
      pageDiv.appendChild(highlightLayer); // Add highlight layer between canvas and text
      pageDiv.appendChild(textLayerDiv);
      
      // Add annotation canvas for drawing
      const canvasWrapper = document.createElement('div');
      canvasWrapper.className = 'annotation-canvas-wrapper';
      canvasWrapper.style.position = 'absolute';
      canvasWrapper.style.top = '0';
      canvasWrapper.style.left = '0';
      canvasWrapper.style.width = '100%';
      canvasWrapper.style.height = '100%';
      canvasWrapper.style.pointerEvents = drawingTool ? 'auto' : 'none';
      canvasWrapper.dataset.pageNum = pageNum.toString();
      pageDiv.appendChild(canvasWrapper);
      
      container.appendChild(pageDiv);

      // Render PDF with high quality
      if (context) {
        await page.render({
          canvasContext: context,
          viewport: viewport,
        }).promise;
      }

      // Render text layer for selectable text
      const textContent = await page.getTextContent();
      const textLayerViewport = page.getViewport({ scale });
      
      // Clear previous content
      textLayerDiv.innerHTML = '';
      
      // Render text layer for PDF.js 3.x
      const textLayer = pdfjsLib.renderTextLayer({
        textContentSource: textContent,
        container: textLayerDiv,
        viewport: textLayerViewport,
        textDivs: [],
      });
      
      await textLayer.promise;
      
      // Get character-level positions for precise highlighting
      const characterMap = await HighlightUtils.getCharacterBoxes(page, scale);
      pageCharacterMapsRef.current.set(pageNum, characterMap);

      // Add text selection handler
      textLayerDiv.addEventListener('mouseup', (event) => {
        // 如果是右键点击，不处理选择弹窗
        if (event.button === 2) return;
        
        const info = getSelectionInfo();
        if (info) {
          setSelectedText(info.text);
          setSelectionInfo(info);
          
          // Calculate popup position (use the last rect for positioning)
          const lastRect = info.rects[info.rects.length - 1];
          if (lastRect) {
            setPopupPosition({
              x: lastRect.left + lastRect.width / 2,
              y: lastRect.top
            });
            setShowPopup(true);
          }
          
          if (onTextSelect) {
            onTextSelect(info.text, info.pageNum);
          }
        } else {
          setShowPopup(false);
          setSelectionInfo(null);
        }
      });

      // Add context menu handler
      textLayerDiv.addEventListener('contextmenu', (event) => {
        event.preventDefault();
        
        const info = getSelectionInfo();
        if (info) {
          setSelectedText(info.text);
          setSelectionInfo(info);
          setContextMenuPosition({ x: event.clientX, y: event.clientY });
          setShowContextMenu(true);
          setShowPopup(false); // Hide selection popup when showing context menu
        }
      });

      // Apply highlights from annotations - ONLY for this specific page
      const pageAnnotations = annotations.filter(ann => ann.pageNumber === pageNum);
      pageAnnotations.forEach(annotation => {
        if (annotation.type === 'highlight') {
          const highlightAnn = annotation as HighlightAnnotation;
          const characterBoxes = highlightAnn.data.boxes.map(box => ({
            ...box,
            text: ''  // Add missing text property
          }));
          const highlightElements = HighlightUtils.createHighlightElements(
            characterBoxes,
            pageDiv,
            highlightAnn.metadata.color,
            highlightAnn.data.style
          );
          
          highlightElements.forEach(element => {
            element.dataset.annotationId = annotation.id;
            element.addEventListener('click', () => {
              // TODO: Show annotation details
              console.log('Clicked annotation:', annotation);
            });
            highlightLayer.appendChild(element);
          });
        }
      });
      
      // Apply legacy highlights and notes (for backward compatibility)
      const pageNotes = notes.filter(note => note.page === pageNum);
      pageNotes.forEach(note => {
        // Check if we have multiple rects (for multi-line selections)
        let rects = [];
        try {
          rects = JSON.parse(note.range);
        } catch (e) {
          // Fallback to single rect from position
          rects = [note.position];
        }
        
        // Create highlight elements for each rect
        rects.forEach((rect: any, index: number) => {
          const highlightDiv = document.createElement('div');
          highlightDiv.className = 'absolute pointer-events-auto cursor-pointer highlight-rect';
          highlightDiv.style.left = `${rect.x}px`;
          highlightDiv.style.top = `${rect.y}px`;
          highlightDiv.style.width = `${rect.width}px`;
          highlightDiv.style.height = `${rect.height}px`;
          highlightDiv.style.backgroundColor = note.color;
          highlightDiv.style.opacity = '0.3';
          highlightDiv.dataset.noteKey = note.key;
          
          // Add rounded corners for first and last rect
          if (index === 0) {
            highlightDiv.style.borderTopLeftRadius = '2px';
            highlightDiv.style.borderBottomLeftRadius = '2px';
          }
          if (index === rects.length - 1) {
            highlightDiv.style.borderTopRightRadius = '2px';
            highlightDiv.style.borderBottomRightRadius = '2px';
          }
          
          // Add click handler to show note
          highlightDiv.addEventListener('click', () => {
            if (handleNoteClick) {
              handleNoteClick(note);
            }
          });
          
          highlightLayer.appendChild(highlightDiv);
        });
      });
      
      // Apply simple highlights from props
      const pageHighlights = highlights.filter(h => h.page === pageNum);
      pageHighlights.forEach(highlight => {
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
  }, [pages, scale, currentPage, highlights, notes, annotations, drawingTool, onTextSelect]);

  // Render annotation canvases after pages are rendered
  useEffect(() => {
    if (!containerRef.current || pages.length === 0) return;

    const canvasWrappers = containerRef.current.querySelectorAll('.annotation-canvas-wrapper');
    
    canvasWrappers.forEach((wrapper) => {
      const pageNum = parseInt(wrapper.getAttribute('data-pageNum') || '1');
      const pageElement = wrapper.parentElement;
      if (!pageElement) return;

      const rect = pageElement.getBoundingClientRect();
      
      // Clear existing content
      wrapper.innerHTML = '';
      
      const handleDrawingComplete = (drawingData: DrawingAnnotation['data']) => {
        console.log('Drawing complete:', drawingData, 'Page:', pageNum);
        const annotation = AnnotationFactory.createDrawing(
          bookKey,
          pageNum,
          drawingData.tool,
          drawingData.paths,
          drawingColor
        );
        
        console.log('Created annotation:', annotation);
        const updatedAnnotations = [...annotations, annotation];
        setAnnotations(updatedAnnotations);
        onAnnotationsUpdate?.(updatedAnnotations);
        
        // Save to storage
        AnnotationStorageService.saveAnnotations(bookKey, updatedAnnotations);
      };

      const canvasElement = document.createElement('div');
      wrapper.appendChild(canvasElement);
      
      // Render React component into the wrapper
      const root = ReactDOM.createRoot(canvasElement);
      root.render(
        <AnnotationCanvas
          pageNum={pageNum}
          width={rect.width}
          height={rect.height}
          scale={scale}
          tool={drawingTool}
          color={drawingColor}
          lineWidth={lineWidth}
          onDrawingComplete={handleDrawingComplete}
          existingDrawings={annotations.filter(a => a.type === 'drawing' && a.pageNumber === pageNum) as DrawingAnnotation[]}
        />
      );
    });
    
    // Clean up when drawingTool becomes null
    return () => {
      if (!drawingTool && containerRef.current) {
        const wrappers = containerRef.current.querySelectorAll('.annotation-canvas-wrapper');
        wrappers.forEach(wrapper => {
          wrapper.style.pointerEvents = 'none';
        });
      }
    };
  }, [pages, drawingTool, drawingColor, lineWidth, scale, bookKey, annotations, onAnnotationsUpdate]);

  // Handle highlight creation
  const handleHighlight = useCallback(async (color: string) => {
    if (!selectionInfo || !bookKey) return;
    
    const pageElement = document.getElementById(`page-${selectionInfo.pageNum}`);
    if (!pageElement) return;
    
    // Get character map for the page
    const characterMap = pageCharacterMapsRef.current.get(selectionInfo.pageNum);
    if (!characterMap) {
      // Fallback to legacy method
      const pageRect = pageElement.getBoundingClientRect();
      const rects = selectionInfo.rects.map(rect => ({
        x: rect.left - pageRect.left,
        y: rect.top - pageRect.top,
        width: rect.width,
        height: rect.height
      }));
      
      const boundingBox = {
        x: Math.min(...rects.map(r => r.x)),
        y: Math.min(...rects.map(r => r.y)),
        width: Math.max(...rects.map(r => r.x + r.width)) - Math.min(...rects.map(r => r.x)),
        height: Math.max(...rects.map(r => r.y + r.height)) - Math.min(...rects.map(r => r.y))
      };
      
      const note = new NoteModel(
        bookKey,
        selectionInfo.pageNum,
        selectionInfo.text,
        boundingBox,
        JSON.stringify(rects),
        '',
        '0',
        color,
        []
      );
      
      await StorageService.saveNote(note);
      const updatedNotes = [...notes, note];
      setNotes(updatedNotes);
      onNotesUpdate?.(updatedNotes);
    } else {
      // Use character-level highlighting
      const characterBoxes = HighlightUtils.findTextBoxes(
        characterMap,
        selectionInfo.text,
        pageElement
      );
      
      const mergedBoxes = HighlightUtils.mergeCharacterBoxes(characterBoxes);
      
      // Create new annotation
      const annotation = AnnotationFactory.createHighlight(
        bookKey,
        selectionInfo.pageNum,
        selectionInfo.text,
        mergedBoxes,
        'background',
        color
      );
      
      // Add to annotations state
      const updatedAnnotations = [...annotations, annotation];
      setAnnotations(updatedAnnotations);
      
      // Save to storage
      AnnotationStorageService.saveAnnotations(bookKey, updatedAnnotations);
      
      // Also create legacy note for backward compatibility
      const rects = mergedBoxes.map(box => ({
        x: box.x,
        y: box.y,
        width: box.width,
        height: box.height
      }));
      
      const boundingBox = {
        x: Math.min(...rects.map(r => r.x)),
        y: Math.min(...rects.map(r => r.y)),
        width: Math.max(...rects.map(r => r.x + r.width)) - Math.min(...rects.map(r => r.x)),
        height: Math.max(...rects.map(r => r.y + r.height)) - Math.min(...rects.map(r => r.y))
      };
      
      const note = new NoteModel(
        bookKey,
        selectionInfo.pageNum,
        selectionInfo.text,
        boundingBox,
        JSON.stringify(rects),
        '',
        '0',
        color,
        []
      );
      
      await StorageService.saveNote(note);
      const updatedNotes = [...notes, note];
      setNotes(updatedNotes);
      onNotesUpdate?.(updatedNotes);
    }
    
    setShowPopup(false);
    window.getSelection()?.removeAllRanges();
    setSelectionInfo(null);
  }, [selectionInfo, bookKey, notes, annotations, onNotesUpdate]);

  // Handle note creation
  const handleNote = useCallback(() => {
    setShowNoteDialog(true);
    setShowPopup(false);
  }, []);

  // Handle note save
  const handleNoteSave = useCallback(async (noteText: string) => {
    if (!selectionInfo || !bookKey) return;
    
    const pageElement = document.getElementById(`page-${selectionInfo.pageNum}`);
    if (!pageElement) return;
    
    const pageRect = pageElement.getBoundingClientRect();
    
    // Store all rects for multi-line selections
    const rects = selectionInfo.rects.map(rect => ({
      x: rect.left - pageRect.left,
      y: rect.top - pageRect.top,
      width: rect.width,
      height: rect.height
    }));
    
    // Use the bounding box of all rects for the main position
    const boundingBox = {
      x: Math.min(...rects.map(r => r.x)),
      y: Math.min(...rects.map(r => r.y)),
      width: Math.max(...rects.map(r => r.x + r.width)) - Math.min(...rects.map(r => r.x)),
      height: Math.max(...rects.map(r => r.y + r.height)) - Math.min(...rects.map(r => r.y))
    };
    
    const note = new NoteModel(
      bookKey,
      selectionInfo.pageNum,
      selectionInfo.text,
      boundingBox,
      JSON.stringify(rects), // Store all rects in range field
      noteText,
      '0',
      '#ffeb3b',
      []
    );
    
    await StorageService.saveNote(note);
    const updatedNotes = [...notes, note];
    setNotes(updatedNotes);
    onNotesUpdate?.(updatedNotes);
    window.getSelection()?.removeAllRanges();
    setSelectionInfo(null);
  }, [selectionInfo, bookKey, notes, onNotesUpdate]);

  // Handle copy
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(selectedText);
    setShowPopup(false);
    window.getSelection()?.removeAllRanges();
  }, [selectedText]);

  // Handle search
  const handleSearch = useCallback(() => {
    window.open(`https://www.google.com/search?q=${encodeURIComponent(selectedText)}`, '_blank');
    setShowPopup(false);
  }, [selectedText]);

  // Handle note click
  const handleNoteClick = useCallback((note: Note) => {
    alert(`Note: ${note.notes || 'No note text'}\n\nHighlighted text: ${note.text}`);
  }, []);

  // Context menu handlers
  const handleTranslate = useCallback(() => {
    setShowTranslation(true);
    setShowContextMenu(false);
  }, []);

  const handleLookup = useCallback(() => {
    window.open(`https://www.merriam-webster.com/dictionary/${encodeURIComponent(selectedText)}`, '_blank');
    setShowContextMenu(false);
  }, [selectedText]);

  const handleSpeak = useCallback(() => {
    TranslationService.speak(selectedText);
    setShowContextMenu(false);
  }, [selectedText]);

  const handleShare = useCallback(() => {
    if (navigator.share) {
      navigator.share({
        title: 'PDF Text',
        text: selectedText,
      });
    } else {
      navigator.clipboard.writeText(selectedText);
      alert('文本已复制到剪贴板');
    }
    setShowContextMenu(false);
  }, [selectedText]);

  const handleContextMenuHighlight = useCallback(() => {
    handleHighlight('#ffeb3b'); // Default yellow
    setShowContextMenu(false);
  }, [handleHighlight]);

  const handleContextMenuNote = useCallback(() => {
    handleNote();
    setShowContextMenu(false);
  }, [handleNote]);

  const handleContextMenuCopy = useCallback(() => {
    handleCopy();
    setShowContextMenu(false);
  }, [handleCopy]);

  const handleContextMenuSearch = useCallback(() => {
    handleSearch();
    setShowContextMenu(false);
  }, [handleSearch]);

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
    <>
      <SelectionPopup
        visible={showPopup}
        position={popupPosition}
        onHighlight={handleHighlight}
        onNote={handleNote}
        onCopy={handleCopy}
        onSearch={handleSearch}
      />
      
      <ContextMenu
        visible={showContextMenu}
        position={contextMenuPosition}
        selectedText={selectedText}
        onClose={() => setShowContextMenu(false)}
        onTranslate={handleTranslate}
        onCopy={handleContextMenuCopy}
        onSearch={handleContextMenuSearch}
        onHighlight={handleContextMenuHighlight}
        onNote={handleContextMenuNote}
        onSpeak={handleSpeak}
        onLookup={handleLookup}
        onShare={handleShare}
      />
      
      <TranslationPopup
        isOpen={showTranslation}
        onClose={() => setShowTranslation(false)}
        selectedText={selectedText}
      />
      
      <NoteDialog
        isOpen={showNoteDialog}
        onClose={() => setShowNoteDialog(false)}
        onSave={handleNoteSave}
        selectedText={selectedText}
      />
      
      <div 
        ref={containerRef}
        className="pdf-container p-8 overflow-auto h-full bg-gray-100"
        style={{ '--scale-factor': scale } as React.CSSProperties}
      >
      </div>
    </>
  );
};