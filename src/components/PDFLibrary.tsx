import React, { useEffect, useState } from 'react';
import { usePDFStore } from '@/stores/pdfStore';
import { Search, Upload, X, Calendar, User, Tag, FileText, Clock, MoreVertical, FileType } from 'lucide-react';
import { PDFDocument } from '@/db';
import { formatDistanceToNow } from '@/utils/date';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ArxivSearchDialog } from '@/components/ArxivSearchDialog';

interface PDFLibraryProps {
  onOpenDocument: (document: PDFDocument) => void;
}

export const PDFLibrary: React.FC<PDFLibraryProps> = ({ onOpenDocument }) => {
  const {
    isLoading,
    searchQuery,
    filterType,
    loadDocuments,
    addDocument,
    deleteDocument,
    setSearchQuery,
    setFilterType,
    getFilteredDocuments
  } = usePDFStore();

  const [dragActive, setDragActive] = useState(false);
  const [showArxivSearch, setShowArxivSearch] = useState(false);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    for (const file of files) {
      if (file.type === 'application/pdf') {
        await addDocument({
          title: file.name.replace('.pdf', ''),
          fileData: file,
          type: 'local',
          size: file.size
        });
      }
    }
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    for (const file of files) {
      if (file.type === 'application/pdf') {
        await addDocument({
          title: file.name.replace('.pdf', ''),
          fileData: file,
          type: 'local',
          size: file.size
        });
      }
    }
  };

  const handleArxivSearch = () => {
    setShowArxivSearch(true);
  };

  const filteredDocuments = getFilteredDocuments();

  return (
    <div className="flex flex-col h-full bg-gray-50/50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-semibold text-gray-900">PDF Library</h1>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleArxivSearch}
                variant="outline"
                className="border-gray-300 hover:bg-gray-100"
              >
                <Search className="w-4 h-4 mr-2" />
                Search arXiv
              </Button>
              <label>
                <Button
                  variant="default"
                  className="bg-gray-900 hover:bg-gray-800 text-white cursor-pointer"
                  asChild
                >
                  <span>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload PDF
                  </span>
                </Button>
                <input
                  type="file"
                  accept=".pdf"
                  multiple
                  onChange={handleFileInput}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Compact Search and Filter */}
          <div className="flex items-center gap-4">
            <div className="flex-1 relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search PDFs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 text-sm border border-gray-200 rounded-full bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400 transition-all"
              />
            </div>
            <div className="flex items-center gap-1">
              {(['all', 'local', 'arxiv', 'url'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={cn(
                    "px-3 py-1 text-xs font-medium rounded-full transition-all",
                    filterType === type
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  )}
                >
                  {type === 'all' ? 'All' : type === 'local' ? 'Local' : type === 'arxiv' ? 'arXiv' : 'URL'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Document Grid */}
      <div
        className={cn(
          "flex-1 p-6 overflow-auto transition-colors pdf-library-scroll",
          dragActive && 'bg-blue-50'
        )}
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-500">Loading documents...</div>
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="empty-state">
              <FileText className="w-16 h-16 mb-4 text-gray-300" />
            </div>
            <p className="text-lg mb-2 text-gray-600">No documents found</p>
            <p className="text-sm text-gray-500">Upload a PDF or search arXiv to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredDocuments.map((doc) => (
              <div
                key={doc.id}
                onClick={() => onOpenDocument(doc)}
                className="pdf-card bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all cursor-pointer overflow-hidden group relative"
              >
                {/* Actions Menu */}
                <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (doc.id) deleteDocument(doc.id);
                    }}
                    className="p-1.5 bg-white/90 backdrop-blur-sm rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <X className="w-4 h-4 text-gray-600 hover:text-red-600" />
                  </button>
                </div>

                {/* Thumbnail */}
                <div className="aspect-[3/4] bg-gray-100 relative overflow-hidden">
                  {doc.thumbnail ? (
                    <img
                      src={doc.thumbnail}
                      alt={doc.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full bg-gradient-to-br from-gray-50 to-gray-100">
                      <FileText className="w-20 h-20 text-gray-300" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-4">
                  <h3 className="font-medium text-gray-900 text-sm mb-2 line-clamp-2 leading-snug">
                    {doc.title}
                  </h3>
                  
                  {doc.author && (
                    <p className="text-xs text-gray-500 mb-2 truncate">
                      {doc.author}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      {doc.pages && (
                        <span className="flex items-center gap-1">
                          <FileType className="w-3 h-3" />
                          {doc.pages} 页
                        </span>
                      )}
                      {doc.size && (
                        <span>{(doc.size / 1024 / 1024).toFixed(1)} MB</span>
                      )}
                    </div>
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-xs font-medium",
                      doc.type === 'local' && 'bg-gray-100 text-gray-700',
                      doc.type === 'arxiv' && 'bg-gray-900 text-white',
                      doc.type === 'url' && 'bg-gray-200 text-gray-800'
                    )}>
                      {doc.type}
                    </span>
                  </div>
                  
                  <div className="text-xs text-gray-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDistanceToNow(doc.lastOpenedAt || doc.addedAt)}
                  </div>
                  
                  {doc.tags && doc.tags.length > 0 && (
                    <div className="mt-3 flex gap-1 flex-wrap">
                      {doc.tags.slice(0, 2).map((tag, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                      {doc.tags.length > 2 && (
                        <span className="text-xs text-gray-400">+{doc.tags.length - 2}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Drop Zone Overlay */}
      {dragActive && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center pointer-events-none z-50">
          <div className="bg-white rounded-2xl p-12 shadow-2xl border border-gray-200">
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Upload className="w-10 h-10 text-gray-700" />
              </div>
              <p className="text-lg font-semibold text-gray-900">Drop PDF files here</p>
              <p className="text-sm text-gray-500 mt-1">Release to upload</p>
            </div>
          </div>
        </div>
      )}
      
      {/* arXiv Search Dialog */}
      <ArxivSearchDialog 
        open={showArxivSearch} 
        onClose={() => setShowArxivSearch(false)} 
      />
    </div>
  );
};