import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import "./chatbot.css";
import MarkdownMessage from "./MarkdownMessage";
import {
  createChatSession,
  listChatSessions,
  getSessionMessages,
  sendSessionMessage,
  deleteChatSession,
} from "../../services/chatbot-service";
import { getApiErrorMessage } from "../../lib/apiError";
import type { ChatSession, ChatMessage } from "../../types/chatbot";
import i18n from "../../i18n/config";

function formatTime(iso: string, language: string): string {
  const locale = language === "ar" ? "ar-LB-u-nu-latn" : "en-US";
  return new Date(iso).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
}

export default function ChatPage() {
  const { t } = useTranslation();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, sending]);

  async function loadSessions(selectId?: string) {
    setLoadingSessions(true);
    try {
      const data = await listChatSessions();
      setSessions(data);
      if (selectId) {
        setActiveSessionId(selectId);
      } else if (!activeSessionId && data.length > 0) {
        setActiveSessionId(data[0].id);
      }
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoadingSessions(false);
    }
  }

  useEffect(() => {
    if (!activeSessionId) {
      setMessages([]);
      return;
    }
    setLoadingMessages(true);
    getSessionMessages(activeSessionId)
      .then((data) => setMessages(data))
      .catch((err) => setError(getApiErrorMessage(err)))
      .finally(() => setLoadingMessages(false));
  }, [activeSessionId]);

  async function handleNewSession() {
    setError(null);
    try {
      const session = await createChatSession();
      setSessions((prev) => [session, ...prev]);
      setActiveSessionId(session.id);
      setMessages([]);
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  }

  async function handleDeleteSession(e: React.MouseEvent, sessionId: string) {
    e.stopPropagation();
    if (!confirm("Delete this conversation? This cannot be undone.")) return;

    setDeletingId(sessionId);
    setError(null);
    try {
      await deleteChatSession(sessionId);
      const remaining = sessions.filter((s) => s.id !== sessionId);
      setSessions(remaining);

      if (activeSessionId === sessionId) {
        if (remaining.length > 0) {
          setActiveSessionId(remaining[0].id);
        } else {
          setActiveSessionId(null);
          setMessages([]);
        }
      }
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setDeletingId(null);
    }
  }

  async function handleSend() {
    const trimmed = input.trim();
    if (!trimmed || sending || !activeSessionId) return;

    const optimisticUserMessage: ChatMessage = {
      id: crypto.randomUUID(),
      chatSessionId: activeSessionId,
      role: "user",
      text: trimmed,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticUserMessage]);
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setSending(true);
    setError(null);

    try {
      const result = await sendSessionMessage(activeSessionId, trimmed);
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        chatSessionId: activeSessionId,
        role: "assistant",
        text: result.reply,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      loadSessions(activeSessionId);
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

  function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }

  const activeSession = sessions.find((s) => s.id === activeSessionId);

  return (
    <div className="chat-pg">
      <div className="chat-sidebar">
        <button className="chat-new-session-btn" onClick={handleNewSession}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          {t("chatbot.newSession")}
        </button>

        <div className="chat-session-list">
          {loadingSessions ? (
            <div className="chat-session-empty">{t("common.loading")}...</div>
          ) : sessions.length === 0 ? (
            <div className="chat-session-empty">{t("chatbot.noConversations")}</div>
          ) : (
            sessions.map((s) => (
              <div
                key={s.id}
                className={`chat-session-item ${
                  s.id === activeSessionId ? "chat-session-item--active" : ""
                }`}
                onClick={() => setActiveSessionId(s.id)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="chat-session-item-icon">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 00 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                </svg>
                <span className="chat-session-item-title">{s.title}</span>
                <button
                  className="chat-session-delete-btn"
                  onClick={(e) => handleDeleteSession(e, s.id)}
                  disabled={deletingId === s.id}
                  aria-label="Delete conversation"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    <line x1="10" y1="11" x2="10" y2="17" />
                    <line x1="14" y1="11" x2="14" y2="17" />
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="chat-main">
        {activeSession && (
          <div className="chat-header">
            <div className="chat-header-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
              </svg>
            </div>
            <div className="chat-header-title">{activeSession.title}</div>
          </div>
        )}

        {error && <div className="chat-error-banner">{error}</div>}

        {!activeSessionId ? (
          <div className="chat-no-session">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="chat-no-session-icon">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
            </svg>
            <p>{t("chatbot.selectOrStart")}</p>
          </div>
        ) : (
          <>
            <div className="chat-messages-area" ref={scrollRef}>
              {loadingMessages ? (
                <div className="chat-session-empty">{t("chatbot.loadingMessages")}</div>
              ) : messages.length === 0 ? (
                <div className="chat-empty-conversation">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="chat-empty-icon">
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.380 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                  </svg>
                  <p>{t("chatbot.askAnything")}</p>
                </div>
              ) : (
                messages.map((m) => (
                  <div key={m.id} className={`chat-row chat-row--${m.role}`}>
                    {m.role === "assistant" && (
                      <div className="chat-avatar chat-avatar--bot">🤖</div>
                    )}
                    <div className="chat-msg-group">
                      <div className={`chat-msg chat-msg--${m.role}`}>
                        <MarkdownMessage text={m.text} />
                      </div>
                      <span className={`chat-msg-time chat-msg-time--${m.role}`}>
                        {formatTime(m.createdAt, i18n.language)}
                      </span>
                    </div>
                    {m.role === "user" && (
                      <div className="chat-avatar chat-avatar--user">You</div>
                    )}
                  </div>
                ))
              )}
              {sending && (
                <div className="chat-row chat-row--assistant">
                  <div className="chat-avatar chat-avatar--bot">🤖</div>
                  <div className="chat-msg-group">
                    <div className="chat-msg chat-msg--assistant chat-typing">
                      <span className="chat-typing-dot" />
                      <span className="chat-typing-dot" />
                      <span className="chat-typing-dot" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="chat-input-row">
              <textarea
                ref={textareaRef}
                className="chat-input"
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={t("chatbot.inputPlaceholder")}
                rows={1}
                disabled={sending}
              />
              <button
                className="chat-send-btn"
                onClick={handleSend}
                disabled={sending || !input.trim()}
                aria-label="Send message"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}