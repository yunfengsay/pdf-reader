import React, { useCallback, useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TiptapNoteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (note: string) => void;
  selectedText: string;
}

export const TiptapNoteDialog: React.FC<TiptapNoteDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  selectedText,
}) => {
  const editorContainerRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
        code: false,
        bold: {
          HTMLAttributes: {
            class: 'font-semibold',
          },
        },
        italic: {
          HTMLAttributes: {
            class: 'italic',
          },
        },
      }),
      Placeholder.configure({
        placeholder: '添加笔记...',
        emptyEditorClass: 'is-editor-empty',
      }),
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[200px] p-4',
      },
    },
    onUpdate: ({ editor }) => {
      // Handle auto-completion suggestions here
      const text = editor.getText();
      if (text.endsWith(' ')) {
        // Trigger auto-completion
        handleAutoComplete(text);
      }
    },
  });

  const handleAutoComplete = useCallback((text: string) => {
    // This is where you would implement your auto-completion logic
    // For now, we'll just log it
    console.log('Auto-complete triggered for:', text);
  }, []);

  const handleSave = useCallback(() => {
    if (editor) {
      const content = editor.getHTML();
      onSave(content);
      editor.commands.clearContent();
      onClose();
    }
  }, [editor, onSave, onClose]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSave();
    }
  }, [handleSave]);

  // Focus editor when dialog opens
  useEffect(() => {
    if (isOpen && editor) {
      setTimeout(() => {
        editor.commands.focus('end');
      }, 100);
    }
  }, [isOpen, editor]);

  // Clear content when dialog closes
  useEffect(() => {
    if (!isOpen && editor) {
      editor.commands.clearContent();
    }
  }, [isOpen, editor]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div
        className="relative mx-4 w-full max-w-2xl rounded-xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">添加笔记</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Selected Text Display */}
        {selectedText && (
          <div className="mx-6 mt-4 rounded-lg bg-blue-50 p-4">
            <p className="text-sm font-medium text-blue-900 mb-1">选中的文本</p>
            <p className="text-sm text-blue-800 italic">"{selectedText}"</p>
          </div>
        )}

        {/* Editor Container */}
        <div ref={editorContainerRef} className="px-6 py-4">
          <div className="rounded-lg border border-gray-200 bg-gray-50 transition-all hover:border-gray-300 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100">
            <EditorContent editor={editor} />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t px-6 py-4">
          <div className="text-xs text-gray-500">
            <kbd className="rounded bg-gray-100 px-1.5 py-0.5 text-xs">Ctrl</kbd>
            <span className="mx-1">+</span>
            <kbd className="rounded bg-gray-100 px-1.5 py-0.5 text-xs">Enter</kbd>
            <span className="ml-2">保存</span>
          </div>
          <div className="flex gap-3">
            <Button
              variant="ghost"
              onClick={onClose}
              className="px-4 py-2"
            >
              取消
            </Button>
            <Button
              onClick={handleSave}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
            >
              保存笔记
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};