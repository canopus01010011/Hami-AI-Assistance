export interface Message {
  id: string;
  sender: "user" | "hami";
  text: string;
  timestamp: number;
  imageUrl?: string;
  image_url?: string;
  image?: string;
}

export interface Task {
  id: number;
  title: string;
  type: string;
  due_date: string;
}

export interface ChatSession {
  id: string;
  name: string;
  messages: Message[];
  createdAt: number;
}

export type Mood = "idle" | "thinking" | "happy" | "working" | "warning" | "sleeping";

export type View = "chat" | "schedule";