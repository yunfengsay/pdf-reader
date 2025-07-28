import { Note } from '../models/Note';

export class StorageService {
  private static readonly NOTES_KEY = 'pdf-reader-notes';
  // private static readonly BOOKMARKS_KEY = 'pdf-reader-bookmarks';

  static async saveNote(note: Note): Promise<void> {
    const notes = await this.getNotes();
    // 确保不重复添加相同的注释
    const existingIndex = notes.findIndex(n => n.key === note.key);
    if (existingIndex >= 0) {
      notes[existingIndex] = note;
    } else {
      notes.push(note);
    }
    localStorage.setItem(this.NOTES_KEY, JSON.stringify(notes));
  }

  static async updateNote(noteKey: string, updatedNote: Partial<Note>): Promise<void> {
    const notes = await this.getNotes();
    const index = notes.findIndex(n => n.key === noteKey);
    if (index !== -1) {
      notes[index] = { ...notes[index], ...updatedNote };
      localStorage.setItem(this.NOTES_KEY, JSON.stringify(notes));
    }
  }

  static async deleteNote(noteKey: string): Promise<void> {
    const notes = await this.getNotes();
    const filteredNotes = notes.filter(n => n.key !== noteKey);
    localStorage.setItem(this.NOTES_KEY, JSON.stringify(filteredNotes));
  }

  static async getNotes(bookKey?: string): Promise<Note[]> {
    const notesJson = localStorage.getItem(this.NOTES_KEY);
    const notes = notesJson ? JSON.parse(notesJson) : [];
    
    if (bookKey) {
      return notes.filter((note: Note) => note.bookKey === bookKey);
    }
    
    return notes;
  }

  static async getNotesByPage(bookKey: string, page: number): Promise<Note[]> {
    const notes = await this.getNotes(bookKey);
    return notes.filter(note => note.page === page);
  }

  static generateBookKey(file: File | string): string {
    if (typeof file === 'string') {
      return btoa(file).substring(0, 20);
    }
    return `${file.name}-${file.size}-${file.lastModified}`;
  }
}