import { create } from 'zustand';
import { db, PDFDocument } from '@/db';
import { generatePDFThumbnail } from '@/utils/pdfThumbnail';
import * as pdfjsLib from 'pdfjs-dist';

interface PDFState {
  documents: PDFDocument[];
  currentDocument: PDFDocument | null;
  isLoading: boolean;
  searchQuery: string;
  filterType: 'all' | 'local' | 'arxiv' | 'url';
  
  // Actions
  loadDocuments: () => Promise<void>;
  addDocument: (document: Omit<PDFDocument, 'id' | 'addedAt'>) => Promise<void>;
  updateDocument: (id: number, updates: Partial<PDFDocument>) => Promise<void>;
  deleteDocument: (id: number) => Promise<void>;
  setCurrentDocument: (document: PDFDocument | null) => void;
  setSearchQuery: (query: string) => void;
  setFilterType: (type: 'all' | 'local' | 'arxiv' | 'url') => void;
  getFilteredDocuments: () => PDFDocument[];
}

export const usePDFStore = create<PDFState>((set, get) => ({
  documents: [],
  currentDocument: null,
  isLoading: false,
  searchQuery: '',
  filterType: 'all',

  loadDocuments: async () => {
    set({ isLoading: true });
    try {
      const docs = await db.documents.toArray();
      set({ documents: docs, isLoading: false });
    } catch (error) {
      console.error('Failed to load documents:', error);
      set({ isLoading: false });
    }
  },

  addDocument: async (document) => {
    try {
      const newDoc: PDFDocument = {
        ...document,
        addedAt: new Date()
      };
      
      // Generate thumbnail and get page count for local files
      if (document.type === 'local' && document.fileData) {
        const thumbnail = await generatePDFThumbnail(document.fileData);
        if (thumbnail) {
          newDoc.thumbnail = thumbnail;
        }
        
        // Get page count
        try {
          const arrayBuffer = await document.fileData.arrayBuffer();
          const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
          newDoc.pages = pdf.numPages;
        } catch (err) {
          console.error('Failed to get page count:', err);
        }
      }
      
      const id = await db.documents.add(newDoc);
      const addedDoc = await db.documents.get(id);
      if (addedDoc) {
        set(state => ({ documents: [...state.documents, addedDoc] }));
      }
    } catch (error) {
      console.error('Failed to add document:', error);
    }
  },

  updateDocument: async (id, updates) => {
    try {
      await db.documents.update(id, updates);
      set(state => ({
        documents: state.documents.map(doc =>
          doc.id === id ? { ...doc, ...updates } : doc
        )
      }));
    } catch (error) {
      console.error('Failed to update document:', error);
    }
  },

  deleteDocument: async (id) => {
    try {
      await db.documents.delete(id);
      set(state => ({
        documents: state.documents.filter(doc => doc.id !== id)
      }));
    } catch (error) {
      console.error('Failed to delete document:', error);
    }
  },

  setCurrentDocument: (document) => {
    set({ currentDocument: document });
    if (document?.id) {
      get().updateDocument(document.id, { lastOpenedAt: new Date() });
    }
  },

  setSearchQuery: (query) => set({ searchQuery: query }),

  setFilterType: (type) => set({ filterType: type }),

  getFilteredDocuments: () => {
    const { documents, searchQuery, filterType } = get();
    
    let filtered = documents;
    
    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(doc => doc.type === filterType);
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(doc =>
        doc.title.toLowerCase().includes(query) ||
        doc.author?.toLowerCase().includes(query) ||
        doc.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }
    
    // Sort by last opened date (recent first) or added date
    filtered.sort((a, b) => {
      const dateA = a.lastOpenedAt || a.addedAt;
      const dateB = b.lastOpenedAt || b.addedAt;
      return dateB.getTime() - dateA.getTime();
    });
    
    return filtered;
  }
}));