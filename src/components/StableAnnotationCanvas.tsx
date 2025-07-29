import React, { useRef, useEffect, useState, useCallback, memo } from 'react';
import { DrawingAnnotation } from '@/models/Annotation';

interface Point {
  x: number;
  y: number;
}

interface StableAnnotationCanvasProps {
  pageNum: number;
  width: number;
  height: number;
  scale: number;
  tool: 'pen' | 'rectangle' | 'circle' | 'arrow' | 'line' | null;
  color: string;
  lineWidth: number;
  onDrawingComplete: (pageNum: number, annotation: DrawingAnnotation['data']) => void;
  existingDrawings: DrawingAnnotation[];
}

export const StableAnnotationCanvas = memo<StableAnnotationCanvasProps>(({
  pageNum,
  width,
  height,
  scale,
  tool,
  color,
  lineWidth,
  onDrawingComplete,
  existingDrawings = [],
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const currentPathRef = useRef<Point[]>([]);
  const startPointRef = useRef<Point | null>(null);
  const animationFrameRef = useRef<number>();

  // Draw existing annotations (without clearing in-progress drawings)
  const drawExistingAnnotations = useCallback((ctx: CanvasRenderingContext2D) => {
    existingDrawings.forEach(drawing => {
      if (drawing.pageNumber !== pageNum) return;
      
      drawing.data.paths.forEach(path => {
        ctx.beginPath();
        ctx.strokeStyle = path.color;
        ctx.lineWidth = path.lineWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        if (drawing.data.tool === 'pen') {
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
          ctx.moveTo(start.x, start.y);
          ctx.lineTo(end.x, end.y);
          
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
  }, [existingDrawings, pageNum]);

  // Redraw only when existingDrawings change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);
    drawExistingAnnotations(ctx);
  }, [existingDrawings, width, height, drawExistingAnnotations]);

  const getMousePosition = (e: React.MouseEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (width / rect.width),
      y: (e.clientY - rect.top) * (height / rect.height),
    };
  };

  const drawCurrentPath = useCallback((ctx: CanvasRenderingContext2D) => {
    if (!tool || currentPathRef.current.length === 0) return;

    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (tool === 'pen') {
      ctx.beginPath();
      ctx.moveTo(currentPathRef.current[0].x, currentPathRef.current[0].y);
      currentPathRef.current.forEach((point, index) => {
        if (index > 0) {
          ctx.lineTo(point.x, point.y);
        }
      });
      ctx.stroke();
    } else if (startPointRef.current && currentPathRef.current.length > 0) {
      const endPoint = currentPathRef.current[currentPathRef.current.length - 1];
      ctx.beginPath();
      
      switch (tool) {
        case 'rectangle':
          ctx.rect(
            startPointRef.current.x, 
            startPointRef.current.y, 
            endPoint.x - startPointRef.current.x, 
            endPoint.y - startPointRef.current.y
          );
          break;
        case 'circle':
          const radius = Math.sqrt(
            Math.pow(endPoint.x - startPointRef.current.x, 2) + 
            Math.pow(endPoint.y - startPointRef.current.y, 2)
          );
          ctx.arc(startPointRef.current.x, startPointRef.current.y, radius, 0, 2 * Math.PI);
          break;
        case 'line':
          ctx.moveTo(startPointRef.current.x, startPointRef.current.y);
          ctx.lineTo(endPoint.x, endPoint.y);
          break;
        case 'arrow':
          ctx.moveTo(startPointRef.current.x, startPointRef.current.y);
          ctx.lineTo(endPoint.x, endPoint.y);
          const angle = Math.atan2(
            endPoint.y - startPointRef.current.y, 
            endPoint.x - startPointRef.current.x
          );
          const arrowLength = 15;
          ctx.moveTo(endPoint.x, endPoint.y);
          ctx.lineTo(
            endPoint.x - arrowLength * Math.cos(angle - Math.PI / 6),
            endPoint.y - arrowLength * Math.sin(angle - Math.PI / 6)
          );
          ctx.moveTo(endPoint.x, endPoint.y);
          ctx.lineTo(
            endPoint.x - arrowLength * Math.cos(angle + Math.PI / 6),
            endPoint.y - arrowLength * Math.sin(angle + Math.PI / 6)
          );
          break;
      }
      ctx.stroke();
    }
    ctx.restore();
  }, [tool, color, lineWidth]);

  const startDrawing = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!tool) return;

    const point = getMousePosition(e);
    setIsDrawing(true);
    startPointRef.current = point;
    currentPathRef.current = [point];
  }, [tool]);

  const draw = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !tool || !canvasRef.current) return;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const point = getMousePosition(e);
    
    if (tool === 'pen') {
      // For pen tool, draw incrementally without clearing
      const lastPoint = currentPathRef.current[currentPathRef.current.length - 1];
      currentPathRef.current.push(point);
      
      // Draw only the new segment
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(lastPoint.x, lastPoint.y);
      ctx.lineTo(point.x, point.y);
      ctx.stroke();
      ctx.restore();
    } else {
      // For shapes, we need to redraw
      currentPathRef.current = [startPointRef.current!, point];
      
      // Use requestAnimationFrame for smooth drawing
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      animationFrameRef.current = requestAnimationFrame(() => {
        ctx.clearRect(0, 0, width, height);
        drawExistingAnnotations(ctx);
        drawCurrentPath(ctx);
      });
    }
  }, [isDrawing, tool, width, height, color, lineWidth, drawExistingAnnotations, drawCurrentPath]);

  const stopDrawing = useCallback(() => {
    if (!isDrawing || !tool || !startPointRef.current) return;

    const finalPath = currentPathRef.current;
    
    if (finalPath.length > 0) {
      const annotationData: DrawingAnnotation['data'] = {
        tool,
        paths: [{
          points: tool === 'pen' ? finalPath : [startPointRef.current, finalPath[finalPath.length - 1]],
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

      onDrawingComplete(pageNum, annotationData);
      
      // For pen tool, we need to redraw after completion to ensure the drawing is clean
      if (tool === 'pen' && canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          setTimeout(() => {
            ctx.clearRect(0, 0, width, height);
            drawExistingAnnotations(ctx);
          }, 50);
        }
      }
    }

    // Reset
    setIsDrawing(false);
    currentPathRef.current = [];
    startPointRef.current = null;
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  }, [isDrawing, tool, color, lineWidth, pageNum, width, height, onDrawingComplete, drawExistingAnnotations]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

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
      }}
      onMouseDown={startDrawing}
      onMouseMove={draw}
      onMouseUp={stopDrawing}
      onMouseLeave={stopDrawing}
    />
  );
}, (prevProps, nextProps) => {
  // Custom comparison to prevent unnecessary re-renders
  return (
    prevProps.pageNum === nextProps.pageNum &&
    prevProps.width === nextProps.width &&
    prevProps.height === nextProps.height &&
    prevProps.scale === nextProps.scale &&
    prevProps.tool === nextProps.tool &&
    prevProps.color === nextProps.color &&
    prevProps.lineWidth === nextProps.lineWidth &&
    prevProps.existingDrawings.length === nextProps.existingDrawings.length &&
    prevProps.existingDrawings.every((d, i) => d.id === nextProps.existingDrawings[i]?.id)
  );
});