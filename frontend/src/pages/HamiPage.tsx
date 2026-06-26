import { useState, useRef, useEffect, useCallback } from "react";
import HamiAvatar from "../components/HamiAvatar";
import MessageBubble from "../components/Messagebubble";
import Sidebar from "../components/Sidebar";
import ScheduleView from "../components/Scheduleview";
import type { Message, ChatSession, Mood, View } from "../types";

const API = "http://127.0.0.1:8000";

function makeId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
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

function newSession(): ChatSession {
  return {
    id: makeId(),
    name: "New chat",
    createdAt: Date.now(),
    messages: [
      {
        id: makeId(),
        sender: "hami",
        text: "Hi! I'm Hami 🐹 Your cute hamster assistant! Tell me about your upcoming events, exams, or deadlines — I'll remember them for you. You can also pet me or feed me! 🌽",
        timestamp: Date.now(),
      },
    ],
  };
}

const LOAD_KEY = "hami_sessions_v2";

function normalizeMessage(msg: any) {
  const imageUrl = msg.imageUrl ?? msg.image_url ?? msg.image;
  let text = typeof msg.text === "string" ? sanitizeReplyText(msg.text) : msg.text;
  if ((!text || text.trim() === "") && imageUrl) {
    text = "Here is a cute image for you!";
  }
  return {
    ...msg,
    text,
    imageUrl,
    image_url: imageUrl,
    image: imageUrl,
  };
}

function loadSessions(): ChatSession[] {
  try {
    const raw = localStorage.getItem(LOAD_KEY);
    if (raw) {
      const sessions = JSON.parse(raw) as ChatSession[];
      return sessions.map(session => ({
        ...session,
        messages: session.messages.map(normalizeMessage),
      }));
    }
  } catch {}
  return [];
}

function saveSessions(sessions: ChatSession[]) {
  try {
    localStorage.setItem(LOAD_KEY, JSON.stringify(sessions));
  } catch {}
}

