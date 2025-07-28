import React, { useState, useRef, useEffect } from 'react';
import { PromptInputBox } from '@/components/ui/ai-prompt-box';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  files?: File[];
}

interface ChatPanelProps {
  className?: string;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ className }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (content: string, files?: File[]) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      role: 'user',
      timestamp: new Date(),
      files,
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: '这是一个模拟的AI回复。在实际应用中，这里会调用真实的AI服务。',
        role: 'assistant',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className={cn("flex flex-col h-full bg-gray-50 border-l border-gray-200", className)}>
      <div className="p-4 border-b border-gray-200 bg-white">
        <h2 className="text-lg font-semibold">对话与笔记</h2>
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
              message.role === 'user'
                ? "bg-blue-50 ml-8"
                : "bg-white border border-gray-200 mr-8"
            )}
          >
            <div className="text-sm font-medium text-gray-700 mb-1">
              {message.role === 'user' ? '你' : 'AI助手'}
            </div>
            <div className="text-gray-900">{message.content}</div>
            {message.files && message.files.length > 0 && (
              <div className="mt-2 space-y-1">
                {message.files.map((file, index) => (
                  <div key={index} className="text-sm text-gray-600">
                    📎 {file.name}
                  </div>
                ))}
              </div>
            )}
            <div className="text-xs text-gray-500 mt-2">
              {message.timestamp.toLocaleTimeString()}
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
        />
      </div>
    </div>
  );
};