import { useEffect, useState } from "react";
import "./notificationsPage.css";
import {
  fetchMyNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  type AppNotification,
} from "../../services/notifications-service";
import { getApiErrorMessage } from "../../lib/apiError";

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, []);

  function load() {
    setLoading(true);
    fetchMyNotifications()
      .then(setNotifications)
      .catch((err) => setError(getApiErrorMessage(err)))
      .finally(() => setLoading(false));
  }

  async function handleMarkRead(id: string) {
    try {
      await markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  }

  async function handleMarkAllRead() {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="notifpg-pg">
      <div className="notifpg-head">
        <div className="notifpg-title-row">
          <div className="notifpg-title-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </div>
          <div>
            <div className="notifpg-title">Notifications</div>
            <p className="notifpg-subtitle">
              {unreadCount > 0
                ? `${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}`
                : "You're all caught up."}
            </p>
          </div>
        </div>
        {unreadCount > 0 && (
          <button className="notifpg-mark-all-btn" onClick={handleMarkAllRead}>
            Mark all as read
          </button>
        )}
      </div>

      {error && <div className="notifpg-error">{error}</div>}

      <div className="notifpg-card">
        {loading ? (
          <div className="notifpg-empty">Loading...</div>
        ) : notifications.length === 0 ? (
          <div className="notifpg-empty">
            <svg className="notifpg-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            No notifications yet.
          </div>
        ) : (
          <div className="notifpg-list">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`notifpg-item ${!n.isRead ? "notifpg-item--unread" : ""}`}
                onClick={() => !n.isRead && handleMarkRead(n.id)}
              >
                <div className="notifpg-item-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                </div>
                <div className="notifpg-item-body">
                  <span className="notifpg-item-message">{n.message}</span>
                  <span className="notifpg-item-time">{formatDateTime(n.createdAt)}</span>
                </div>
                {!n.isRead && <span className="notifpg-item-dot" />}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}