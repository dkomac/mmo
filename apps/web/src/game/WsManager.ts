import type { ClientMessage, ServerMessage } from "@browser-mmo/shared";

const WS_URL = (import.meta.env.VITE_WS_URL as string | undefined) ?? "ws://localhost:3001";

export class WsManager {
  private ws: WebSocket | null = null;
  private connected = false;

  onMessage: ((msg: ServerMessage) => void) | null = null;
  onConnected: (() => void) | null = null;
  onDisconnected: (() => void) | null = null;

  connect(token: string, characterId: string) {
    const url = `${WS_URL}?token=${encodeURIComponent(token)}&characterId=${encodeURIComponent(characterId)}`;
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      this.connected = true;
      this.onConnected?.();
    };

    this.ws.onmessage = (e: MessageEvent) => {
      try {
        const msg = JSON.parse(e.data as string) as ServerMessage;
        this.onMessage?.(msg);
      } catch {
        console.warn("WS: failed to parse message", e.data);
      }
    };

    this.ws.onclose = () => {
      this.connected = false;
      this.onDisconnected?.();
    };

    this.ws.onerror = () => {
      console.warn("WS: connection error — running in local-only mode");
    };
  }

  send(msg: ClientMessage) {
    if (this.connected && this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    }
  }

  isConnected() {
    return this.connected;
  }

  disconnect() {
    this.ws?.close();
    this.ws = null;
    this.connected = false;
  }
}
