import { generateText, streamText } from "ai";
import { xai } from "@ai-sdk/xai";
import { createOpenAI } from "@ai-sdk/openai";
import { getSettings } from "@/stores/settings";

export const getAIModel = () => {
  const settings = getSettings();
  
  if (!settings.apiKey) {
    throw new Error("API密钥未配置，请在设置中配置API密钥");
  }

  switch (settings.provider) {
    case "xai":
      // xAI SDK expects API key to be set via environment variable
      process.env.XAI_API_KEY = settings.apiKey;
      return xai(settings.model || "grok-beta");
    case "dashscope":
      const dashscope = createOpenAI({
        baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
        apiKey: settings.apiKey,
      });
      return dashscope(settings.model || "qwen-plus");
    default:
      throw new Error(`不支持的AI提供商: ${settings.provider}`);
  }
};

export async function generateAIResponse(prompt: string, systemPrompt?: string): Promise<string> {
  try {
    const { text } = await generateText({
      model: getAIModel(),
      prompt,
      system: systemPrompt,
    });
    return text;
  } catch (error) {
    console.error("Error generating AI response:", error);
    throw error;
  }
}

export async function* streamAIResponse(prompt: string, systemPrompt?: string) {
  try {
    const settings = getSettings();
    
    // Check if we need to search web first
    const searchKeywords = ['搜索', 'search', '查找', '最新', 'latest', '新闻', 'news'];
    const shouldSearch = searchKeywords.some(keyword => 
      prompt.toLowerCase().includes(keyword.toLowerCase())
    );
    
    let enhancedPrompt = prompt;
    if (shouldSearch && settings.provider === 'dashscope') {
      enhancedPrompt = `${prompt}\n\n注意：如果需要搜索网络信息，请使用搜索功能获取最新信息。`;
    }
    
    const { textStream } = await streamText({
      model: getAIModel(),
      prompt: enhancedPrompt,
      system: systemPrompt,
    });
    
    for await (const textPart of textStream) {
      yield textPart;
    }
  } catch (error) {
    console.error("Error streaming AI response:", error);
    throw error;
  }
}