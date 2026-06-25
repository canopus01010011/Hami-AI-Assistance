export interface Message {
  sender: "user" | "hami";
  text: string;
  imageUrl?: string;
}