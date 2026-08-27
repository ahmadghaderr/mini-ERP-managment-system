import axios from "axios";
import type { ChatSession, ChatMessage } from "../types/chatbot";

const API_BASE = import.meta.env.VITE_API_URL;

function authHeaders() {
  const token = localStorage.getItem("accessToken");
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function createChatSession(): Promise<ChatSession> {
  const response = await axios.post(
    `${API_BASE}/chatbot/sessions`,
    {},
    { headers: authHeaders() },
  );
  return response.data;
}

export async function listChatSessions(): Promise<ChatSession[]> {
  const response = await axios.get(`${API_BASE}/chatbot/sessions`, {
    headers: authHeaders(),
  });
  return response.data;
}

export async function getSessionMessages(sessionId: string): Promise<ChatMessage[]> {
  const response = await axios.get(
    `${API_BASE}/chatbot/sessions/${sessionId}/messages`,
    { headers: authHeaders() },
  );
  return response.data;
}

export async function sendSessionMessage(
  sessionId: string,
  message: string,
): Promise<{ reply: string }> {
  const response = await axios.post(
    `${API_BASE}/chatbot/sessions/${sessionId}/messages`,
    { message },
    { headers: { ...authHeaders(), "Content-Type": "application/json" } },
  );
  return response.data;
}

interface StreamHandlers {
  onThinkingDelta: (delta: string) => void;
  onTextDelta: (delta: string) => void;
  onDone: () => void;
  onError: (message: string) => void;
}

export async function streamSessionMessage(
  sessionId: string,
  message: string,
  handlers: StreamHandlers,
): Promise<void> {
  let response: Response;
  try {
    response = await fetch(
      `${API_BASE}/chatbot/sessions/${sessionId}/messages/stream`,
      {
        method: "POST",
        headers: {
          ...authHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message }),
      },
    );
  } catch {
    handlers.onError("Could not reach the chatbot service.");
    return;
  }

  if (!response.ok || !response.body) {
    handlers.onError(`Chatbot request failed (${response.status}).`);
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const jsonStr = trimmed.replace(/^data:\s*/, "").trim();
      if (!jsonStr) continue;

      try {
        const parsed = JSON.parse(jsonStr);
        if (parsed.type === "thinking") {
          handlers.onThinkingDelta(parsed.delta);
        } else if (parsed.type === "text") {
          handlers.onTextDelta(parsed.delta);
        } else if (parsed.type === "done") {
          handlers.onDone();
        } else if (parsed.type === "error") {
          handlers.onError(parsed.message || "Chatbot request failed.");
        }
      } catch {
        continue;
      }
    }
  }
}

export async function deleteChatSession(sessionId: string): Promise<void> {
  await axios.delete(`${API_BASE}/chatbot/sessions/${sessionId}`, {
    headers: authHeaders(),
  });
}