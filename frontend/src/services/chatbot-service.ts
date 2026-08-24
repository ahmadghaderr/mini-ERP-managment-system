import axios from "axios";
import type { ChatSession, ChatMessage } from "../types/chatbot";

const API_BASE = "http://localhost:3001";

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

export async function deleteChatSession(sessionId: string): Promise<void> {
  await axios.delete(`${API_BASE}/chatbot/sessions/${sessionId}`, {
    headers: authHeaders(),
  });
}