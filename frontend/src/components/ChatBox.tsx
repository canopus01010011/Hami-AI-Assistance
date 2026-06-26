import { useState, useRef, useEffect } from "react";
import type { Message as MessageType } from "../types/Message";

// ── Mood → emoji mapping (used as fallback if no GIF) ──────────
const MOOD_EMOJI: Record<string, string> = {
  idle: "😊",
  thinking: "🤔",
  working: "💼",
  happy: "🥰",
  warning: "⚠️",
};

// ── Simple markdown-ish renderer (bold **text**) ──────────────
function renderText(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}

function extractImageUrlFromText(text: string): string | undefined {
  const mdMatch = text.match(/!\[[^\]]*\]\((https?:\/\/[^\s)]+)\)/i);
  if (mdMatch?.[1]) return mdMatch[1];
  const urlMatch = text.match(/https?:\/\/[^\s]+\.(png|jpe?g|gif|webp|svg)/i);
  return urlMatch?.[0];
}

function sanitizeReplyText(text: string): string {
  return text.replace(/!\[[^\]]*\]\((?:https?:\/\/[^\s)]+)?\)/g, "").trim();
}

interface Props {
  hamiGif?: string;
}

export default function ChatBox({ hamiGif }: Props) {
  const [messages, setMessages] = useState<MessageType[]>([
    { sender: "hami", text: "Hi there! I'm Hami 🐹 I can help you track events, deadlines, and reminders. Just tell me what's on your schedule!" },
  ]);
  const [input, setInput] = useState("");
  const [currentMood, setCurrentMood] = useState("idle");
  const [isLoading, setIsLoading] = useState(false);
  const [bubbleText, setBubbleText] = useState("Hi there! I'm Hami 🐹");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Keep bubble text synced to last hami message
  useEffect(() => {
    const hamiMsgs = messages.filter(m => m.sender === "hami");
    if (hamiMsgs.length > 0) {
      const last = hamiMsgs[hamiMsgs.length - 1].text;
      // Trim for bubble (max ~120 chars)
      setBubbleText(last.length > 120 ? last.slice(0, 117) + "…" : last);
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    const userText = input.trim();
    setInput("");
    setIsLoading(true);
    setCurrentMood("thinking");
    setBubbleText("Hmm, let me think… 🤔");

    setMessages(prev => [...prev, { sender: "user", text: userText }]);

    try {
      const res = await fetch("http://127.0.0.1:8000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userText }),
      });

      const data = await res.json();
      console.log("SERVER RESPONSE:", data);
      const rawReply = String(data.reply || "");
      const replyImageUrl = data.image_url ?? data.imageUrl ?? data.image ?? extractImageUrlFromText(rawReply);
      const cleanReply = sanitizeReplyText(rawReply);
      const displayText = cleanReply || (replyImageUrl ? "Here is a cute image for you!" : rawReply || "Here you go!");
      setCurrentMood(data.mood || "idle");
      setMessages(prev => [...prev, {
        sender: "hami",
        text: displayText,
        imageUrl: replyImageUrl,
        image_url: replyImageUrl,
        image: replyImageUrl,
      }] );
    if (data.audio) {
    const audio = new Audio(
        `http://127.0.0.1:8000/${data.audio}`
    );

    audio.play().catch(err => {
        console.error(err);
    });
}
    } catch {
      setCurrentMood("warning");
      setMessages(prev => [...prev, { sender: "hami", text: "Oops! I couldn't connect to the server 😥 Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="hami-layout">
      {/* ── LEFT PANEL: Hami sticker + bubble ── */}
      <div className="hami-panel">
        <div className="hami-scene">
          {/* Speech bubble */}
          <div className={`speech-bubble ${isLoading ? "pulse" : ""}`}>
            <div className="bubble-content">
              {isLoading ? (
                <div className="typing-dots">
                  <span /><span /><span />
                </div>
              ) : (
                <p>{bubbleText}</p>
              )}
            </div>
            <div className="bubble-tail" />
          </div>

          {/* Hami sticker */}
          <div className={`hami-sticker mood-${currentMood}`}>
            {hamiGif ? (
              <img src={hamiGif} alt="Hami" className="hami-gif" />
            ) : (
              <div className="hami-fallback">
                <div className="hamster-body">
                  <div className="hamster-ear left" />
                  <div className="hamster-ear right" />
                  <div className="hamster-face">
                    <div className={`hamster-eyes mood-eyes-${currentMood}`}>
                      <span className="eye left-eye" />
                      <span className="eye right-eye" />
                    </div>
                    <div className="hamster-cheeks">
                      <span className="cheek left-cheek" />
                      <span className="cheek right-cheek" />
                    </div>
                    <div className={`hamster-mouth mood-mouth-${currentMood}`} />
                    <div className="hamster-nose" />
                  </div>
                  <div className="hamster-tummy" />
                  <div className="paw left-paw" />
                  <div className="paw right-paw" />
                </div>
              </div>
            )}
          </div>

          {/* Mood badge */}
          <div className={`mood-badge badge-${currentMood}`}>
            {MOOD_EMOJI[currentMood] || "😊"} {currentMood}
          </div>
        </div>

        {/* Quick action chips */}
        <div className="quick-chips">
          <p className="chips-label">Quick actions</p>
          {[
            "📋 Show my schedule",
            "➕ Add an event",
            "🗑️ Delete an event",
            "✏️ Change event date",
          ].map(action => (
            <button
              key={action}
              className="chip"
              onClick={() => setInput(action.replace(/^[^\s]+ /, ""))}
            >
              {action}
            </button>
          ))}
        </div>


      </div>

      {/* ── RIGHT PANEL: Chat ── */}
      <div className="chat-panel">
        <div className="chat-messages" role="log" aria-live="polite">
          {messages.map((msg, i) => (
            <div key={i} className={`message-row ${msg.sender === "user" ? "user-row" : "hami-row"}`}>
              {msg.sender === "hami" && (
                <div className="avatar-mini">🐹</div>
              )}
              <div className={`bubble ${msg.sender === "user" ? "user-bubble" : "hami-bubble"}`}>
                {msg.text.split("\n").map((line, j) => (
                  <span key={j}>
                    {renderText(line)}
                    {j < msg.text.split("\n").length - 1 && <br />}
                  </span>
                ))}
                {(() => {
                  const imageSrc = msg.imageUrl ?? (msg as any).image_url ?? (msg as any).image;
                  return imageSrc ? (
                    <>
                      <img
                        src={imageSrc}
                        alt="Hami generated"
                        style={{
                          width: "100%",
                          borderRadius: "14px",
                          marginTop: "10px",
                        }}
                        onError={e => {
                          const img = e.currentTarget;
                          img.style.display = "none";
                        }}
                      />
                      <div style={{ marginTop: 8, fontSize: 11, color: "var(--text-muted)" }}>
                        <a href={imageSrc} target="_blank" rel="noreferrer" style={{ color: "var(--orange)", textDecoration: "underline" }}>
                          Open generated image
                        </a>
                      </div>
                    </>
                  ) : null;
                })()}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="message-row hami-row">
              <div className="avatar-mini">🐹</div>
              <div className="bubble hami-bubble loading-bubble">
                <div className="typing-dots inline">
                  <span /><span /><span />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="input-area">
          <textarea
            className="chat-input"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Tell Hami about your schedule…"
            rows={1}
            disabled={isLoading}
          />
          <button
            className={`send-btn ${isLoading ? "sending" : ""}`}
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            aria-label="Send"
          >
            {isLoading ? (
              <svg viewBox="0 0 24 24" fill="none" className="spin-icon">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="15 50" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}