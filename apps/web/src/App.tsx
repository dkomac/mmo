import { useEffect, useRef, useState } from "react";
import { createGame } from "./game/GameSetup";
import { EquipmentPanel } from "./ui/EquipmentPanel";
import { ChatBox } from "./ui/ChatBox";
import { LoginScreen } from "./ui/screens/LoginScreen";
import { CharacterSelect } from "./ui/screens/CharacterSelect";
import { AuthProvider, useAuth } from "./lib/AuthContext";
import type { Database } from "./lib/database.types";
import type Phaser from "phaser";

type Character = Database["public"]["Tables"]["characters"]["Row"];

function GameView({ character }: { character: Character }) {
  const { session } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (!containerRef.current || gameRef.current || !session) return;
    gameRef.current = createGame(containerRef.current, character, session);
    return () => {
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, [character, session]);

  return (
    <div style={{ display: "flex", width: "100%", height: "100vh", background: "#1a1a2e" }}>
      <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
        <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
        <ChatBox />
      </div>
      <EquipmentPanel character={character} />
    </div>
  );
}

function AppInner() {
  const { session, loading } = useAuth();
  const [character, setCharacter] = useState<Character | null>(null);

  if (loading) return <Splash />;
  if (!session) return <LoginScreen />;
  if (!character) return <CharacterSelect onSelect={setCharacter} />;
  return <GameView character={character} />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}

function Splash() {
  return (
    <div style={{
      width: "100%", height: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", background: "#0d1117",
      fontFamily: "'Courier New', monospace", color: "#53d8fb", letterSpacing: 4,
    }}>
      Loading...
    </div>
  );
}
