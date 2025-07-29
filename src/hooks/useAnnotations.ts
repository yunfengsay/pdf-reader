import { useState, useCallback } from 'react';
import { DrawingTool, HighlightStyle } from '@/components/TopAnnotationBar';

interface Highlight {
  id: string;
  page: number;
  text: string;
  color: string;
}

export function useAnnotations() {
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [isHighlightMode, setIsHighlightMode] = useState(false);
  const [activeTool, setActiveTool] = useState<DrawingTool>(null);
  const [highlightStyle, setHighlightStyle] = useState<HighlightStyle>('background');
  const [drawingColor, setDrawingColor] = useState('#ffeb3b');
  const [lineWidth, setLineWidth] = useState(2);
  const [showAnnotationBar, setShowAnnotationBar] = useState(false);

  const handleTextSelect = useCallback((text: string, pageNum: number) => {
    if (isHighlightMode && text) {
      const newHighlight: Highlight = {
        id: Date.now().toString(),
        page: pageNum,
        text,
        color: 'rgba(255, 255, 0, 0.4)',
      };
      setHighlights(prev => [...prev, newHighlight]);
    }
  }, [isHighlightMode]);

  const toggleHighlightMode = useCallback(() => {
    setIsHighlightMode(prev => !prev);
  }, []);

  const toggleAnnotationBar = useCallback(() => {
    setShowAnnotationBar(prev => !prev);
  }, []);

  return {
    // State
    highlights,
    isHighlightMode,
    activeTool,
    highlightStyle,
    drawingColor,
    lineWidth,
    showAnnotationBar,
    
    // Actions
    setActiveTool,
    setHighlightStyle,
    setDrawingColor,
    setLineWidth,
    handleTextSelect,
    toggleHighlightMode,
    toggleAnnotationBar,
  };
}