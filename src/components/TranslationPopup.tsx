import React, { useState, useEffect } from 'react';
import { X, Loader2, Volume2, Copy, Languages } from 'lucide-react';
import { TranslationService } from '@/services/TranslationService';

interface TranslationPopupProps {
  isOpen: boolean;
  onClose: () => void;
  selectedText: string;
  position?: { x: number; y: number };
}

export const TranslationPopup: React.FC<TranslationPopupProps> = ({
  isOpen,
  onClose,
  selectedText,
  position,
}) => {
  const [translatedText, setTranslatedText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && selectedText) {
      translateText();
    }
  }, [isOpen, selectedText]);

  const translateText = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const sourceLang = TranslationService.detectLanguage(selectedText);
      const targetLang = sourceLang === 'zh' ? 'en' : 'zh';
      
      const result = await TranslationService.translate(selectedText, targetLang);
      setTranslatedText(result.translatedText);
    } catch (err) {
      setError('翻译失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleSpeak = (text: string, lang: string) => {
    TranslationService.speak(text, lang);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (!isOpen) return null;

  const modalStyle = position
    ? {
        position: 'fixed' as const,
        left: `${position.x}px`,
        top: `${position.y + 20}px`,
        transform: 'translateX(-50%)',
      }
    : {};

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4"
        style={position ? modalStyle : {}}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Languages className="w-5 h-5" />
            翻译
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* 原文 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">原文</label>
              <div className="flex gap-1">
                <button
                  onClick={() => handleSpeak(selectedText, 'en-US')}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                  title="朗读"
                >
                  <Volume2 className="w-4 h-4 text-gray-600" />
                </button>
                <button
                  onClick={() => handleCopy(selectedText)}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                  title="复制"
                >
                  <Copy className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg text-sm">
              {selectedText}
            </div>
          </div>

          {/* 译文 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">译文</label>
              {!loading && translatedText && (
                <div className="flex gap-1">
                  <button
                    onClick={() => handleSpeak(translatedText, 'zh-CN')}
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                    title="朗读"
                  >
                    <Volume2 className="w-4 h-4 text-gray-600" />
                  </button>
                  <button
                    onClick={() => handleCopy(translatedText)}
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                    title="复制"
                  >
                    <Copy className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              )}
            </div>
            <div className="p-3 bg-blue-50 rounded-lg text-sm min-h-[60px]">
              {loading ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                  <span className="ml-2 text-gray-600">翻译中...</span>
                </div>
              ) : error ? (
                <div className="text-red-500">{error}</div>
              ) : (
                <div>{translatedText}</div>
              )}
            </div>
          </div>
        </div>

        <div className="px-4 py-3 bg-gray-50 rounded-b-lg text-xs text-gray-500">
          提示：选中文本后右键可快速翻译
        </div>
      </div>
    </div>
  );
};