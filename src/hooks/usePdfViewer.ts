import { useState, useCallback, useEffect, useRef } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { StorageService } from '@/services/StorageService';
import { Note } from '@/models/Note';
import { extractFullTextFromPDF, truncateText } from '@/utils/pdfTextExtractor';

export function usePdfViewer() {
  const [pdfFile, setPdfFile] = useState<File | string | null>(null);
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1);
  const [notes, setNotes] = useState<Note[]>([]);
  const [hasAutoFitted, setHasAutoFitted] = useState(false);
  const [pdfText, setPdfText] = useState<string>('');
  const viewerContainerRef = useRef<HTMLDivElement>(null);

  // Load notes when file changes
  useEffect(() => {
    if (pdfFile) {
      const key = StorageService.generateBookKey(pdfFile);
      StorageService.getNotes(key).then(setNotes);
      setHasAutoFitted(false);
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

  const handleFitToWidth = useCallback(() => {
    if (!pdfDoc || !viewerContainerRef.current) return;
    
    pdfDoc.getPage(1).then(page => {
      const viewport = page.getViewport({ scale: 1 });
      const containerWidth = viewerContainerRef.current!.offsetWidth - 64;
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

  // Auto fit to page when PDF loads and extract text
  useEffect(() => {
    if (pdfDoc && viewerContainerRef.current && !hasAutoFitted) {
      setTimeout(() => {
        handleFitToPage();
        setHasAutoFitted(true);
      }, 100);
    }
    
    // Extract text from PDF
    if (pdfDoc) {
      extractFullTextFromPDF(pdfDoc).then(text => {
        setPdfText(truncateText(text, 100000)); // Limit to 100k characters
      }).catch(err => {
        console.error('Failed to extract PDF text:', err);
        setPdfText('');
      });
    }
  }, [pdfDoc, hasAutoFitted, handleFitToPage]);

  const handleNoteClick = useCallback((note: Note) => {
    setCurrentPage(note.page);
  }, []);

  const handleNoteDelete = useCallback(async (noteKey: string) => {
    await StorageService.deleteNote(noteKey);
    const updatedNotes = notes.filter(n => n.key !== noteKey);
    setNotes(updatedNotes);
  }, [notes]);

  return {
    // State
    pdfFile,
    pdfDoc,
    currentPage,
    scale,
    notes,
    pdfText,
    viewerContainerRef,
    
    // Actions
    setPdfFile,
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
  };
}