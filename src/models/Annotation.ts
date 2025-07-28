export type AnnotationType = 'highlight' | 'drawing' | 'stamp' | 'text' | 'note';
export type HighlightStyle = 'background' | 'underline' | 'strikethrough' | 'squiggly';

export interface AnnotationBase {
  id: string;
  type: AnnotationType;
  pageNumber: number;
  bookKey: string;
  metadata: {
    author?: string;
    timestamp: number;
    color: string;
    opacity: number;
  };
}

export interface HighlightAnnotation extends AnnotationBase {
  type: 'highlight';
  data: {
    text: string;
    style: HighlightStyle;
    boxes: Array<{
      x: number;
      y: number;
      width: number;
      height: number;
    }>;
  };
}

export interface DrawingAnnotation extends AnnotationBase {
  type: 'drawing';
  data: {
    tool: 'pen' | 'rectangle' | 'circle' | 'arrow' | 'line';
    paths: Array<{
      points: Array<{ x: number; y: number }>;
      lineWidth: number;
      color: string;
    }>;
    bounds: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  };
}

export interface StampAnnotation extends AnnotationBase {
  type: 'stamp';
  data: {
    stampType: 'icon' | 'image' | 'text';
    content: string; // icon name, image data URL, or text
    position: {
      x: number;
      y: number;
    };
    size: {
      width: number;
      height: number;
    };
    rotation: number;
  };
}

export interface TextAnnotation extends AnnotationBase {
  type: 'text';
  data: {
    content: string;
    position: {
      x: number;
      y: number;
    };
    fontSize: number;
    fontFamily: string;
  };
}

export interface NoteAnnotation extends AnnotationBase {
  type: 'note';
  data: {
    linkedText?: string;
    noteContent: string;
    position: {
      x: number;
      y: number;
    };
    highlightId?: string; // Link to associated highlight
  };
}

export type Annotation = 
  | HighlightAnnotation 
  | DrawingAnnotation 
  | StampAnnotation 
  | TextAnnotation 
  | NoteAnnotation;

export class AnnotationFactory {
  static createHighlight(
    bookKey: string,
    pageNumber: number,
    text: string,
    boxes: Array<{ x: number; y: number; width: number; height: number }>,
    style: HighlightStyle = 'background',
    color: string = '#ffeb3b'
  ): HighlightAnnotation {
    return {
      id: `highlight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'highlight',
      pageNumber,
      bookKey,
      metadata: {
        timestamp: Date.now(),
        color,
        opacity: 0.3,
      },
      data: {
        text,
        style,
        boxes,
      },
    };
  }

  static createDrawing(
    bookKey: string,
    pageNumber: number,
    tool: DrawingAnnotation['data']['tool'],
    paths: DrawingAnnotation['data']['paths'],
    color: string = '#000000'
  ): DrawingAnnotation {
    // Calculate bounds
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    paths.forEach(path => {
      path.points.forEach(point => {
        minX = Math.min(minX, point.x);
        minY = Math.min(minY, point.y);
        maxX = Math.max(maxX, point.x);
        maxY = Math.max(maxY, point.y);
      });
    });

    // Ensure we have valid bounds
    if (minX === Infinity) {
      minX = 0;
      minY = 0;
      maxX = 0;
      maxY = 0;
    }

    return {
      id: `drawing_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'drawing',
      pageNumber,
      bookKey,
      metadata: {
        timestamp: Date.now(),
        color,
        opacity: 1,
      },
      data: {
        tool,
        paths,
        bounds: {
          x: minX,
          y: minY,
          width: maxX - minX,
          height: maxY - minY,
        },
      },
    };
  }

  static createStamp(
    bookKey: string,
    pageNumber: number,
    stampType: StampAnnotation['data']['stampType'],
    content: string,
    position: { x: number; y: number },
    size: { width: number; height: number } = { width: 50, height: 50 }
  ): StampAnnotation {
    return {
      id: `stamp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'stamp',
      pageNumber,
      bookKey,
      metadata: {
        timestamp: Date.now(),
        color: '#000000',
        opacity: 1,
      },
      data: {
        stampType,
        content,
        position,
        size,
        rotation: 0,
      },
    };
  }
}