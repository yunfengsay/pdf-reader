import React from 'react';
import { MessageSquare, Trash2 } from 'lucide-react';
import { Note } from '@/models/Note';

interface NotesListProps {
  notes: Note[];
  onNoteClick: (note: Note) => void;
  onNoteDelete: (noteKey: string) => void;
}

export const NotesList: React.FC<NotesListProps> = ({
  notes,
  onNoteClick,
  onNoteDelete,
}) => {
  if (notes.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        <MessageSquare className="w-12 h-12 mx-auto mb-2 text-gray-300" />
        <p className="text-sm">No notes yet</p>
        <p className="text-xs mt-1">Select text in the PDF to add notes</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-200">
      {notes.map((note) => (
        <div
          key={note.key}
          className="p-4 hover:bg-gray-50 cursor-pointer transition-colors duration-200"
          onClick={() => onNoteClick(note)}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                Page {note.page}
              </p>
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                {note.text}
              </p>
              {note.notes && (
                <p className="text-xs text-gray-500 mt-2 line-clamp-2 italic">
                  {note.notes}
                </p>
              )}
              <div className="flex items-center mt-2 gap-2">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: note.color }}
                />
                <span className="text-xs text-gray-400">
                  {note.date.month}/{note.date.day}/{note.date.year}
                </span>
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onNoteDelete(note.key);
              }}
              className="ml-2 p-1 hover:bg-red-100 rounded transition-colors"
            >
              <Trash2 className="w-4 h-4 text-red-500" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};