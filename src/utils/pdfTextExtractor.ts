import type { PDFDocumentProxy } from 'pdfjs-dist';

export async function extractFullTextFromPDF(pdfDoc: PDFDocumentProxy): Promise<string> {
  const textContents: string[] = [];
  
  for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
    try {
      const page = await pdfDoc.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
      
      if (pageText) {
        textContents.push(`[第${pageNum}页]\n${pageText}`);
      }
    } catch (error) {
      console.error(`Error extracting text from page ${pageNum}:`, error);
    }
  }
  
  return textContents.join('\n\n');
}

export function truncateText(text: string, maxLength: number = 50000): string {
  if (text.length <= maxLength) {
    return text;
  }
  
  // Try to truncate at a sentence boundary
  const truncated = text.substring(0, maxLength);
  const lastPeriod = truncated.lastIndexOf('。');
  const lastNewline = truncated.lastIndexOf('\n');
  
  const cutPoint = Math.max(lastPeriod, lastNewline);
  
  if (cutPoint > maxLength * 0.8) {
    return truncated.substring(0, cutPoint + 1) + '\n\n[内容已截断...]';
  }
  
  return truncated + '...\n\n[内容已截断...]';
}