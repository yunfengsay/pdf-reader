import axios from 'axios';

export interface ArxivPaper {
  id: string;
  title: string;
  authors: string[];
  summary: string;
  pdfUrl: string;
  publishedDate: Date;
  categories: string[];
}

export class ArxivService {
  private static readonly BASE_URL = 'http://export.arxiv.org/api/query';
  
  static async search(query: string, maxResults = 20): Promise<ArxivPaper[]> {
    try {
      const response = await axios.get(this.BASE_URL, {
        params: {
          search_query: query,
          start: 0,
          max_results: maxResults,
          sortBy: 'relevance',
          sortOrder: 'descending'
        }
      });
      
      return this.parseArxivResponse(response.data);
    } catch (error) {
      console.error('Failed to search arXiv:', error);
      throw error;
    }
  }
  
  static async searchByCategory(category: string, maxResults = 20): Promise<ArxivPaper[]> {
    try {
      const response = await axios.get(this.BASE_URL, {
        params: {
          search_query: `cat:${category}`,
          start: 0,
          max_results: maxResults,
          sortBy: 'submittedDate',
          sortOrder: 'descending'
        }
      });
      
      return this.parseArxivResponse(response.data);
    } catch (error) {
      console.error('Failed to search arXiv by category:', error);
      throw error;
    }
  }
  
  private static parseArxivResponse(xmlData: string): ArxivPaper[] {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlData, 'text/xml');
    const entries = doc.getElementsByTagName('entry');
    
    const papers: ArxivPaper[] = [];
    
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      
      const id = entry.querySelector('id')?.textContent || '';
      const title = entry.querySelector('title')?.textContent?.trim() || '';
      const summary = entry.querySelector('summary')?.textContent?.trim() || '';
      const published = entry.querySelector('published')?.textContent || '';
      
      // Extract authors
      const authorElements = entry.querySelectorAll('author name');
      const authors: string[] = [];
      for (let j = 0; j < authorElements.length; j++) {
        const author = authorElements[j].textContent?.trim();
        if (author) authors.push(author);
      }
      
      // Extract categories
      const categoryElements = entry.querySelectorAll('category');
      const categories: string[] = [];
      for (let j = 0; j < categoryElements.length; j++) {
        const category = categoryElements[j].getAttribute('term');
        if (category) categories.push(category);
      }
      
      // Extract PDF URL
      const links = entry.querySelectorAll('link');
      let pdfUrl = '';
      for (let j = 0; j < links.length; j++) {
        const link = links[j];
        if (link.getAttribute('title') === 'pdf') {
          pdfUrl = link.getAttribute('href') || '';
          break;
        }
      }
      
      // Extract arXiv ID from the full URL
      const arxivId = id.split('/').pop() || '';
      
      papers.push({
        id: arxivId,
        title,
        authors,
        summary,
        pdfUrl: pdfUrl || `https://arxiv.org/pdf/${arxivId}.pdf`,
        publishedDate: new Date(published),
        categories
      });
    }
    
    return papers;
  }
}