import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Note } from '@/models/Note';

interface NoteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (noteText: string) => void;
  selectedText: string;
  existingNote?: Note;
}

export const NoteDialog: React.FC<NoteDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  selectedText,
  existingNote,
}) => {
  const [noteText, setNoteText] = useState(existingNote?.notes || '');

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(noteText);
    setNoteText('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">Add Note</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Selected Text
            </label>
            <div className="p-3 bg-gray-50 rounded border border-gray-200 text-sm">
              {selectedText}
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Note
            </label>
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              rows={4}
              placeholder="Add your note here..."
              autoFocus
            />
          </div>
        </div>
        
        <div className="flex gap-2 justify-end p-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-500 text-white hover:bg-blue-600 rounded-lg transition-colors"
          >
            Save Note
          </button>
        </div>
      </div>
    </div>
  );
};