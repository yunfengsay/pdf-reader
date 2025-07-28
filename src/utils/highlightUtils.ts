
export interface CharacterBox {
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
}

export interface HighlightBox {
  pageNum: number;
  boxes: CharacterBox[];
  text: string;
}

export class HighlightUtils {
  /**
   * Get precise character positions from PDF text content
   */
  static async getCharacterBoxes(
    page: any,
    _scale: number = 1
  ): Promise<Map<number, CharacterBox[]>> {
    const textContent = await page.getTextContent();
    // const viewport = page.getViewport({ scale });
    const characterMap = new Map<number, CharacterBox[]>();
    
    textContent.items.forEach((item: any, itemIndex: number) => {
      if (!item.str) return;
      
      const tx = item.transform;
      const fontSize = Math.sqrt(tx[0] * tx[0] + tx[1] * tx[1]);
      // const angle = Math.atan2(tx[1], tx[0]);
      
      // Calculate character positions
      const chars: CharacterBox[] = [];
      let currentX = tx[4];
      let currentY = tx[5];
      
      for (let i = 0; i < item.str.length; i++) {
        const char = item.str[i];
        const charWidth = item.width ? (item.width / item.str.length) : fontSize * 0.5;
        
        chars.push({
          x: currentX,
          y: currentY - fontSize, // PDF coordinates are bottom-up
          width: charWidth,
          height: fontSize * 1.2,
          text: char
        });
        
        currentX += charWidth;
      }
      
      characterMap.set(itemIndex, chars);
    });
    
    return characterMap;
  }

  /**
   * Find character boxes that match the selected text
   */
  static findTextBoxes(
    characterMap: Map<number, CharacterBox[]>,
    selectedText: string,
    _pageElement: HTMLElement
  ): CharacterBox[] {
    const normalizedSelected = selectedText.replace(/\s+/g, ' ').trim();
    const matchedBoxes: CharacterBox[] = [];
    
    // Convert character map to flat array for easier searching
    const allChars: { box: CharacterBox; itemIndex: number; charIndex: number }[] = [];
    characterMap.forEach((chars, itemIndex) => {
      chars.forEach((box, charIndex) => {
        allChars.push({ box, itemIndex, charIndex });
      });
    });
    
    // Find matching text sequence
    for (let i = 0; i < allChars.length; i++) {
      let matchedText = '';
      let tempBoxes: CharacterBox[] = [];
      let j = i;
      
      while (j < allChars.length && matchedText.length < normalizedSelected.length) {
        const char = allChars[j].box.text;
        matchedText += char;
        tempBoxes.push(allChars[j].box);
        
        if (normalizedSelected.startsWith(matchedText.replace(/\s+/g, ' ').trim())) {
          j++;
        } else {
          break;
        }
      }
      
      if (matchedText.replace(/\s+/g, ' ').trim() === normalizedSelected) {
        matchedBoxes.push(...tempBoxes);
        break;
      }
    }
    
    return matchedBoxes;
  }

  /**
   * Merge adjacent character boxes into continuous highlight regions
   */
  static mergeCharacterBoxes(boxes: CharacterBox[]): CharacterBox[] {
    if (boxes.length === 0) return [];
    
    const merged: CharacterBox[] = [];
    let currentBox: CharacterBox | null = null;
    
    boxes.forEach((box, index) => {
      if (!currentBox) {
        currentBox = { ...box };
        return;
      }
      
      // Check if boxes are on the same line and adjacent
      const sameLine = Math.abs(box.y - currentBox.y) < 2;
      const adjacent = Math.abs((currentBox.x + currentBox.width) - box.x) < 5;
      
      if (sameLine && adjacent) {
        // Extend current box
        currentBox.width = (box.x + box.width) - currentBox.x;
        currentBox.text += box.text;
      } else {
        // Start new box
        merged.push(currentBox);
        currentBox = { ...box };
      }
      
      // Push the last box
      if (index === boxes.length - 1) {
        merged.push(currentBox);
      }
    });
    
    return merged;
  }

  /**
   * Create highlight elements with precise positioning
   */
  static createHighlightElements(
    boxes: CharacterBox[],
    _pageElement: HTMLElement,
    color: string,
    style: 'background' | 'underline' | 'strikethrough' | 'squiggly' = 'background'
  ): HTMLElement[] {
    // const pageRect = pageElement.getBoundingClientRect();
    const highlights: HTMLElement[] = [];
    
    boxes.forEach((box, index) => {
      const highlightDiv = document.createElement('div');
      highlightDiv.className = 'pdf-highlight';
      highlightDiv.style.position = 'absolute';
      highlightDiv.style.left = `${box.x}px`;
      highlightDiv.style.width = `${box.width}px`;
      
      switch (style) {
        case 'background':
          highlightDiv.style.top = `${box.y}px`;
          highlightDiv.style.height = `${box.height}px`;
          highlightDiv.style.backgroundColor = color;
          highlightDiv.style.opacity = '0.3';
          highlightDiv.style.mixBlendMode = 'multiply';
          break;
          
        case 'underline':
          highlightDiv.style.top = `${box.y + box.height - 2}px`;
          highlightDiv.style.height = '2px';
          highlightDiv.style.backgroundColor = color;
          break;
          
        case 'strikethrough':
          highlightDiv.style.top = `${box.y + box.height / 2}px`;
          highlightDiv.style.height = '2px';
          highlightDiv.style.backgroundColor = color;
          break;
          
        case 'squiggly':
          highlightDiv.style.top = `${box.y + box.height - 3}px`;
          highlightDiv.style.height = '3px';
          highlightDiv.style.backgroundImage = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='6' height='3'%3E%3Cpath d='M0 3 Q 1.5 0 3 3 T 6 3' stroke='${encodeURIComponent(color)}' fill='none'/%3E%3C/svg%3E")`;
          highlightDiv.style.backgroundRepeat = 'repeat-x';
          break;
      }
      
      // Add rounded corners for first and last elements
      if (index === 0) {
        highlightDiv.style.borderTopLeftRadius = '2px';
        highlightDiv.style.borderBottomLeftRadius = '2px';
      }
      if (index === boxes.length - 1) {
        highlightDiv.style.borderTopRightRadius = '2px';
        highlightDiv.style.borderBottomRightRadius = '2px';
      }
      
      highlights.push(highlightDiv);
    });
    
    return highlights;
  }
}