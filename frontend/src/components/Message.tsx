import type { Message as MessageType } from "../types/Message";

interface Props {
  message: MessageType;
}

function Message({ message }: Props) {
  const isUser = message.sender === "user";

  return (
    <div
      style={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
        marginBottom: "10px",
      }}
    >
      <div
        style={{
          backgroundColor: isUser ? "#4caf50" : "#e0e0e0",
          padding: "10px",
          borderRadius: "12px",
          maxWidth: "70%",
        }}
      >
        {message.text}
      </div>
    </div>
  );
}

export default Message;