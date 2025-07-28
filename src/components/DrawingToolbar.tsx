import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Pen,
  Square,
  Circle,
  ArrowUp,
  Minus,
  Eraser,
  Type,
  Stamp,
  Highlighter,
  Underline,
} from 'lucide-react';

export type DrawingTool = 'pen' | 'rectangle' | 'circle' | 'arrow' | 'line' | 'eraser' | 'text' | 'stamp' | 'highlight' | null;
export type HighlightStyle = 'background' | 'underline' | 'strikethrough' | 'squiggly';

interface DrawingToolbarProps {
  activeTool: DrawingTool;
  onToolChange: (tool: DrawingTool) => void;
  highlightStyle?: HighlightStyle;
  onHighlightStyleChange?: (style: HighlightStyle) => void;
  color: string;
  onColorChange: (color: string) => void;
  lineWidth: number;
  onLineWidthChange: (width: number) => void;
}

const colors = [
  '#ffeb3b', // Yellow
  '#ff5722', // Red
  '#4caf50', // Green
  '#2196f3', // Blue
  '#9c27b0', // Purple
  '#ff9800', // Orange
  '#795548', // Brown
  '#000000', // Black
];

const lineWidths = [1, 2, 3, 5, 8];

export const DrawingToolbar: React.FC<DrawingToolbarProps> = ({
  activeTool,
  onToolChange,
  highlightStyle = 'background',
  onHighlightStyleChange,
  color,
  onColorChange,
  lineWidth,
  onLineWidthChange,
}) => {
  const tools = [
    { id: 'highlight' as const, icon: Highlighter, label: 'Highlight' },
    { id: 'pen' as const, icon: Pen, label: 'Pen' },
    { id: 'rectangle' as const, icon: Square, label: 'Rectangle' },
    { id: 'circle' as const, icon: Circle, label: 'Circle' },
    { id: 'arrow' as const, icon: ArrowUp, label: 'Arrow' },
    { id: 'line' as const, icon: Minus, label: 'Line' },
    { id: 'text' as const, icon: Type, label: 'Text' },
    { id: 'stamp' as const, icon: Stamp, label: 'Stamp' },
    { id: 'eraser' as const, icon: Eraser, label: 'Eraser' },
  ];

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-white shadow-lg rounded-lg p-2 flex flex-col gap-2 z-50">
      {/* Tools */}
      <div className="flex gap-1">
        {tools.map(({ id, icon: Icon, label }) => (
          <Button
            key={id}
            variant={activeTool === id ? 'default' : 'ghost'}
            size="icon"
            onClick={() => onToolChange(activeTool === id ? null : id)}
            title={label}
          >
            <Icon className="h-4 w-4" />
          </Button>
        ))}
      </div>

      {/* Highlight styles (shown when highlight tool is active) */}
      {activeTool === 'highlight' && onHighlightStyleChange && (
        <div className="flex gap-1 border-t pt-2">
          <Button
            variant={highlightStyle === 'background' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onHighlightStyleChange('background')}
            className="text-xs"
          >
            Background
          </Button>
          <Button
            variant={highlightStyle === 'underline' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onHighlightStyleChange('underline')}
            className="text-xs"
          >
            <Underline className="h-3 w-3" />
          </Button>
          <Button
            variant={highlightStyle === 'strikethrough' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onHighlightStyleChange('strikethrough')}
            className="text-xs"
          >
            <span className="line-through">S</span>
          </Button>
          <Button
            variant={highlightStyle === 'squiggly' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onHighlightStyleChange('squiggly')}
            className="text-xs"
          >
            <span className="wavy-underline">~</span>
          </Button>
        </div>
      )}

      {/* Color picker */}
      <div className="flex gap-1 border-t pt-2">
        {colors.map((c) => (
          <button
            key={c}
            className={cn(
              'w-6 h-6 rounded-full border-2',
              color === c ? 'border-gray-800' : 'border-gray-300'
            )}
            style={{ backgroundColor: c }}
            onClick={() => onColorChange(c)}
          />
        ))}
      </div>

      {/* Line width picker (not for highlight) */}
      {activeTool && activeTool !== 'highlight' && activeTool !== 'eraser' && (
        <div className="flex gap-1 border-t pt-2">
          {lineWidths.map((width) => (
            <button
              key={width}
              className={cn(
                'w-8 h-8 rounded flex items-center justify-center',
                lineWidth === width ? 'bg-gray-200' : 'hover:bg-gray-100'
              )}
              onClick={() => onLineWidthChange(width)}
            >
              <div
                className="bg-black rounded-full"
                style={{
                  width: `${width * 2}px`,
                  height: `${width * 2}px`,
                }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Add CSS for wavy underline
const style = document.createElement('style');
style.textContent = `
  .wavy-underline {
    text-decoration: underline;
    text-decoration-style: wavy;
    text-decoration-color: currentColor;
  }
`;
document.head.appendChild(style);