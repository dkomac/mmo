import { useEffect, useRef } from "react";
import { createGame } from "./game/GameSetup";
import { EquipmentPanel } from "./ui/EquipmentPanel";
import type Phaser from "phaser";

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;
    gameRef.current = createGame(containerRef.current);
    return () => {
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, []);

  return (
    <div style={{ display: "flex", width: "100%", height: "100vh", background: "#1a1a2e" }}>
      <div ref={containerRef} style={{ flex: 1, overflow: "hidden" }} />
      <EquipmentPanel />
    </div>
  );
}
