import * as pdfjsLib from 'pdfjs-dist';
import { GlobalWorkerOptions } from 'pdfjs-dist';

// Configure PDF.js worker
GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

export async function generatePDFThumbnail(file: Blob | string): Promise<string | null> {
  try {
    let pdfData: ArrayBuffer | string;
    
    if (file instanceof Blob) {
      pdfData = await file.arrayBuffer();
    } else {
      pdfData = file;
    }
    
    const loadingTask = pdfjsLib.getDocument(pdfData);
    const pdf = await loadingTask.promise;
    const page = await pdf.getPage(1);
    
    const viewport = page.getViewport({ scale: 0.5 });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    if (!context) return null;
    
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    
    const renderContext = {
      canvasContext: context,
      viewport: viewport
    };
    
    await page.render(renderContext).promise;
    
    // Convert to data URL
    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('Failed to generate thumbnail:', error);
    return null;
  }
}