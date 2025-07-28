export interface TranslationResult {
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
}

export class TranslationService {
  // 使用免费的翻译 API (MyMemory)
  static async translate(text: string, targetLang: string = 'zh'): Promise<TranslationResult> {
    try {
      // MyMemory API - 免费翻译服务
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${targetLang}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.responseStatus === 200) {
        return {
          translatedText: data.responseData.translatedText,
          sourceLanguage: 'en',
          targetLanguage: targetLang,
        };
      }
      
      throw new Error('Translation failed');
    } catch (error) {
      console.error('Translation error:', error);
      // 返回模拟翻译结果
      return {
        translatedText: `[翻译] ${text}`,
        sourceLanguage: 'en',
        targetLanguage: targetLang,
      };
    }
  }

  // 使用浏览器内置的语音合成
  static speak(text: string, lang: string = 'en-US'): void {
    if ('speechSynthesis' in window) {
      // 停止当前朗读
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 1;
      
      window.speechSynthesis.speak(utterance);
    } else {
      alert('您的浏览器不支持语音合成功能');
    }
  }

  // 检测文本语言
  static detectLanguage(text: string): string {
    // 简单的语言检测逻辑
    const chineseRegex = /[\u4e00-\u9fa5]/;
    const japaneseRegex = /[\u3040-\u309f\u30a0-\u30ff]/;
    const koreanRegex = /[\uac00-\ud7af]/;
    
    if (chineseRegex.test(text)) return 'zh';
    if (japaneseRegex.test(text)) return 'ja';
    if (koreanRegex.test(text)) return 'ko';
    
    return 'en';
  }
}