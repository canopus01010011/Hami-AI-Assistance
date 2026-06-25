import type { ChatSession, View } from "../types";

interface Props {
  sessions: ChatSession[];
  activeSessionId: string;
  onSelectSession: (id: string) => void;
  onDeleteSession: (id: string) => void;
  onNewChat: () => void;
  currentView: View;
  onViewChange: (v: View) => void;
}

export default function Sidebar({
  sessions, activeSessionId, onSelectSession, onDeleteSession, onNewChat, currentView, onViewChange
}: Props) {
  return (
    <aside style={{
      width: "220px",
      flexShrink: 0,
      background: "white",
      borderRight: "1.5px solid var(--border)",
      display: "flex",
      flexDirection: "column",
      height: "100%",
      padding: "0",
    }}>
      {/* Header */}
      <div style={{
        padding: "18px 16px 12px",
        borderBottom: "1.5px solid var(--border)",
      }}>
        <div style={{
          fontFamily: "Nunito, sans-serif",
          fontWeight: 800,
          fontSize: "18px",
          color: "var(--orange)",
          display: "flex",
          alignItems: "center",
          gap: "6px",
        }}>
          🐹 Hami AI
        </div>
        <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
          Your cute hamster assistant
        </div>
      </div>

      {/* Nav buttons */}
      <div style={{ padding: "10px 10px 6px" }}>
        <NavBtn
          icon="💬"
          label="Chat"
          active={currentView === "chat"}
          onClick={() => onViewChange("chat")}
        />
        <NavBtn
          icon="📅"
          label="Schedule"
          active={currentView === "schedule"}
          onClick={() => onViewChange("schedule")}
        />
      </div>

      {/* New chat */}
      <div style={{ padding: "4px 10px 8px" }}>
        <button
          onClick={onNewChat}
          style={{
            width: "100%",
            background: "var(--orange)",
            color: "white",
            border: "none",
            borderRadius: "var(--radius-sm)",
            padding: "8px 12px",
            fontSize: "13px",
            fontWeight: 700,
            textAlign: "left",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            boxShadow: "0 2px 8px rgba(255,140,66,0.25)",
          }}
        >
          ✏️ New chat
        </button>
      </div>

      {/* Chat history */}
      <div style={{
        flex: 1,
        overflowY: "auto",
        padding: "0 10px",
      }}>
        <div style={{
          fontSize: "10px",
          fontWeight: 700,
          color: "var(--text-muted)",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          marginBottom: "6px",
          padding: "0 2px",
          fontFamily: "Nunito",
        }}>
          History
        </div>
        {sessions.length === 0 && (
          <div style={{ fontSize: "12px", color: "var(--text-muted)", padding: "4px 2px" }}>
            No chats yet
          </div>
        )}
        {[...sessions].reverse().map(session => (
          <div
            key={session.id}
            style={{
              width: "100%",
              background: session.id === activeSessionId ? "var(--orange-pale)" : "transparent",
              border: session.id === activeSessionId ? "1.5px solid var(--border)" : "1.5px solid transparent",
              borderRadius: "var(--radius-sm)",
              padding: "8px 10px",
              textAlign: "left",
              marginBottom: "3px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              cursor: "pointer",
            }}
            onClick={() => onSelectSession(session.id)}
          >
            <div style={{ minWidth: 0 }}>
              <div style={{
                fontFamily: "Nunito, sans-serif",
                fontWeight: session.id === activeSessionId ? 700 : 600,
                fontSize: "13px",
                color: session.id === activeSessionId ? "var(--orange-dark)" : "var(--text)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}>
                {session.name}
              </div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "1px" }}>
                {new Date(session.createdAt).toLocaleDateString()}
              </div>
            </div>
            <button
              onClick={e => { e.stopPropagation(); onDeleteSession(session.id); }}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--text-muted)",
                cursor: "pointer",
                padding: "4px",
                fontSize: "14px",
              }}
              aria-label={`Delete conversation ${session.name}`}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </aside>
  );
}

function NavBtn({ icon, label, active, onClick }: { icon: string; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        background: active ? "var(--orange-pale)" : "transparent",
        border: "none",
        borderRadius: "var(--radius-sm)",
        padding: "7px 10px",
        textAlign: "left",
        marginBottom: "3px",
        display: "flex",
        alignItems: "center",
        gap: "6px",
        fontSize: "13px",
        fontWeight: active ? 700 : 600,
        color: active ? "var(--orange-dark)" : "var(--text-soft)",
        fontFamily: "Nunito, sans-serif",
      }}
    >
      {icon} {label}
    </button>
  );
}