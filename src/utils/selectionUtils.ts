export interface SelectionInfo {
  text: string;
  rects: DOMRect[];
  range: Range;
  pageNum: number;
}

export function getSelectionInfo(): SelectionInfo | null {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
    return null;
  }

  const range = selection.getRangeAt(0);
  const text = selection.toString().trim();
  
  if (!text) return null;

  // Get all client rects for the selection (handles multi-line selections)
  const rects = Array.from(range.getClientRects());
  
  // Find which page contains the selection
  let pageNum = 1;
  const commonAncestor = range.commonAncestorContainer;
  let element = commonAncestor.nodeType === Node.TEXT_NODE 
    ? commonAncestor.parentElement 
    : commonAncestor as Element;
    
  while (element) {
    if (element.classList?.contains('pdf-page')) {
      const match = element.id.match(/page-(\d+)/);
      if (match) {
        pageNum = parseInt(match[1], 10);
      }
      break;
    }
    element = element.parentElement;
  }

  return {
    text,
    rects,
    range,
    pageNum
  };
}

export function createHighlightRects(
  selectionInfo: SelectionInfo,
  pageElement: HTMLElement,
  color: string
): HTMLElement[] {
  const pageRect = pageElement.getBoundingClientRect();
  const highlights: HTMLElement[] = [];

  selectionInfo.rects.forEach((rect, index) => {
    const highlightDiv = document.createElement('div');
    highlightDiv.className = 'highlight-rect';
    highlightDiv.style.position = 'absolute';
    highlightDiv.style.left = `${rect.left - pageRect.left}px`;
    highlightDiv.style.top = `${rect.top - pageRect.top}px`;
    highlightDiv.style.width = `${rect.width}px`;
    highlightDiv.style.height = `${rect.height}px`;
    highlightDiv.style.backgroundColor = color;
    highlightDiv.style.opacity = '0.3';
    highlightDiv.style.pointerEvents = 'auto';
    highlightDiv.style.cursor = 'pointer';
    
    // Add rounded corners for first and last rect
    if (index === 0) {
      highlightDiv.style.borderTopLeftRadius = '2px';
      highlightDiv.style.borderBottomLeftRadius = '2px';
    }
    if (index === selectionInfo.rects.length - 1) {
      highlightDiv.style.borderTopRightRadius = '2px';
      highlightDiv.style.borderBottomRightRadius = '2px';
    }
    
    highlights.push(highlightDiv);
  });

  return highlights;
}