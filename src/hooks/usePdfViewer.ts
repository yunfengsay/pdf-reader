import { useState, useCallback, useEffect, useRef } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { StorageService } from '@/services/StorageService';
import { Note } from '@/models/Note';
import { extractFullTextFromPDF, truncateText } from '@/utils/pdfTextExtractor';

export function usePdfViewer() {
  const [pdfFile, setPdfFile] = useState<File | string | Blob | null>(null);
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1);
  const [notes, setNotes] = useState<Note[]>([]);
  const [pdfText, setPdfText] = useState<string>('');
  const viewerContainerRef = useRef<HTMLDivElement>(null);

  // Load notes when file changes
  useEffect(() => {
    if (pdfFile) {
      const key = StorageService.generateBookKey(pdfFile);
      StorageService.getNotes(key).then(setNotes);
    }
  }, [pdfFile]);

  const handleFileSelect = useCallback((fileOrUrl?: string | File | Blob) => {
    if (fileOrUrl) {
      setPdfFile(fileOrUrl);
    } else {
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
    }
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


  // Auto fit to screen width when PDF loads and extract text
  useEffect(() => {
    if (pdfDoc && viewerContainerRef.current) {
      const fitToScreen = () => {
        if (!viewerContainerRef.current) return;
        
        pdfDoc.getPage(1).then(page => {
          const viewport = page.getViewport({ scale: 1 });
          const containerWidth = viewerContainerRef.current!.offsetWidth - 40; // Small padding
          const newScale = containerWidth / viewport.width;
          setScale(newScale);
        });
      };
      
      // Initial fit
      fitToScreen();
      
      // Handle window resize
      const handleResize = () => {
        fitToScreen();
      };
      
      window.addEventListener('resize', handleResize);
      
      // Extract text
      extractFullTextFromPDF(pdfDoc).then(text => {
        setPdfText(truncateText(text, 100000)); // Limit to 100k characters
      }).catch(err => {
        console.error('Failed to extract PDF text:', err);
        setPdfText('');
      });
      
      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [pdfDoc]);

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
    handleNoteClick,
    handleNoteDelete,
  };
}