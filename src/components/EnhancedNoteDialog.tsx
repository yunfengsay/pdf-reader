import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EnhancedNoteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (note: string) => void;
  selectedText: string;
}

// Mock auto-completion function - replace with your AI service
const getAutoCompleteSuggestions = async (context: string): Promise<string> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // Mock suggestions based on context
  const suggestions = [
    "这段文字说明了",
    "重要的是要注意",
    "这个概念与",
    "总结来说，",
    "换句话说，",
    "这里的关键点是",
  ];
  
  const randomSuggestion = suggestions[Math.floor(Math.random() * suggestions.length)];
  return randomSuggestion;
};

export const EnhancedNoteDialog: React.FC<EnhancedNoteDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  selectedText,
}) => {
  const [suggestion, setSuggestion] = useState<string>('');
  const [isLoadingSuggestion, setIsLoadingSuggestion] = useState(false);
  const [showSuggestion, setShowSuggestion] = useState(false);
  const lastTextRef = useRef<string>('');
  const suggestionTimeoutRef = useRef<NodeJS.Timeout>();

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
        code: false,
      }),
      Placeholder.configure({
        placeholder: '开始输入笔记...',
        emptyEditorClass: 'is-editor-empty',
      }),
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[150px] text-gray-900',
      },
    },
    onUpdate: ({ editor }) => {
      const text = editor.getText();
      handleTextChange(text);
    },
  });

  const handleTextChange = useCallback((text: string) => {
    // Clear existing timeout
    if (suggestionTimeoutRef.current) {
      clearTimeout(suggestionTimeoutRef.current);
    }

    // Hide suggestion when typing
    setShowSuggestion(false);
    setSuggestion('');

    // Set new timeout for suggestion
    if (text.length > 10 && text !== lastTextRef.current) {
      lastTextRef.current = text;
      suggestionTimeoutRef.current = setTimeout(async () => {
        setIsLoadingSuggestion(true);
        try {
          const newSuggestion = await getAutoCompleteSuggestions(text);
          setSuggestion(newSuggestion);
          setShowSuggestion(true);
        } catch (error) {
          console.error('Failed to get suggestion:', error);
        } finally {
          setIsLoadingSuggestion(false);
        }
      }, 1000); // Wait 1 second after user stops typing
    }
  }, []);

  const acceptSuggestion = useCallback(() => {
    if (editor && suggestion) {
      const currentText = editor.getText();
      const newText = currentText + (currentText.endsWith(' ') ? '' : ' ') + suggestion;
      editor.commands.setContent(newText);
      editor.commands.focus('end');
      setSuggestion('');
      setShowSuggestion(false);
    }
  }, [editor, suggestion]);

  const handleSave = useCallback(() => {
    if (editor) {
      const content = editor.getHTML();
      onSave(content);
      editor.commands.clearContent();
      onClose();
    }
  }, [editor, onSave, onClose]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Tab' && showSuggestion && suggestion) {
      e.preventDefault();
      acceptSuggestion();
    } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      if (showSuggestion) {
        setShowSuggestion(false);
        setSuggestion('');
      } else {
        onClose();
      }
    }
  }, [showSuggestion, suggestion, acceptSuggestion, handleSave, onClose]);

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
      setSuggestion('');
      setShowSuggestion(false);
      lastTextRef.current = '';
    }
  }, [isOpen, editor]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (suggestionTimeoutRef.current) {
        clearTimeout(suggestionTimeoutRef.current);
      }
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative mx-4 w-full max-w-xl bg-white rounded-2xl shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-medium text-gray-900">添加笔记</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 hover:bg-gray-100 transition-colors"
          >
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </div>

        {/* Selected Text */}
        {selectedText && (
          <div className="mx-6 mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
            <p className="text-xs font-medium text-amber-800 mb-1">选中文本</p>
            <p className="text-sm text-amber-900 line-clamp-3">"{selectedText}"</p>
          </div>
        )}

        {/* Editor */}
        <div className="px-6 py-4">
          <div className="relative">
            <div className={cn(
              "rounded-lg border bg-white p-4 transition-all",
              "hover:border-gray-300 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100",
              showSuggestion ? "border-blue-300" : "border-gray-200"
            )}>
              <EditorContent editor={editor} />
              
              {/* Auto-complete suggestion */}
              {(showSuggestion || isLoadingSuggestion) && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  {isLoadingSuggestion ? (
                    <div className="flex items-center gap-2 text-gray-400">
                      <Sparkles className="h-4 w-4 animate-pulse" />
                      <span className="text-sm">思考中...</span>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2">
                      <Sparkles className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-600 leading-relaxed">
                          {suggestion}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          按 <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">Tab</kbd> 接受建议
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t border-gray-100">
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white rounded border border-gray-200 text-xs">⌘</kbd>
              <kbd className="px-1.5 py-0.5 bg-white rounded border border-gray-200 text-xs">Enter</kbd>
              <span className="ml-1">保存</span>
            </span>
            <span className="text-gray-300">•</span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white rounded border border-gray-200 text-xs">Esc</kbd>
              <span className="ml-1">关闭</span>
            </span>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={onClose}
              className="text-gray-600 hover:text-gray-900"
            >
              取消
            </Button>
            <Button
              onClick={handleSave}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              保存笔记
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};