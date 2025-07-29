import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Search, Download, Calendar, User, Loader2 } from 'lucide-react';
import { ArxivService, ArxivPaper } from '@/services/arxivService';
import { usePDFStore } from '@/stores/pdfStore';

interface ArxivSearchDialogProps {
  open: boolean;
  onClose: () => void;
}

export const ArxivSearchDialog: React.FC<ArxivSearchDialogProps> = ({ open, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<ArxivPaper[]>([]);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const { addDocument } = usePDFStore();

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    try {
      const papers = await ArxivService.search(searchQuery);
      setResults(papers);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (paper: ArxivPaper) => {
    setDownloading(paper.id);
    try {
      // Add to library with URL
      await addDocument({
        title: paper.title,
        author: paper.authors.join(', '),
        url: paper.pdfUrl,
        type: 'arxiv',
        tags: paper.categories
      });
      
      // Close dialog after successful download
      onClose();
    } catch (error) {
      console.error('Failed to add document:', error);
    } finally {
      setDownloading(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Search arXiv Papers</DialogTitle>
        </DialogHeader>
        
        <div className="flex gap-2 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by title, author, or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400"
            />
          </div>
          <Button
            onClick={handleSearch}
            disabled={loading}
            className="bg-gray-900 hover:bg-gray-800 text-white"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              'Search'
            )}
          </Button>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {results.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {loading ? 'Searching...' : 'No results found. Try searching for a topic or author.'}
            </div>
          ) : (
            <div className="space-y-4">
              {results.map((paper) => (
                <div
                  key={paper.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 mb-2 line-clamp-2">
                        {paper.title}
                      </h3>
                      
                      <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {paper.authors.slice(0, 3).join(', ')}
                          {paper.authors.length > 3 && ` +${paper.authors.length - 3}`}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {paper.publishedDate.toLocaleDateString()}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                        {paper.summary}
                      </p>
                      
                      <div className="flex gap-1 flex-wrap">
                        {paper.categories.slice(0, 3).map((cat) => (
                          <span
                            key={cat}
                            className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full"
                          >
                            {cat}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <Button
                      onClick={() => handleDownload(paper)}
                      disabled={downloading === paper.id}
                      size="sm"
                      className="bg-gray-900 hover:bg-gray-800 text-white"
                    >
                      {downloading === paper.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};