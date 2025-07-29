import React from 'react';
import { MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FloatingChatButtonProps {
  onClick: () => void;
  isOpen: boolean;
}

export const FloatingChatButton: React.FC<FloatingChatButtonProps> = ({ onClick, isOpen }) => {
  if (isOpen) return null;
  
  return (
    <button
      onClick={onClick}
      className={cn(
        "fixed bottom-6 right-6 z-50",
        "w-14 h-14 rounded-full",
        "bg-blue-600 hover:bg-blue-700",
        "text-white shadow-lg",
        "flex items-center justify-center",
        "transition-all duration-200",
        "hover:scale-110"
      )}
      title="打开对话"
    >
      <MessageCircle className="w-6 h-6" />
    </button>
  );
};