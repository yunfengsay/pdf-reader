import React, { useEffect, useRef } from 'react';
import { 
  Copy, 
  Languages, 
  Search, 
  Highlighter,
  MessageSquare,
  Volume2,
  BookOpen,
  Share2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ContextMenuProps {
  visible: boolean;
  position: { x: number; y: number };
  selectedText: string;
  onClose: () => void;
  onTranslate: () => void;
  onCopy: () => void;
  onSearch: () => void;
  onHighlight: () => void;
  onNote: () => void;
  onSpeak: () => void;
  onLookup: () => void;
  onShare: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  visible,
  position,
  selectedText,
  onClose,
  onTranslate,
  onCopy,
  onSearch,
  onHighlight,
  onNote,
  onSpeak,
  onLookup,
  onShare,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (visible) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [visible, onClose]);

  if (!visible) return null;

  const menuItems = [
    {
      icon: Languages,
      label: '翻译',
      onClick: onTranslate,
      className: 'text-blue-600',
      divider: true,
    },
    {
      icon: Copy,
      label: '复制',
      onClick: onCopy,
    },
    {
      icon: Highlighter,
      label: '高亮',
      onClick: onHighlight,
    },
    {
      icon: MessageSquare,
      label: '添加笔记',
      onClick: onNote,
      divider: true,
    },
    {
      icon: Search,
      label: '搜索',
      onClick: onSearch,
    },
    {
      icon: BookOpen,
      label: '查词典',
      onClick: onLookup,
    },
    {
      icon: Volume2,
      label: '朗读',
      onClick: onSpeak,
    },
    {
      icon: Share2,
      label: '分享',
      onClick: onShare,
    },
  ];

  // Adjust menu position to keep it within viewport
  const adjustedPosition = { ...position };
  if (menuRef.current) {
    const rect = menuRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    if (position.x + rect.width > viewportWidth) {
      adjustedPosition.x = viewportWidth - rect.width - 10;
    }
    if (position.y + rect.height > viewportHeight) {
      adjustedPosition.y = viewportHeight - rect.height - 10;
    }
  }

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-white rounded-lg shadow-xl border border-gray-200 py-1 min-w-[180px]"
      style={{
        left: `${adjustedPosition.x}px`,
        top: `${adjustedPosition.y}px`,
      }}
    >
      {selectedText && (
        <div className="px-3 py-2 text-xs text-gray-500 border-b border-gray-100 max-w-[300px] truncate">
          "{selectedText}"
        </div>
      )}
      
      {menuItems.map((item, index) => (
        <React.Fragment key={index}>
          <button
            onClick={() => {
              item.onClick();
              onClose();
            }}
            className={cn(
              "w-full px-3 py-2 text-sm text-left hover:bg-gray-100 flex items-center gap-3 transition-colors",
              item.className
            )}
          >
            <item.icon className="w-4 h-4" />
            <span>{item.label}</span>
          </button>
          {item.divider && (
            <div className="my-1 border-t border-gray-100" />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};