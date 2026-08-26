import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchMyNotifications,
  NOTIFICATIONS_CHANGED_EVENT,
} from "../../services/notifications-service";
import "./notifications.css";

const POLL_INTERVAL_MS = 30000;

export default function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  const loadCount = useCallback(() => {
    fetchMyNotifications()
      .then((data) => setUnreadCount(data.filter((n) => !n.isRead).length))
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadCount();
    const interval = setInterval(loadCount, POLL_INTERVAL_MS);
    window.addEventListener(NOTIFICATIONS_CHANGED_EVENT, loadCount);
    return () => {
      clearInterval(interval);
      window.removeEventListener(NOTIFICATIONS_CHANGED_EVENT, loadCount);
    };
  }, [loadCount]);

  return (
    <button
      className="notif-bell-btn"
      onClick={() => navigate("/notifications")}
      aria-label="Notifications"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
      {unreadCount > 0 && <span className="notif-bell-badge">{unreadCount}</span>}
    </button>
  );
}