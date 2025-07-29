import React, { useState, useRef, useEffect } from "react";
import { PromptInputBox } from "@/components/ui/ai-prompt-box";
import { cn } from "@/lib/utils";
import { streamAIResponse } from "@/services/ai";
import { SettingsDialog } from "@/components/SettingsDialog";
import { MessageContent } from "@/components/MessageContent";
import { RefreshCw } from "lucide-react";
import { ChatStorageService } from "@/services/ChatStorageService";

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
  files?: File[];
  isGenerating?: boolean;
}

interface ChatPanelProps {
  className?: string;
  onPromptReceived?: (text: string) => void;
  onClose?: () => void;
  pdfContent?: string;
  fileName?: string;
  pdfKey?: string;
}

export interface ChatPanelRef {
  addPromptText: (text: string) => void;
}

export const ChatPanel = React.forwardRef<ChatPanelRef, ChatPanelProps>(
  ({ className, onPromptReceived, onClose, pdfContent, fileName, pdfKey }, ref) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [pendingPrompt, setPendingPrompt] = useState<string>("");
    const [sessionId, setSessionId] = useState<string | null>(null);

    const scrollToBottom = () => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
      scrollToBottom();
    }, [messages]);
    
    // Save messages when they change
    useEffect(() => {
      if (pdfKey && messages.length > 0) {
        if (!sessionId) {
          const newSessionId = `${pdfKey}-${Date.now()}`;
          setSessionId(newSessionId);
          ChatStorageService.saveChatSession(pdfKey, messages);
        } else {
          ChatStorageService.updateChatSession(sessionId, messages);
        }
      }
    }, [messages, pdfKey, sessionId]);

    React.useImperativeHandle(ref, () => ({
      addPromptText: (text: string) => {
        setPendingPrompt(text);
      },
    }));

    const handleRegenerateMessage = async (messageId: string) => {
      const messageIndex = messages.findIndex(msg => msg.id === messageId);
      if (messageIndex === -1) return;
      
      // Find the previous user message
      let userMessage: Message | undefined;
      for (let i = messageIndex - 1; i >= 0; i--) {
        if (messages[i].role === "user") {
          userMessage = messages[i];
          break;
        }
      }
      
      if (!userMessage) return;
      
      // Remove the current assistant message and regenerate
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
      await handleSendMessage(userMessage.content, userMessage.files, true);
    };

    const handleSendMessage = async (content: string, files?: File[], isRegenerate = false) => {
      const userMessage: Message = {
        id: Date.now().toString(),
        content,
        role: "user",
        timestamp: new Date(),
        files,
      };

      if (!isRegenerate) {
        setMessages((prev) => [...prev, userMessage]);
      }
      setIsLoading(true);

      try {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: "",
          role: "assistant",
          timestamp: new Date(),
          isGenerating: true,
        };
        
        setMessages((prev) => [...prev, assistantMessage]);
        
        // Create system prompt with PDF content
        let systemPrompt = "你是一个PDF阅读助手，帮助用户理解和分析PDF文档内容。";
        
        if (pdfContent && messages.length === 1) { // Only include full content on first message
          systemPrompt += `\n\n当前正在阅读的PDF文档${fileName ? `(${fileName})` : ''}的完整内容如下：\n\n${pdfContent}\n\n请基于以上文档内容回答用户的问题。`;
        } else if (fileName) {
          systemPrompt += `\n\n当前正在阅读的PDF文档：${fileName}`;
        }
        
        let fullContent = "";
        for await (const textPart of streamAIResponse(content, systemPrompt)) {
          fullContent += textPart;
          setMessages((prev) => 
            prev.map((msg) => 
              msg.id === assistantMessage.id 
                ? { ...msg, content: fullContent, isGenerating: true }
                : msg
            )
          );
        }
        // Mark as complete
        setMessages((prev) => 
          prev.map((msg) => 
            msg.id === assistantMessage.id 
              ? { ...msg, isGenerating: false }
              : msg
          )
        );
      } catch (error) {
        console.error("Error getting AI response:", error);
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: error instanceof Error ? `错误: ${error.message}` : "抱歉，获取AI响应时出错。",
          role: "assistant",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    };

    return (
      <div
        className={cn(
          "flex flex-col h-full bg-gray-50 border-l border-gray-200",
          className,
        )}
      >
        <div className="p-4 border-b border-gray-200 bg-white flex items-center justify-between">
          <h2 className="text-lg font-semibold">对话与笔记</h2>
          <div className="flex items-center gap-2">
            <SettingsDialog />
            {onClose && (
              <button
                onClick={onClose}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                title="关闭"
              >
                <svg
                  className="w-5 h-5 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-gray-500 mt-8">
              <p>开始对话或添加笔记</p>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "p-3 rounded-lg",
                message.role === "user"
                  ? "bg-blue-50 ml-8"
                  : "bg-white border border-gray-200 mr-8",
              )}
            >
              <div className="text-gray-900">
                {message.isGenerating && !message.content ? (
                  <div className="flex items-center gap-2 text-gray-500">
                    <div className="animate-pulse">生成中...</div>
                  </div>
                ) : (
                  <MessageContent content={message.content} role={message.role} />
                )}
              </div>
              {message.files && message.files.length > 0 && (
                <div className="mt-2 space-y-1">
                  {message.files.map((file, index) => (
                    <div key={index} className="text-sm text-gray-600">
                      📎 {file.name}
                    </div>
                  ))}
                </div>
              )}
              <div className="flex items-center justify-between mt-2">
                <div className="text-xs text-gray-500">
                  {message.timestamp.toLocaleTimeString()}
                </div>
                {message.role === "assistant" && !message.isGenerating && (
                  <button
                    onClick={() => handleRegenerateMessage(message.id)}
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                    title="重新生成"
                  >
                    <RefreshCw className="w-3 h-3 text-gray-500" />
                  </button>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-gray-200 bg-white">
          <PromptInputBox
            onSend={handleSendMessage}
            isLoading={isLoading}
            placeholder="输入您的问题或笔记..."
            className="max-w-full"
            initialValue={pendingPrompt}
            onInputChange={() => setPendingPrompt("")}
          />
        </div>
      </div>
    );
  },
);

