import Dexie, { Table } from 'dexie';

export interface PDFDocument {
  id?: number;
  title: string;
  author?: string;
  url?: string; // For arxiv/web PDFs
  fileData?: Blob; // For local PDFs
  type: 'local' | 'arxiv' | 'url';
  size?: number;
  pages?: number;
  thumbnail?: string;
  addedAt: Date;
  lastOpenedAt?: Date;
  tags?: string[];
  notes?: any[];
  annotations?: any[];
}

class PDFDatabase extends Dexie {
  documents!: Table<PDFDocument>;

  constructor() {
    super('PDFReaderDB');
    this.version(1).stores({
      documents: '++id, title, type, addedAt, lastOpenedAt, *tags'
    });
  }
}

export const db = new PDFDatabase();