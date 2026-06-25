import { useState } from "react";
import Message from "./Message";
import type { Message as MessageType } from "../types/Message";
import HamiAvatar from "./HamiAvatar";

function ChatBox() {
  const [messages, setMessages] = useState<MessageType[]>([
    {
      sender: "hami",
      text: "🐹 Hello! I am Hami!",
    },
  ]);

  const [input, setInput] = useState("");

  const [mood, setMood] = useState("idle");

const sendMessage = async () => {
  if (!input.trim()) return;

  const userText = input;
  setInput("");
  setMood("thinking");
  // 1. add user message + thinking
  setMessages((prev) => [
    ...prev,
    { sender: "user", text: userText },
    { sender: "hami", text: "🐹 Thinking..." }
  ]);

  try {
    const res = await fetch("http://127.0.0.1:8000/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: userText }),
    });

   const data = await res.json();

setMood(data.mood);

console.log(data);

// 2. remove ONLY thinking message
setMessages(
  (prev) => {
  setMood("warning");

      const filtered = prev.filter(
        (m) => m.text !== "🐹 Thinking..."
      );

      return [
        ...filtered,
        { sender: "hami", text: data.reply }
      ];
    });

  } catch (err) {
    setMessages((prev) => {
      const filtered = prev.filter(
        (m) => m.text !== "🐹 Thinking..."
      );

      return [
        ...filtered,
        { sender: "hami", text: "🐹 Error connecting" }
      ];
    });
  }
};
return (
  <div>

    <HamiAvatar mood={mood} />

    <div
      style={{
        marginBottom: "10px",
        fontWeight: "bold",
      }}
    >
      🐹 Mood: {mood}
    </div>

    <div
      style={{
        height: "500px",
        overflowY: "auto",
        border: "1px solid gray",
        padding: "10px",
        marginBottom: "10px",
      }}
    >
      {messages.map((msg, index) => (
        <Message key={index} message={msg} />
      ))}
    </div>

    <div style={{ display: "flex", gap: "10px" }}>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        style={{
          flex: 1,
          padding: "10px",
        }}
      />

      <button onClick={sendMessage}>
        Send
      </button>
    </div>
  </div>
);
}

export default ChatBox;