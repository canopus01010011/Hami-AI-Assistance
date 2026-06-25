import type { Message } from "../types";

interface Props {
  message: Message;
}

function renderText(text: string) {
  // Bold **text** support
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    // Render newlines
    return part.split("\n").map((line, j, arr) => (
      <span key={`${i}-${j}`}>
        {line}
        {j < arr.length - 1 && <br />}
      </span>
    ));
  });
}

export default function MessageBubble({ message }: Props) {
  const isUser = message.sender === "user";
  const imageSrc = message.imageUrl ?? message.image_url ?? (message as any).image;

  return (
    <div style={{
      display: "flex",
      justifyContent: isUser ? "flex-end" : "flex-start",
      marginBottom: "8px",
      animation: "fadeSlideIn 0.2s ease-out forwards",
    }}>
      {!isUser && (
        <div style={{
          width: "32px",
          height: "32px",
          borderRadius: "50%",
          background: "linear-gradient(135deg, #FFD8B8 0%, #FFCA6A 100%)",
          border: "2px solid #F5C575",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "16px",
          marginRight: "8px",
          flexShrink: 0,
          alignSelf: "flex-end",
          boxShadow: "0 2px 6px rgba(255,140,66,0.25)",
        }}>🐹</div>
      )}
      <div style={{
        background: isUser
          ? "linear-gradient(135deg, #FFD89B 0%, #FFCA6A 100%)"
          : "white",
        color: isUser ? "#2D1810" : "var(--text)",
        padding: "12px 16px",
        borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
        maxWidth: "75%",
        fontSize: "14px",
        lineHeight: "1.55",
        border: isUser ? "1.5px solid #F5C575" : "1.5px solid var(--border)",
        boxShadow: isUser
          ? "0 4px 14px rgba(255,140,66,0.28), inset 0 1px 2px rgba(255,255,255,0.6)"
          : "0 2px 8px rgba(61,43,31,0.08)",
        wordBreak: "break-word",
        fontWeight: isUser ? 600 : 500,
      }}>
        {renderText(message.text)}
        {imageSrc && (
          <img
            src={imageSrc}
            alt="Hami generated content"
            style={{
              width: "100%",
              borderRadius: "14px",
              marginTop: "10px",
              boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
            }}
          />
        )}
        <div style={{
          fontSize: "10px",
          opacity: isUser ? 0.65 : 0.55,
          marginTop: "4px",
          textAlign: "right",
          fontWeight: 500,
        }}>
          {new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </div>
      </div>
    </div>
  );
}