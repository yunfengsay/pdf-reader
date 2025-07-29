import React from 'react';
import { 
  Highlighter, 
  Pen, 
  Square, 
  Circle, 
  ArrowRight,
  Type,
  Stamp,
  Eraser,
  Minus,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type DrawingTool = 'highlight' | 'pen' | 'rectangle' | 'circle' | 'arrow' | 'line' | 'text' | 'stamp' | 'eraser' | null;
export type HighlightStyle = 'background' | 'underline' | 'strikethrough' | 'squiggly';

interface TopAnnotationBarProps {
  activeTool: DrawingTool;
  onToolChange: (tool: DrawingTool) => void;
  highlightStyle?: HighlightStyle;
  onHighlightStyleChange?: (style: HighlightStyle) => void;
  color: string;
  onColorChange: (color: string) => void;
  lineWidth?: number;
  onLineWidthChange?: (width: number) => void;
  isOpen: boolean;
  onToggle: () => void;
}

const tools = [
  { id: 'highlight' as DrawingTool, icon: Highlighter, label: '高亮' },
  { id: 'pen' as DrawingTool, icon: Pen, label: '画笔' },
  { id: 'rectangle' as DrawingTool, icon: Square, label: '矩形' },
  { id: 'circle' as DrawingTool, icon: Circle, label: '圆形' },
  { id: 'arrow' as DrawingTool, icon: ArrowRight, label: '箭头' },
  { id: 'line' as DrawingTool, icon: Minus, label: '直线' },
  { id: 'text' as DrawingTool, icon: Type, label: '文本' },
  { id: 'stamp' as DrawingTool, icon: Stamp, label: '印章' },
  { id: 'eraser' as DrawingTool, icon: Eraser, label: '橡皮擦' },
];

const colors = [
  { name: '黄色', value: '#ffeb3b' },
  { name: '绿色', value: '#4caf50' },
  { name: '蓝色', value: '#2196f3' },
  { name: '红色', value: '#f44336' },
  { name: '紫色', value: '#9c27b0' },
  { name: '橙色', value: '#ff9800' },
  { name: '粉色', value: '#e91e63' },
  { name: '青色', value: '#00bcd4' },
  { name: '棕色', value: '#795548' },
  { name: '黑色', value: '#000000' },
];

const highlightStyles = [
  { id: 'background' as HighlightStyle, label: '背景', icon: '▬' },
  { id: 'underline' as HighlightStyle, label: '下划线', icon: '▂' },
  { id: 'strikethrough' as HighlightStyle, label: '删除线', icon: '▬' },
  { id: 'squiggly' as HighlightStyle, label: '波浪线', icon: '∼' },
];

export const TopAnnotationBar: React.FC<TopAnnotationBarProps> = ({
  activeTool,
  onToolChange,
  highlightStyle = 'background',
  onHighlightStyleChange,
  color,
  onColorChange,
  lineWidth = 2,
  onLineWidthChange,
  isOpen,
  onToggle,
}) => {
  if (!isOpen) {
    return (
      <div className="fixed top-16 left-1/2 transform -translate-x-1/2 z-40">
        <button
          onClick={onToggle}
          className="bg-white rounded-full px-4 py-2 shadow-lg hover:shadow-xl transition-shadow flex items-center gap-2"
        >
          <Highlighter className="w-4 h-4" />
          <span className="text-sm">标注工具</span>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed top-16 left-1/2 transform -translate-x-1/2 z-40 bg-white rounded-2xl shadow-xl p-3 flex items-center gap-4">
      {/* Tools */}
      <div className="flex items-center gap-1">
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <button
              key={tool.id}
              onClick={() => onToolChange(tool.id === activeTool ? null : tool.id)}
              className={cn(
                "p-2 rounded-lg transition-all hover:bg-gray-100",
                activeTool === tool.id && "bg-blue-100 text-blue-600"
              )}
              title={tool.label}
            >
              <Icon className="w-4 h-4" />
            </button>
          );
        })}
      </div>

      {/* Divider */}
      <div className="w-px h-8 bg-gray-200" />

      {/* Highlight Styles (only show when highlight tool is active) */}
      {activeTool === 'highlight' && (
        <>
          <div className="flex items-center gap-1">
            {highlightStyles.map((style) => (
              <button
                key={style.id}
                onClick={() => onHighlightStyleChange?.(style.id)}
                className={cn(
                  "px-3 py-1 rounded text-sm transition-all hover:bg-gray-100",
                  highlightStyle === style.id && "bg-blue-100 text-blue-600"
                )}
                title={style.label}
              >
                {style.icon}
              </button>
            ))}
          </div>
          <div className="w-px h-8 bg-gray-200" />
        </>
      )}

      {/* Color Picker */}
      <div className="flex items-center gap-1">
        {colors.map((c) => (
          <button
            key={c.value}
            onClick={() => onColorChange(c.value)}
            className={cn(
              "w-6 h-6 rounded-full transition-all hover:scale-110",
              color === c.value && "ring-2 ring-offset-2 ring-blue-500"
            )}
            style={{ backgroundColor: c.value }}
            title={c.name}
          />
        ))}
      </div>

      {/* Line Width (for drawing tools) */}
      {activeTool && ['pen', 'rectangle', 'circle', 'arrow', 'line'].includes(activeTool) && (
        <>
          <div className="w-px h-8 bg-gray-200" />
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600">线宽:</span>
            <input
              type="range"
              min="1"
              max="10"
              value={lineWidth}
              onChange={(e) => onLineWidthChange?.(Number(e.target.value))}
              className="w-20 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-xs text-gray-600 w-4">{lineWidth}</span>
          </div>
        </>
      )}

      {/* Close Button */}
      <button
        onClick={onToggle}
        className="ml-2 p-1 hover:bg-gray-100 rounded-lg transition-colors"
        title="关闭"
      >
        <X className="w-4 h-4 text-gray-500" />
      </button>
    </div>
  );
};