import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { chatStore } from "../lib/chatStore";

function formatTime(ts: number): string {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function ChatBox() {
  const messages = useSyncExternalStore(
    (cb) => chatStore.subscribe(cb),
    () => chatStore.messages,
  );
  const [draft, setDraft] = useState("");
  const [expanded, setExpanded] = useState(true);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const connected = chatStore.sendMessage !== null;

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (listRef.current && expanded) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, expanded]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text || !chatStore.sendMessage) return;
    chatStore.sendMessage(text);
    setDraft("");
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    // Prevent game from seeing key events while chat is focused
    e.stopPropagation();
    if (e.key === "Escape") {
      inputRef.current?.blur();
    }
  }

  return (
    <div style={s.root}>
      <div style={s.header} onClick={() => setExpanded((v) => !v)}>
        <span style={s.headerLabel}>Chat</span>
        <span style={s.headerToggle}>{expanded ? "▾" : "▸"}</span>
      </div>

      {expanded && (
        <>
          <div ref={listRef} style={s.messages}>
            {messages.length === 0 && (
              <div style={s.empty}>
                {connected ? "No messages yet." : "Not connected to server."}
              </div>
            )}
            {messages.map((msg) => (
              <div key={msg.id} style={s.row}>
                <span style={s.time}>{formatTime(msg.timestamp)}</span>
                <span style={s.name}>{msg.fromName}</span>
                <span style={s.text}>{msg.message}</span>
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={s.form}>
            <input
              ref={inputRef}
              style={{ ...s.input, opacity: connected ? 1 : 0.4 }}
              value={draft}
              onChange={(e) => setDraft(e.target.value.slice(0, 200))}
              onKeyDown={handleKeyDown}
              placeholder={connected ? "Press Enter to chat…" : "Not connected"}
              disabled={!connected}
              maxLength={200}
            />
            <button
              style={{ ...s.sendBtn, opacity: connected && draft.trim() ? 1 : 0.4 }}
              type="submit"
              disabled={!connected || !draft.trim()}
            >
              ↵
            </button>
          </form>
        </>
      )}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  root: {
    position: "absolute",
    bottom: 12,
    left: 12,
    width: 300,
    fontFamily: "'Courier New', monospace",
    fontSize: 11,
    userSelect: "none",
    zIndex: 20,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "rgba(0,0,0,0.75)",
    padding: "3px 8px",
    cursor: "pointer",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
  },
  headerLabel: {
    color: "#53d8fb",
    letterSpacing: 2,
    fontSize: 10,
    textTransform: "uppercase",
  },
  headerToggle: {
    color: "#555",
    fontSize: 10,
  },
  messages: {
    background: "rgba(0,0,0,0.65)",
    height: 140,
    overflowY: "auto",
    padding: "6px 8px",
    display: "flex",
    flexDirection: "column",
    gap: 3,
  },
  empty: {
    color: "#555",
    fontStyle: "italic",
    fontSize: 10,
  },
  row: {
    display: "flex",
    gap: 5,
    flexWrap: "wrap",
    lineHeight: 1.4,
  },
  time: {
    color: "#444",
    fontSize: 9,
    flexShrink: 0,
    alignSelf: "flex-start",
    paddingTop: 1,
  },
  name: {
    color: "#53d8fb",
    fontWeight: "bold",
    flexShrink: 0,
  },
  text: {
    color: "#d0d0d0",
    wordBreak: "break-word",
    flex: 1,
  },
  form: {
    display: "flex",
    background: "rgba(0,0,0,0.75)",
    borderTop: "1px solid rgba(255,255,255,0.06)",
  },
  input: {
    flex: 1,
    background: "transparent",
    border: "none",
    outline: "none",
    color: "#e0e0e0",
    fontFamily: "'Courier New', monospace",
    fontSize: 11,
    padding: "5px 8px",
  },
  sendBtn: {
    background: "none",
    border: "none",
    color: "#53d8fb",
    cursor: "pointer",
    padding: "0 8px",
    fontSize: 14,
  },
};
