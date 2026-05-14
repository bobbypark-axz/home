"use client";

import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { CloseIcon } from "./icons";

function MessageBubble({ message }: { message: UIMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={`chat-msg ${isUser ? "user" : "ai"}`}>
      <div className="chat-bubble">
        {message.parts.map((part, i) =>
          part.type === "text" ? <span key={i}>{part.text}</span> : null,
        )}
      </div>
    </div>
  );
}

export function FloatingChat({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, status]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || status !== "ready") return;
    sendMessage({ text: trimmed });
    setInput("");
  };

  return (
    <>
      {!open && (
        <button
          className="chat-fab"
          onClick={() => onOpenChange(true)}
          aria-label="AI 챗봇 열기"
        >
          <span className="chat-fab-icon" aria-hidden>💬</span>
          <span>AI 자격 상담</span>
        </button>
      )}
      {open && (
        <div className="chat-panel">
          <header className="chat-header">
            <div className="chat-header-title">
              <span className="chat-header-spark" aria-hidden>✨</span>
              <strong>둥지 AI</strong>
              <span className="chat-header-sub">공공임대 자격 안내</span>
            </div>
            <button className="chat-close" onClick={() => onOpenChange(false)} aria-label="닫기">
              <CloseIcon size={16} />
            </button>
          </header>
          <div className="chat-body" ref={scrollRef}>
            {messages.length === 0 && (
              <div className="chat-empty">
                <p className="chat-empty-title">안녕하세요 👋</p>
                <p className="chat-empty-sub">
                  지금 상황을 알려주시면 어떤 공공임대/분양에 지원 가능한지 안내해드릴게요.
                </p>
                <div className="chat-suggestions">
                  {[
                    "28살 청년 1인가구인데 어디 지원 가능해?",
                    "신혼부부 무자녀, 월 소득 400만원이에요",
                    "행복주택과 국민임대 차이가 뭐예요?",
                  ].map((q) => (
                    <button
                      key={q}
                      className="chat-suggest"
                      onClick={() => sendMessage({ text: q })}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m) => (
              <MessageBubble key={m.id} message={m} />
            ))}
            {status === "submitted" && (
              <div className="chat-msg ai">
                <div className="chat-bubble chat-typing">
                  <span /><span /><span />
                </div>
              </div>
            )}
          </div>
          <form className="chat-input-row" onSubmit={handleSubmit}>
            <input
              className="chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="자격 조건을 알려주세요…"
              disabled={status !== "ready" && status !== "error"}
            />
            <button
              type="submit"
              className="chat-send"
              disabled={!input.trim() || status === "submitted" || status === "streaming"}
              aria-label="전송"
            >
              ↑
            </button>
          </form>
        </div>
      )}
    </>
  );
}
