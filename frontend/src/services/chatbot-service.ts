import axios from "axios";
import type { SendChatMessageResponse } from "../types/chatbot";

const API_BASE = import.meta.env.VITE_API_URL;

function authHeaders() {
  const token = localStorage.getItem("accessToken");
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function sendChatMessage(
  message: string,
  sessionId: string,
): Promise<SendChatMessageResponse> {
  const response = await axios.post(
    `${API_BASE}/chatbot/message`,
    { message, sessionId },
    { headers: { ...authHeaders(), "Content-Type": "application/json" } },
  );
  return response.data;
}
