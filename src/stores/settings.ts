export type AIProvider = "xai" | "dashscope";

export interface AISettings {
  provider: AIProvider;
  apiKey: string;
  model?: string;
}

const SETTINGS_KEY = "pdf-reader-ai-settings";

export const defaultSettings: AISettings = {
  provider: "dashscope",
  apiKey: "",
  model: "qwen-plus"
};

export function getSettings(): AISettings {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      return { ...defaultSettings, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.error("Error loading settings:", error);
  }
  return defaultSettings;
}

export function saveSettings(settings: AISettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error("Error saving settings:", error);
  }
}

export function clearSettings(): void {
  try {
    localStorage.removeItem(SETTINGS_KEY);
  } catch (error) {
    console.error("Error clearing settings:", error);
  }
}