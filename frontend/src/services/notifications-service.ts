import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL;

function authHeaders() {
  const token = localStorage.getItem("accessToken");
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function getVapidPublicKey(): Promise<string> {
  const response = await axios.get(`${API_BASE}/notifications/vapid-public-key`, {
    headers: authHeaders(),
  });
  return response.data.publicKey;
}

export async function subscribeToPush(subscription: PushSubscriptionJSON): Promise<void> {
  await axios.post(`${API_BASE}/notifications/subscribe`, subscription, {
    headers: { ...authHeaders(), "Content-Type": "application/json" },
  });
}

export async function unsubscribeFromPush(endpoint: string): Promise<void> {
  await axios.delete(`${API_BASE}/notifications/subscribe`, {
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    data: { endpoint },
  });
}