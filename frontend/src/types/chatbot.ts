export interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  chatSessionId: string;
  role: "user" | "assistant";
  text: string;
  createdAt: string;
}