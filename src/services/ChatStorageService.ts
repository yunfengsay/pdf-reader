interface ChatSession {
  id: string;
  pdfKey: string;
  messages: any[];
  createdAt: Date;
  updatedAt: Date;
}

export class ChatStorageService {
  private static STORAGE_KEY = 'pdf-reader-chat-sessions';

  static saveChatSession(pdfKey: string, messages: any[]): void {
    try {
      const sessions = this.getAllSessions();
      const sessionId = `${pdfKey}-${Date.now()}`;
      
      const newSession: ChatSession = {
        id: sessionId,
        pdfKey,
        messages,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      sessions[sessionId] = newSession;
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(sessions));
    } catch (error) {
      console.error('Error saving chat session:', error);
    }
  }

  static updateChatSession(sessionId: string, messages: any[]): void {
    try {
      const sessions = this.getAllSessions();
      if (sessions[sessionId]) {
        sessions[sessionId].messages = messages;
        sessions[sessionId].updatedAt = new Date();
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(sessions));
      }
    } catch (error) {
      console.error('Error updating chat session:', error);
    }
  }

  static getChatSessions(pdfKey: string): ChatSession[] {
    try {
      const sessions = this.getAllSessions();
      return Object.values(sessions).filter(session => session.pdfKey === pdfKey);
    } catch (error) {
      console.error('Error getting chat sessions:', error);
      return [];
    }
  }

  static deleteChatSession(sessionId: string): void {
    try {
      const sessions = this.getAllSessions();
      delete sessions[sessionId];
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(sessions));
    } catch (error) {
      console.error('Error deleting chat session:', error);
    }
  }

  private static getAllSessions(): Record<string, ChatSession> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Error loading chat sessions:', error);
      return {};
    }
  }
}