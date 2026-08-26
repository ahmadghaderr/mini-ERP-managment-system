import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  createChatSession,
  listChatSessions,
  getSessionMessages,
  sendSessionMessage,
} from "../../services/chatbot-service";
import { getApiErrorMessage } from "../../lib/apiError";
import type { ChatMessage } from "../../types/chatbot";
import MarkdownMessage from "./MarkdownMessage";
import "./chatbot.css";

export default function ChatWidget() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionReady, setSessionReady] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const sessionId = useRef<string | null>(null);

  // Resume the most recent session, or start a new one, on first mount
  useEffect(() => {
    async function initSession() {
      try {
        const sessions = await listChatSessions();
        let activeId: string;

        if (sessions.length > 0) {
          // Most recently updated session first
          const latest = [...sessions].sort(
            (a, b) =>
              new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
          )[0];
          activeId = latest.id;
          const history = await getSessionMessages(activeId);
          setMessages(history);
        } else {
          const created = await createChatSession();
          activeId = created.id;
        }

        sessionId.current = activeId;
        setSessionReady(true);
      } catch (err) {
        setError(getApiErrorMessage(err));
      }
    }

    initSession();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  async function handleSend() {
    const trimmed = input.trim();
    if (!trimmed || sending || !sessionId.current) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      chatSessionId: sessionId.current,
      role: "user",
      text: trimmed,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setSending(true);
    setError(null);

    try {
      const result = await sendSessionMessage(sessionId.current, trimmed);
      const botMessage: ChatMessage = {
        id: crypto.randomUUID(),
        chatSessionId: sessionId.current,
        role: "assistant",
        text: result.reply,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="chat-widget-root">
      {isOpen && (
        <div className="chat-panel">
          <div className="chat-panel-header">
            <span>{t("chatbot.widgetTitle")}</span>
            <button
              className="chat-close-btn"
              onClick={() => setIsOpen(false)}
              aria-label={t("common.close")}
            >
              &times;
            </button>
          </div>

          <div className="chat-messages" ref={scrollRef}>
            {messages.length === 0 && (
              <div className="chat-empty-state">
                {t("chatbot.askAnything")}
              </div>
            )}
            {messages.map((m) => (
              <div
                key={m.id}
                className={`chat-message chat-message--${m.role}`}
              >
                <MarkdownMessage text={m.text} />
              </div>
            ))}
            {sending && (
              <div className="chat-message chat-message--assistant chat-message--pending">
                {t("common.loading")}...
              </div>
            )}
          </div>

          {error && <div className="chat-error">{error}</div>}

          <div className="chat-input-row">
            <textarea
              className="chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t("chatbot.inputPlaceholder")}
              rows={1}
              disabled={sending || !sessionReady}
            />
            <button
              className="chat-send-btn"
              onClick={handleSend}
              disabled={sending || !sessionReady || !input.trim()}
            >
              Send
            </button>
          </div>
        </div>
      )}

      <button
        className="chat-toggle-btn"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Toggle chat"
      >
        {isOpen ? "×" : "💬"}
      </button>
    </div>
  );
}