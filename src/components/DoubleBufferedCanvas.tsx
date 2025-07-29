import React, { useRef, useEffect, useState, useCallback, memo } from 'react';
import { DrawingAnnotation } from '@/models/Annotation';

interface Point {
  x: number;
  y: number;
}

interface DoubleBufferedCanvasProps {
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

export const DoubleBufferedCanvas = memo<DoubleBufferedCanvasProps>(({
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
  // Main canvas for displaying
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Off-screen canvas for drawing without flicker
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  // Existing drawings canvas (static layer)
  const baseCanvasRef = useRef<HTMLCanvasElement | null>(null);
  
  const [isDrawing, setIsDrawing] = useState(false);
  const currentPathRef = useRef<Point[]>([]);
  const startPointRef = useRef<Point | null>(null);

  // Initialize off-screen canvases
  useEffect(() => {
    offscreenCanvasRef.current = document.createElement('canvas');
    offscreenCanvasRef.current.width = width;
    offscreenCanvasRef.current.height = height;

    baseCanvasRef.current = document.createElement('canvas');
    baseCanvasRef.current.width = width;
    baseCanvasRef.current.height = height;
  }, [width, height]);

  // Draw existing annotations to base canvas
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

  // Update base canvas when existing drawings change
  useEffect(() => {
    if (!baseCanvasRef.current) return;
    const baseCtx = baseCanvasRef.current.getContext('2d');
    if (!baseCtx) return;

    baseCtx.clearRect(0, 0, width, height);
    drawExistingAnnotations(baseCtx);

    // Also update main canvas
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(baseCanvasRef.current, 0, 0);
      }
    }
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

  const updateCanvas = useCallback(() => {
    if (!canvasRef.current || !offscreenCanvasRef.current || !baseCanvasRef.current) return;
    
    const ctx = canvasRef.current.getContext('2d');
    const offCtx = offscreenCanvasRef.current.getContext('2d');
    if (!ctx || !offCtx) return;

    // Clear off-screen canvas and draw base layer
    offCtx.clearRect(0, 0, width, height);
    offCtx.drawImage(baseCanvasRef.current, 0, 0);

    // Draw current path
    if (currentPathRef.current.length > 0 && tool) {
      offCtx.save();
      offCtx.strokeStyle = color;
      offCtx.lineWidth = lineWidth;
      offCtx.lineCap = 'round';
      offCtx.lineJoin = 'round';
      offCtx.beginPath();

      if (tool === 'pen') {
        offCtx.moveTo(currentPathRef.current[0].x, currentPathRef.current[0].y);
        currentPathRef.current.forEach((point, index) => {
          if (index > 0) {
            offCtx.lineTo(point.x, point.y);
          }
        });
      } else if (startPointRef.current && currentPathRef.current.length > 0) {
        const endPoint = currentPathRef.current[currentPathRef.current.length - 1];
        
        switch (tool) {
          case 'rectangle':
            offCtx.rect(
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
            offCtx.arc(startPointRef.current.x, startPointRef.current.y, radius, 0, 2 * Math.PI);
            break;
          case 'line':
            offCtx.moveTo(startPointRef.current.x, startPointRef.current.y);
            offCtx.lineTo(endPoint.x, endPoint.y);
            break;
          case 'arrow':
            offCtx.moveTo(startPointRef.current.x, startPointRef.current.y);
            offCtx.lineTo(endPoint.x, endPoint.y);
            const angle = Math.atan2(
              endPoint.y - startPointRef.current.y, 
              endPoint.x - startPointRef.current.x
            );
            const arrowLength = 15;
            offCtx.moveTo(endPoint.x, endPoint.y);
            offCtx.lineTo(
              endPoint.x - arrowLength * Math.cos(angle - Math.PI / 6),
              endPoint.y - arrowLength * Math.sin(angle - Math.PI / 6)
            );
            offCtx.moveTo(endPoint.x, endPoint.y);
            offCtx.lineTo(
              endPoint.x - arrowLength * Math.cos(angle + Math.PI / 6),
              endPoint.y - arrowLength * Math.sin(angle + Math.PI / 6)
            );
            break;
        }
      }
      offCtx.stroke();
      offCtx.restore();
    }

    // Copy to main canvas
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(offscreenCanvasRef.current, 0, 0);
  }, [tool, color, lineWidth, width, height]);

  const startDrawing = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!tool) return;

    const point = getMousePosition(e);
    setIsDrawing(true);
    startPointRef.current = point;
    currentPathRef.current = [point];
  }, [tool]);

  const draw = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !tool) return;

    const point = getMousePosition(e);
    
    if (tool === 'pen') {
      currentPathRef.current.push(point);
    } else {
      currentPathRef.current = [startPointRef.current!, point];
    }

    updateCanvas();
  }, [isDrawing, tool, updateCanvas]);

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
    }

    // Reset
    setIsDrawing(false);
    currentPathRef.current = [];
    startPointRef.current = null;
  }, [isDrawing, tool, color, lineWidth, pageNum, onDrawingComplete]);

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