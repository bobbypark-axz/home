"use client";

import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import ReactMarkdown from "react-markdown";
import { CloseIcon } from "./icons";

function MessageBubble({ message }: { message: UIMessage }) {
  const isUser = message.role === "user";
  const text = message.parts
    .map((p) => (p.type === "text" ? p.text : ""))
    .join("");
  return (
    <div className={`chat-msg ${isUser ? "user" : "ai"}`}>
      <div className="chat-bubble">
        {isUser ? (
          text
        ) : (
          <ReactMarkdown
            components={{
              p: ({ children }) => <p className="chat-md-p">{children}</p>,
              strong: ({ children }) => <strong className="chat-md-strong">{children}</strong>,
              ul: ({ children }) => <ul className="chat-md-ul">{children}</ul>,
              ol: ({ children }) => <ol className="chat-md-ol">{children}</ol>,
              li: ({ children }) => <li className="chat-md-li">{children}</li>,
              h1: ({ children }) => <strong className="chat-md-strong">{children}</strong>,
              h2: ({ children }) => <strong className="chat-md-strong">{children}</strong>,
              h3: ({ children }) => <strong className="chat-md-strong">{children}</strong>,
              hr: () => <hr className="chat-md-hr" />,
              code: ({ children }) => <code className="chat-md-code">{children}</code>,
              a: ({ children, href }) => (
                <a href={href} target="_blank" rel="noreferrer" className="chat-md-a">
                  {children}
                </a>
              ),
            }}
          >
            {text}
          </ReactMarkdown>
        )}
      </div>
    </div>
  );
}

export function FloatingChat({
  open,
  onOpenChange,
  shifted = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shifted?: boolean;
}) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status, setMessages } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  const handleClose = () => {
    onOpenChange(false);
    setMessages([]);
    setInput("");
  };

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
          className={`chat-fab ${shifted ? "shifted" : ""}`}
          onClick={() => onOpenChange(true)}
          aria-label="AI 챗봇 열기"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/ai-icon.svg" alt="" className="chat-fab-icon" />
        </button>
      )}
      {open && (
        <div className={`chat-panel ${shifted ? "shifted" : ""}`}>
          <header className="chat-header">
            <div className="chat-header-title">
              <span className="chat-header-name">AI 자격상담사</span>
              <span className="chat-header-beta">beta</span>
            </div>
            <button className="chat-close" onClick={handleClose} aria-label="닫기">
              <CloseIcon size={16} />
            </button>
          </header>
          <div className="chat-body" ref={scrollRef}>
            {messages.length === 0 && (
              <div className="chat-welcome">
                <div className="chat-welcome-logo" aria-hidden>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/ai-icon.svg" alt="" />
                </div>
                <div className="chat-welcome-lines">
                  <div>안녕하세요!</div>
                  <div>
                    <strong>둥지 AI 상담사</strong>예요 ☺️
                  </div>
                  <div>공공임대·분양 자격이 고민이라면</div>
                  <div>조건에 맞춰 추천해드릴게요.</div>
                </div>
                <div className="chat-questions">
                  <div className="chat-questions-title">많은 분들이 자주 물어보시는 질문이에요.</div>
                  {[
                    "28살 청년 1인가구, 월소득 250만원인데 어디 지원 가능해?",
                    "신혼부부 무자녀, 맞벌이 월 600만원이에요. 행복주택 되나요?",
                    "행복주택과 국민임대 차이가 뭐예요?",
                  ].map((q) => (
                    <button
                      key={q}
                      className="chat-question"
                      onClick={() => sendMessage({ text: q })}
                    >
                      <span className="chat-question-icon" aria-hidden>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/ai-icon.svg" alt="" />
                      </span>
                      <span>{q}</span>
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
            <div className="chat-input-wrap">
              <textarea
                className="chat-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="원하는 조건을 입력해 보세요."
                rows={1}
                maxLength={500}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
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
            </div>
            <p className="chat-disclaimer">
              AI 학습 데이터 기반의 답변으로, 실제와 차이가 있을 수 있습니다.
            </p>
          </form>
        </div>
      )}
    </>
  );
}
