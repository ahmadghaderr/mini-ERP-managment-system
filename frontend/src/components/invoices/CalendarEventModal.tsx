import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface CalendarEventModalProps {
  success: boolean;
  message: string;
  onClose: () => void;
}

export default function CalendarEventModal({
  success,
  message,
  onClose,
}: CalendarEventModalProps) {
  return (
    <div className="cal-modal-overlay" onClick={onClose}>
      <div className="cal-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cal-modal-header">
          <div
            className={`cal-modal-icon ${success ? "cal-modal-icon--success" : "cal-modal-icon--error"}`}
          >
            {success ? (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            )}
          </div>
          <div className="cal-modal-title">
            {success ? "Invoice confirmed" : "Confirmed, but event failed"}
          </div>
        </div>
        <div className="cal-modal-body">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{message}</ReactMarkdown>
        </div>
        <button className="cal-modal-btn" onClick={onClose}>
          OK
        </button>
      </div>
    </div>
  );
}