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

export interface AppNotification {
  id: string;
  type: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export async function fetchMyNotifications(): Promise<AppNotification[]> {
  const response = await axios.get(`${API_BASE}/notifications`, {
    headers: authHeaders(),
  });
  return response.data;
}

export const NOTIFICATIONS_CHANGED_EVENT = "notifications-changed";

function notifyNotificationsChanged() {
  window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED_EVENT));
}

export async function markNotificationRead(id: string): Promise<void> {
  await axios.patch(`${API_BASE}/notifications/${id}/read`, {}, {
    headers: authHeaders(),
  });
  notifyNotificationsChanged();
}

export async function markAllNotificationsRead(): Promise<void> {
  await axios.patch(`${API_BASE}/notifications/read-all`, {}, {
    headers: authHeaders(),
  });
  notifyNotificationsChanged();
}