export default function HamiPage() {
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    const loaded = loadSessions();
    return loaded.length > 0 ? loaded : [newSession()];
  });
  const [activeSessionId, setActiveSessionId] = useState<string>(() => {
    const loaded = loadSessions();
    return loaded.length > 0 ? loaded[loaded.length - 1].id : sessions[0]?.id ?? "";
  });
  const [mood, setMood] = useState<Mood>("idle");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [bubbleText, setBubbleText] = useState<string>("");
  const [currentView, setCurrentView] = useState<View>("chat");
  const [happiness, setHappiness] = useState(75);
  const [hunger, setHunger] = useState(60);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Persist on change
  useEffect(() => {
    saveSessions(sessions);
  }, [sessions]);

  const activeSession = sessions.find(s => s.id === activeSessionId);
  const messages = activeSession?.messages ?? [];



  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Show last hami message in bubble
  useEffect(() => {
    const lastHami = [...messages].reverse().find(m => m.sender === "hami");
    if (lastHami && lastHami.text !== "🐹 Thinking...") {
      setBubbleText(lastHami.text.length > 120 ? lastHami.text.slice(0, 117) + "…" : lastHami.text);
    }
  }, [messages]);

  const updateSession = useCallback((id: string, updater: (s: ChatSession) => ChatSession) => {
    setSessions(prev => prev.map(s => s.id === id ? updater(s) : s));
  }, []);

  const sendMessage = async () => {
    if (!input.trim() || loading || !activeSessionId) return;
    const text = input.trim();
    setInput("");
    setLoading(true);
    setMood("thinking");

    const userMsg: Message = { id: makeId(), sender: "user", text, timestamp: Date.now() };
    const thinkingMsg: Message = { id: "thinking", sender: "hami", text: "Thinking…", timestamp: Date.now() };

    // Name session from first user message
    setSessions(prev => prev.map(s => {
      if (s.id !== activeSessionId) return s;
      const name = s.messages.filter(m => m.sender === "user").length === 0
        ? text.slice(0, 28) + (text.length > 28 ? "…" : "")
        : s.name;
      return { ...s, name, messages: [...s.messages, userMsg, thinkingMsg] };
    }));

    try {
      const res = await fetch(`${API}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      console.log("SERVER RESPONSE:", data);
      const rawReply = String(data.reply ?? "");
      const imageUrl = data.image_url ?? data.imageUrl ?? data.image ?? extractImageUrlFromText(rawReply);
      const cleanReply = sanitizeReplyText(rawReply);
      const displayReply = cleanReply || (imageUrl ? "Here is a cute image for you!" : rawReply || "Here you go!");
      const hamiMsg: Message = {
        id: makeId(),
        sender: "hami",
        text: displayReply,
        timestamp: Date.now(),
        imageUrl,
        image_url: imageUrl,
        image: imageUrl,
      };
      setMood(data.mood as Mood || "idle");
      updateSession(activeSessionId, s => ({
        ...s,
        messages: [...s.messages.filter(m => m.id !== "thinking"), hamiMsg],
      }));
     if (data.audio) {
    const audio = new Audio(
        `http://127.0.0.1:8000/${data.audio}`
    );

    audio.play().catch(err => {
        console.error(err);
    });
}
    } catch {
      const errMsg: Message = { id: makeId(), sender: "hami", text: "Oops, I can't reach the server right now. Is the backend running?", timestamp: Date.now() };
      setMood("warning");
      updateSession(activeSessionId, s => ({
        ...s,
        messages: [...s.messages.filter(m => m.id !== "thinking"), errMsg],
      }));
    } finally {
      setLoading(false);
      setTimeout(() => setMood("idle"), 3000);
    }
  };

  const handleNewChat = () => {
    const session = newSession();
    setSessions(prev => [...prev, session]);
    setActiveSessionId(session.id);
    setMood("idle");
    setBubbleText("Hi again! What's on your mind?");
    setCurrentView("chat");
  };

  const handlePet = () => {
    setHappiness(h => Math.min(100, h + 8));
    setMood("happy");
    setBubbleText("Eeeek! That tickles!! 🧡");
    setTimeout(() => setMood("idle"), 2000);
  };

  const handleFeed = () => {
    setHunger(h => Math.min(100, h + 12));
    setHappiness(h => Math.min(100, h + 5));
    setMood("happy");
    setBubbleText("Yummy yummy corn!! Nom nom nom 🌽✨");
    setTimeout(() => setMood("idle"), 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div style={{
      display: "flex",
      height: "100vh",
      width: "100vw",
      overflow: "hidden",
      background: "var(--cream)",
    }}>
      {/* Sidebar */}
      <Sidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={id => { setActiveSessionId(id); setCurrentView("chat"); }}
        onDeleteSession={id => {
          setSessions(prev => {
            const remaining = prev.filter(s => s.id !== id);
            if (remaining.length === 0) {
              const session = newSession();
              setActiveSessionId(session.id);
              return [session];
            }
            if (id === activeSessionId) {
              setActiveSessionId(remaining[remaining.length - 1].id);
            }
            return remaining;
          });
        }}
        onNewChat={handleNewChat}
        currentView={currentView}
        onViewChange={setCurrentView}
      />

      {/* Main content */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", height: "100%", overflow: "hidden", minWidth: 0 }}>
        {currentView === "schedule" ? (
          <ScheduleView />
        ) : (
          <div style={{ display: "flex", flex: 1, overflow: "hidden", minHeight: 0 }}>
            {/* Hami column */}
            <div style={{
              width: "clamp(180px, 25vw, 260px)",
              flexShrink: 0,
              background: "white",
              borderRight: "1.5px solid var(--border)",
              display: "flex",
              flexDirection: "column",
              alignItems: "stretch",
              padding: "16px 12px 12px",
              overflowY: "auto",
            }}>
              <HamiAvatar
                mood={mood}
                bubbleText={bubbleText}
                onPet={handlePet}
                onFeed={handleFeed}
                happiness={happiness}
                hunger={hunger}
              />
            </div>

            {/* Chat column */}
            <div style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              minWidth: 0,
            }}>
              {/* Chat header */}
              <div style={{
                padding: "14px 20px",
                background: "white",
                borderBottom: "1.5px solid var(--border)",
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}>
                <div style={{
                  fontFamily: "Nunito",
                  fontWeight: 800,
                  fontSize: "15px",
                  color: "var(--text)",
                  flex: 1,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}>
                  {activeSession?.name || "Chat with Hami"}
                </div>
                <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                  {messages.filter(m => m.sender === "user").length} messages
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "11px", color: "var(--text-muted)" }}>

                </div>
              </div>

              {/* Messages */}
              <div style={{
                flex: 1,
                overflowY: "auto",
                padding: "16px 20px",
                display: "flex",
                flexDirection: "column",
              }}>
                {messages.map(msg => (
                  <MessageBubble key={msg.id} message={msg} />
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input bar */}
              <div style={{
                padding: "12px 16px",
                background: "white",
                borderTop: "1.5px solid var(--border)",
                flexShrink: 0,
                display: "flex",
                gap: "8px",
                alignItems: "center",
              }}>
                <input
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Tell Hami about your schedule..."
                  disabled={loading}
                  style={{
                    flex: 1,
                    padding: "10px 14px",
                    fontSize: "14px",
                    border: "1.5px solid var(--border)",
                    borderRadius: "var(--radius-pill)",
                    background: loading ? "#fafafa" : "white",
                    color: "var(--text)",
                    transition: "border-color 0.15s",
                    outline: "none",
                  }}
                  onFocus={e => e.target.style.borderColor = "var(--orange)"}
                  onBlur={e => e.target.style.borderColor = "var(--border)"}
                />
                <button
                  onClick={sendMessage}
                  disabled={loading || !input.trim()}
                  style={{
                    background: loading || !input.trim() ? "var(--border)" : "var(--orange)",
                    color: "white",
                    border: "none",
                    borderRadius: "50%",
                    width: "40px",
                    height: "40px",
                    fontSize: "16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    boxShadow: loading || !input.trim() ? "none" : "0 2px 10px rgba(255,140,66,0.4)",
                    transition: "background 0.15s",
                    cursor: loading || !input.trim() ? "not-allowed" : "pointer",
                  }}
                >
                  {loading ? "⏳" : "➤"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}