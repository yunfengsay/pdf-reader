import React, { useEffect, useRef, useState } from 'react';
import { 
  Highlighter, 
  Copy, 
  MessageSquare, 
  Search
} from 'lucide-react';

interface SelectionPopupProps {
  onHighlight: (color: string) => void;
  onNote: () => void;
  onCopy: () => void;
  onSearch: () => void;
  visible: boolean;
  position: { x: number; y: number };
}

const highlightColors = [
  { name: 'Yellow', value: '#ffeb3b' },
  { name: 'Green', value: '#4caf50' },
  { name: 'Blue', value: '#2196f3' },
  { name: 'Red', value: '#f44336' },
  { name: 'Purple', value: '#9c27b0' },
];

export const SelectionPopup: React.FC<SelectionPopupProps> = ({
  onHighlight,
  onNote,
  onCopy,
  onSearch,
  visible,
  position,
}) => {
  const popupRef = useRef<HTMLDivElement>(null);
  const [showColors, setShowColors] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        setShowColors(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!visible) return null;

  const menuItems = [
    {
      icon: MessageSquare,
      title: 'Add Note',
      onClick: onNote,
    },
    {
      icon: Highlighter,
      title: 'Highlight',
      onClick: () => setShowColors(!showColors),
    },
    {
      icon: Copy,
      title: 'Copy',
      onClick: onCopy,
    },
    {
      icon: Search,
      title: 'Search',
      onClick: onSearch,
    },
  ];

  return (
    <div
      ref={popupRef}
      className="fixed z-50 bg-white rounded-lg shadow-lg border border-gray-200"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translate(-50%, -100%) translateY(-10px)',
      }}
    >
      <div className="flex items-center p-1">
        {menuItems.map((item, index) => (
          <button
            key={index}
            onClick={item.onClick}
            className="p-2 hover:bg-gray-100 rounded transition-colors duration-200"
            title={item.title}
          >
            <item.icon className="w-4 h-4 text-gray-700" />
          </button>
        ))}
      </div>
      
      {showColors && (
        <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 p-2">
          <div className="flex gap-1">
            {highlightColors.map((color) => (
              <button
                key={color.value}
                onClick={() => {
                  onHighlight(color.value);
                  setShowColors(false);
                }}
                className="w-6 h-6 rounded hover:scale-110 transition-transform duration-200"
                style={{ backgroundColor: color.value }}
                title={color.name}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};