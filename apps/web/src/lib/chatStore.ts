export type ChatMessage = {
  id: string;
  fromCharacterId: string;
  fromName: string;
  message: string;
  timestamp: number;
};

type Listener = () => void;

const MAX_MESSAGES = 50;

class ChatStore {
  messages: ChatMessage[] = [];
  private listeners = new Set<Listener>();

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  addMessage(msg: Omit<ChatMessage, "id" | "timestamp">) {
    this.messages = [
      ...this.messages.slice(-(MAX_MESSAGES - 1)),
      { ...msg, id: `${Date.now()}-${Math.random()}`, timestamp: Date.now() },
    ];
    this.listeners.forEach((fn) => fn());
  }

  // Wired by GameScene
  sendMessage: ((text: string) => void) | null = null;
}

export const chatStore = new ChatStore();
