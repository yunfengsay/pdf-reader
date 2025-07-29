import React, { memo } from 'react';
import { AnnotationCanvas } from './AnnotationCanvas';
import { DrawingAnnotation } from '@/models/Annotation';

interface MemoizedAnnotationCanvasProps {
  pageNum: number;
  width: number;
  height: number;
  scale: number;
  tool: 'pen' | 'rectangle' | 'circle' | 'arrow' | 'line' | null;
  color: string;
  lineWidth: number;
  onDrawingComplete: (annotation: DrawingAnnotation['data']) => void;
  existingDrawings?: DrawingAnnotation[];
}

// Memoize the component to prevent unnecessary re-renders
export const MemoizedAnnotationCanvas = memo<MemoizedAnnotationCanvasProps>(
  ({ pageNum, width, height, scale, tool, color, lineWidth, onDrawingComplete, existingDrawings = [] }) => {
    // Filter drawings for this specific page
    const pageDrawings = existingDrawings.filter(d => d.pageNumber === pageNum);
    
    return (
      <AnnotationCanvas
        pageNum={pageNum}
        width={width}
        height={height}
        scale={scale}
        tool={tool}
        color={color}
        lineWidth={lineWidth}
        onDrawingComplete={onDrawingComplete}
        existingDrawings={pageDrawings}
      />
    );
  },
  // Custom comparison function to prevent re-renders when drawings for other pages change
  (prevProps, nextProps) => {
    // Check if basic props changed
    if (
      prevProps.pageNum !== nextProps.pageNum ||
      prevProps.width !== nextProps.width ||
      prevProps.height !== nextProps.height ||
      prevProps.scale !== nextProps.scale ||
      prevProps.tool !== nextProps.tool ||
      prevProps.color !== nextProps.color ||
      prevProps.lineWidth !== nextProps.lineWidth
    ) {
      return false; // Re-render
    }

    // Check if drawings for THIS page changed
    const prevPageDrawings = (prevProps.existingDrawings || []).filter(d => d.pageNumber === prevProps.pageNum);
    const nextPageDrawings = (nextProps.existingDrawings || []).filter(d => d.pageNumber === nextProps.pageNum);

    // Compare drawings for this page
    if (prevPageDrawings.length !== nextPageDrawings.length) {
      return false; // Re-render
    }

    // Deep comparison of drawings for this page
    for (let i = 0; i < prevPageDrawings.length; i++) {
      if (prevPageDrawings[i].id !== nextPageDrawings[i].id) {
        return false; // Re-render
      }
    }

    return true; // Skip re-render
  }
);