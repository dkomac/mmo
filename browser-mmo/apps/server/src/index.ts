import { WebSocketServer } from "ws";

const PORT = parseInt(process.env.PORT ?? "3001", 10);

const wss = new WebSocketServer({ port: PORT });

wss.on("listening", () => {
  console.log(`WebSocket server listening on ws://localhost:${PORT}`);
});

wss.on("connection", (ws) => {
  console.log("Client connected");

  ws.on("message", (data) => {
    try {
      const msg = JSON.parse(data.toString());
      console.log("Received:", msg);
      // Multiplayer logic goes here (Milestone 4+)
    } catch {
      ws.send(JSON.stringify({ type: "error", message: "Invalid message format" }));
    }
  });

  ws.on("close", () => {
    console.log("Client disconnected");
  });
});
