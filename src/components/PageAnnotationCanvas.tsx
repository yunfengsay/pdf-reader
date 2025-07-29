import React, { useState, useEffect, useCallback, memo } from 'react';
import { AnnotationCanvas } from './AnnotationCanvas';
import { DrawingAnnotation } from '@/models/Annotation';
import { AnnotationFactory } from '@/models/Annotation';
import { AnnotationStorageService } from '@/services/AnnotationStorageService';

interface PageAnnotationCanvasProps {
  pageNum: number;
  width: number;
  height: number;
  scale: number;
  tool: 'pen' | 'rectangle' | 'circle' | 'arrow' | 'line' | null;
  color: string;
  lineWidth: number;
  bookKey: string;
  onAnnotationAdded?: () => void;
}

export const PageAnnotationCanvas = memo<PageAnnotationCanvasProps>(({
  pageNum,
  width,
  height,
  scale,
  tool,
  color,
  lineWidth,
  bookKey,
  onAnnotationAdded,
}) => {
  const [pageAnnotations, setPageAnnotations] = useState<DrawingAnnotation[]>([]);

  // Load annotations for this page
  useEffect(() => {
    const loadAnnotations = async () => {
      const allAnnotations = await AnnotationStorageService.getAnnotations(bookKey);
      const pageDrawings = allAnnotations.filter(
        a => a.type === 'drawing' && a.pageNumber === pageNum
      ) as DrawingAnnotation[];
      setPageAnnotations(pageDrawings);
    };
    loadAnnotations();
  }, [bookKey, pageNum]);

  const handleDrawingComplete = useCallback(async (drawingData: DrawingAnnotation['data']) => {
    console.log(`Drawing complete on page ${pageNum}:`, drawingData);
    
    const annotation = AnnotationFactory.createDrawing(
      bookKey,
      pageNum,
      drawingData.tool,
      drawingData.paths,
      color
    );
    
    // Add to storage
    await AnnotationStorageService.addAnnotation(bookKey, annotation);
    
    // Update local state
    setPageAnnotations(prev => [...prev, annotation]);
    
    // Notify parent
    onAnnotationAdded?.();
  }, [bookKey, pageNum, color, onAnnotationAdded]);

  return (
    <AnnotationCanvas
      pageNum={pageNum}
      width={width}
      height={height}
      scale={scale}
      tool={tool}
      color={color}
      lineWidth={lineWidth}
      onDrawingComplete={handleDrawingComplete}
      existingDrawings={pageAnnotations}
    />
  );
});