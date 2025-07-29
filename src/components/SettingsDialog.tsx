import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Settings } from "lucide-react";
import {
  getSettings,
  saveSettings,
  type AISettings,
  type AIProvider,
} from "@/stores/settings";

interface SettingsDialogProps {
  onSettingsChange?: () => void;
}

export function SettingsDialog({ onSettingsChange }: SettingsDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState<AISettings>(getSettings());
  const [tempSettings, setTempSettings] = useState<AISettings>(settings);

  useEffect(() => {
    if (isOpen) {
      const currentSettings = getSettings();
      setSettings(currentSettings);
      setTempSettings(currentSettings);
    }
  }, [isOpen]);

  const handleSave = () => {
    saveSettings(tempSettings);
    setSettings(tempSettings);
    setIsOpen(false);
    onSettingsChange?.();
  };

  const handleCancel = () => {
    setTempSettings(settings);
    setIsOpen(false);
  };

  const getModelOptions = (provider: AIProvider) => {
    switch (provider) {
      case "dashscope":
        return [
          {
            value: "qwen3-235b-a22b-thinking-2507",
            label: "qwen3-235b-a22b-thinking-2507",
          },
          { value: "qwen-plus", label: "通义千问-Plus" },
          { value: "qwen-turbo", label: "通义千问-Turbo" },
          { value: "qwen-max", label: "通义千问-Max" },
        ];
      case "xai":
        return [
          { value: "grok-beta", label: "Grok Beta" },
          { value: "grok-2", label: "Grok 2" },
        ];
      default:
        return [];
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title="设置"
        >
          <Settings className="w-5 h-5 text-gray-600" />
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>AI 设置</DialogTitle>
          <DialogDescription>配置 AI 服务提供商和 API 密钥</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">AI 提供商</label>
            <select
              value={tempSettings.provider}
              onChange={(e) => {
                const provider = e.target.value as AIProvider;
                const modelOptions = getModelOptions(provider);
                setTempSettings({
                  ...tempSettings,
                  provider,
                  model: modelOptions[0]?.value || "",
                });
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="dashscope">百炼平台 (DashScope)</option>
              <option value="xai">xAI (Grok)</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">模型</label>
            <select
              value={tempSettings.model}
              onChange={(e) =>
                setTempSettings({ ...tempSettings, model: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {getModelOptions(tempSettings.provider).map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">API 密钥</label>
            <input
              type="password"
              value={tempSettings.apiKey}
              onChange={(e) =>
                setTempSettings({ ...tempSettings, apiKey: e.target.value })
              }
              placeholder={
                tempSettings.provider === "dashscope"
                  ? "请输入 DashScope API Key"
                  : "请输入 xAI API Key"
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500">
              {tempSettings.provider === "dashscope" ? (
                <>
                  在{" "}
                  <a
                    href="https://dashscope.console.aliyun.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    DashScope 控制台
                  </a>{" "}
                  获取 API Key
                </>
              ) : (
                <>
                  在{" "}
                  <a
                    href="https://x.ai/api"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    xAI 平台
                  </a>{" "}
                  获取 API Key
                </>
              )}
            </p>
          </div>
        </div>
        <div className="flex justify-end space-x-2">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-500 text-white hover:bg-blue-600 rounded-md transition-colors"
          >
            保存
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

