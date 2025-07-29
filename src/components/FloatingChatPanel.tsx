import React, { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Minimize2, Maximize2 } from 'lucide-react';
import { PromptInputBox } from "@/components/ui/ai-prompt-box";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
  files?: File[];
}

interface FloatingChatPanelProps {
  className?: string;
}

export interface FloatingChatPanelRef {
  addPromptText: (text: string) => void;
}

export const FloatingChatPanel = React.forwardRef<FloatingChatPanelRef, FloatingChatPanelProps>(
  ({ className }, ref) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [pendingPrompt, setPendingPrompt] = useState<string>("");
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
      scrollToBottom();
    }, [messages]);

    React.useImperativeHandle(ref, () => ({
      addPromptText: (text: string) => {
        setPendingPrompt(text);
        setIsOpen(true);
        setIsMinimized(false);
      },
    }));

    const handleSendMessage = async (content: string, files?: File[]) => {
      const userMessage: Message = {
        id: Date.now().toString(),
        content,
        role: "user",
        timestamp: new Date(),
        files,
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      // Simulate AI response
      setTimeout(() => {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: "这是一个模拟的AI回复。在实际应用中，这里会调用真实的AI服务。",
          role: "assistant",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
        setIsLoading(false);
      }, 1000);
    };

    // Floating button when closed
    if (!isOpen) {
      return (
        <button
          onClick={() => setIsOpen(true)}
          className={cn(
            "fixed bottom-6 right-6 z-50",
            "w-14 h-14 rounded-full",
            "bg-blue-600 hover:bg-blue-700",
            "text-white shadow-lg",
            "flex items-center justify-center",
            "transition-all duration-200",
            "hover:scale-110",
            className
          )}
          title="打开对话"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      );
    }

    // Minimized state
    if (isMinimized) {
      return (
        <div className="fixed bottom-6 right-6 z-50 bg-white rounded-2xl shadow-xl p-3 flex items-center gap-3">
          <MessageCircle className="w-5 h-5 text-blue-600" />
          <span className="text-sm font-medium">对话助手</span>
          <button
            onClick={() => setIsMinimized(false)}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            title="展开"
          >
            <Maximize2 className="w-4 h-4 text-gray-500" />
          </button>
          <button
            onClick={() => {
              setIsOpen(false);
              setIsMinimized(false);
            }}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            title="关闭"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      );
    }

    // Full chat panel
    return (
      <div
        className={cn(
          "fixed bottom-6 right-6 z-50",
          "w-96 h-[600px] max-h-[80vh]",
          "bg-white rounded-2xl shadow-2xl",
          "flex flex-col",
          "transition-all duration-300",
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-blue-600" />
            <span className="font-medium">对话助手</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsMinimized(true)}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              title="最小化"
            >
              <Minimize2 className="w-4 h-4 text-gray-500" />
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              title="关闭"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 && (
            <div className="text-center text-gray-500 mt-8">
              <p className="text-sm">有什么可以帮助您的吗？</p>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "p-3 rounded-xl text-sm",
                message.role === "user"
                  ? "bg-blue-600 text-white ml-8"
                  : "bg-gray-100 text-gray-900 mr-8"
              )}
            >
              <div className="break-words">{message.content}</div>
              {message.files && message.files.length > 0 && (
                <div className="mt-2 space-y-1">
                  {message.files.map((file, index) => (
                    <div key={index} className="text-xs opacity-80">
                      📎 {file.name}
                    </div>
                  ))}
                </div>
              )}
              <div className={cn(
                "text-xs mt-1",
                message.role === "user" ? "text-blue-200" : "text-gray-500"
              )}>
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-200">
          <PromptInputBox
            onSend={handleSendMessage}
            isLoading={isLoading}
            placeholder="输入您的问题..."
            className="max-w-full"
            initialValue={pendingPrompt}
            onInputChange={() => setPendingPrompt("")}
          />
        </div>
      </div>
    );
  }
);

FloatingChatPanel.displayName = 'FloatingChatPanel';