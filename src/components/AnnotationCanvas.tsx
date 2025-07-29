import React, { useRef, useEffect, useState, useCallback } from 'react';
import { DrawingAnnotation } from '@/models/Annotation';

interface Point {
  x: number;
  y: number;
}

interface AnnotationCanvasProps {
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

export const AnnotationCanvas: React.FC<AnnotationCanvasProps> = ({
  pageNum,
  width,
  height,
  scale: _scale,
  tool,
  color,
  lineWidth,
  onDrawingComplete,
  existingDrawings = [],
}) => {
  console.log(`AnnotationCanvas rendered for page ${pageNum}:`, { 
    tool, 
    color, 
    existingDrawingsCount: existingDrawings.length,
    existingDrawingsPages: existingDrawings.map(d => d.pageNumber)
  });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<Point[]>([]);
  const [startPoint, setStartPoint] = useState<Point | null>(null);

  // Store the current drawing in progress
  const currentDrawingRef = useRef<{ path: Point[]; tool: string } | null>(null);

  // Redraw existing annotations
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw ONLY annotations for this specific page
    existingDrawings.forEach(drawing => {
      // Double-check page number
      if (drawing.pageNumber !== pageNum) {
        console.warn(`Skipping drawing for page ${drawing.pageNumber} on page ${pageNum}`);
        return;
      }
      
      drawing.data.paths.forEach(path => {
        ctx.beginPath();
        ctx.strokeStyle = path.color;
        ctx.lineWidth = path.lineWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        if (drawing.data.tool === 'pen') {
          // Draw freehand path
          path.points.forEach((point, index) => {
            if (index === 0) {
              ctx.moveTo(point.x, point.y);
            } else {
              ctx.lineTo(point.x, point.y);
            }
          });
        } else if (drawing.data.tool === 'rectangle' && path.points.length === 2) {
          const [start, end] = path.points;
          ctx.rect(start.x, start.y, end.x - start.x, end.y - start.y);
        } else if (drawing.data.tool === 'circle' && path.points.length === 2) {
          const [start, end] = path.points;
          const radius = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
          ctx.arc(start.x, start.y, radius, 0, 2 * Math.PI);
        } else if (drawing.data.tool === 'line' && path.points.length === 2) {
          const [start, end] = path.points;
          ctx.moveTo(start.x, start.y);
          ctx.lineTo(end.x, end.y);
        } else if (drawing.data.tool === 'arrow' && path.points.length === 2) {
          const [start, end] = path.points;
          // Draw line
          ctx.moveTo(start.x, start.y);
          ctx.lineTo(end.x, end.y);
          
          // Draw arrowhead
          const angle = Math.atan2(end.y - start.y, end.x - start.x);
          const arrowLength = 15;
          ctx.moveTo(end.x, end.y);
          ctx.lineTo(
            end.x - arrowLength * Math.cos(angle - Math.PI / 6),
            end.y - arrowLength * Math.sin(angle - Math.PI / 6)
          );
          ctx.moveTo(end.x, end.y);
          ctx.lineTo(
            end.x - arrowLength * Math.cos(angle + Math.PI / 6),
            end.y - arrowLength * Math.sin(angle + Math.PI / 6)
          );
        }

        ctx.stroke();
      });
    });

    // Redraw current drawing in progress if any
    if (currentDrawingRef.current && isDrawing) {
      const { path, tool: currentTool } = currentDrawingRef.current;
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (currentTool === 'pen' && path.length > 0) {
        ctx.moveTo(path[0].x, path[0].y);
        path.forEach((point, index) => {
          if (index > 0) {
            ctx.lineTo(point.x, point.y);
          }
        });
        ctx.stroke();
      }
    }
  }, [existingDrawings, pageNum, width, height, isDrawing, color, lineWidth]);

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  const getMousePosition = (e: React.MouseEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (width / rect.width),
      y: (e.clientY - rect.top) * (height / rect.height),
    };
  };

  const startDrawing = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!tool) return;

    const point = getMousePosition(e);
    setIsDrawing(true);
    setStartPoint(point);
    setCurrentPath([point]);
    currentDrawingRef.current = { path: [point], tool };
  }, [tool]);

  const draw = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !tool || !canvasRef.current) return;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const point = getMousePosition(e);

    if (tool === 'pen') {
      // Add point to path
      setCurrentPath(prev => {
        const newPath = [...prev, point];
        currentDrawingRef.current = { path: newPath, tool };
        return newPath;
      });

      // Redraw everything with the new point
      redrawCanvas();
    } else {
      // For shapes, redraw everything including preview
      const canvas = canvasRef.current;
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = width;
      tempCanvas.height = height;
      const tempCtx = tempCanvas.getContext('2d');
      
      if (tempCtx) {
        // Copy existing content
        tempCtx.drawImage(canvas, 0, 0);
        
        // Clear and restore
        ctx.clearRect(0, 0, width, height);
        
        // Redraw existing
        existingDrawings.forEach(_drawing => {
          // ... (same drawing code as in useEffect)
        });

        // Draw preview shape
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.setLineDash([5, 5]);

        if (startPoint) {
          switch (tool) {
            case 'rectangle':
              ctx.rect(startPoint.x, startPoint.y, point.x - startPoint.x, point.y - startPoint.y);
              break;
            case 'circle':
              const radius = Math.sqrt(Math.pow(point.x - startPoint.x, 2) + Math.pow(point.y - startPoint.y, 2));
              ctx.arc(startPoint.x, startPoint.y, radius, 0, 2 * Math.PI);
              break;
            case 'line':
              ctx.moveTo(startPoint.x, startPoint.y);
              ctx.lineTo(point.x, point.y);
              break;
            case 'arrow':
              ctx.moveTo(startPoint.x, startPoint.y);
              ctx.lineTo(point.x, point.y);
              // Draw arrowhead preview
              const angle = Math.atan2(point.y - startPoint.y, point.x - startPoint.x);
              const arrowLength = 15;
              ctx.moveTo(point.x, point.y);
              ctx.lineTo(
                point.x - arrowLength * Math.cos(angle - Math.PI / 6),
                point.y - arrowLength * Math.sin(angle - Math.PI / 6)
              );
              ctx.moveTo(point.x, point.y);
              ctx.lineTo(
                point.x - arrowLength * Math.cos(angle + Math.PI / 6),
                point.y - arrowLength * Math.sin(angle + Math.PI / 6)
              );
              break;
          }
        }

        ctx.stroke();
        ctx.setLineDash([]);
      }
    }
  }, [isDrawing, tool, color, lineWidth, currentPath, startPoint, existingDrawings, width, height]);

  const stopDrawing = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !tool || !startPoint) return;

    const point = getMousePosition(e);
    let finalPath: Point[] = [];

    if (tool === 'pen') {
      finalPath = currentPath;
    } else {
      finalPath = [startPoint, point];
    }

    // Only create annotation if we have valid points
    if (finalPath.length > 0) {
      // Create annotation data
      const annotationData: DrawingAnnotation['data'] = {
        tool,
        paths: [{
          points: finalPath,
          lineWidth,
          color,
        }],
        bounds: {
          x: Math.min(...finalPath.map(p => p.x)),
          y: Math.min(...finalPath.map(p => p.y)),
          width: Math.max(...finalPath.map(p => p.x)) - Math.min(...finalPath.map(p => p.x)),
          height: Math.max(...finalPath.map(p => p.y)) - Math.min(...finalPath.map(p => p.y)),
        },
      };

      console.log(`Creating annotation for page ${pageNum}:`, annotationData);
      onDrawingComplete(annotationData);
    }

    // Reset drawing state
    setIsDrawing(false);
    setCurrentPath([]);
    setStartPoint(null);
    currentDrawingRef.current = null;
  }, [isDrawing, tool, startPoint, currentPath, color, lineWidth, onDrawingComplete, pageNum]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="absolute top-0 left-0"
      style={{
        cursor: tool ? 'crosshair' : 'default',
        pointerEvents: tool ? 'auto' : 'none',
        zIndex: 20,
        border: tool ? '1px dashed rgba(0,0,0,0.2)' : 'none',
      }}
      onMouseDown={startDrawing}
      onMouseMove={draw}
      onMouseUp={stopDrawing}
      onMouseLeave={stopDrawing}
    />
  );
};