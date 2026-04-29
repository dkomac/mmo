import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import type { Database } from "../../lib/database.types";

type Character = Database["public"]["Tables"]["characters"]["Row"];

type Props = {
  onSelect: (character: Character) => void;
};

const SPRITE_OPTIONS = ["default_player", "knight", "mage", "rogue"];

export function CharacterSelect({ onSelect }: Props) {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newSprite, setNewSprite] = useState(SPRITE_OPTIONS[0]);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    loadCharacters();
  }, []);

  async function loadCharacters() {
    setLoading(true);
    const { data, error } = await supabase
      .from("characters")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) setError(error.message);
    else setCharacters(data ?? []);
    setLoading(false);
  }

  async function createCharacter(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const name = newName.trim();
    if (!name) return;

    setCreating(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("Not authenticated"); setCreating(false); return; }

    const { data, error } = await supabase
      .from("characters")
      .insert({ user_id: user.id, name, sprite_id: newSprite })
      .select()
      .single();

    if (error) {
      setError(error.code === "23505" ? "A character with that name already exists." : error.message);
    } else if (data) {
      setCharacters((prev) => [...prev, data]);
      setShowCreate(false);
      setNewName("");
    }
    setCreating(false);
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <div style={s.root}>
      <div style={s.card}>
        <div style={s.header}>
          <h1 style={s.title}>Select Character</h1>
          <button style={s.signOut} onClick={signOut}>Sign Out</button>
        </div>

        {loading ? (
          <div style={s.empty}>Loading...</div>
        ) : (
          <>
            <div style={s.list}>
              {characters.length === 0 && !showCreate && (
                <div style={s.empty}>No characters yet. Create one to begin.</div>
              )}
              {characters.map((char) => (
                <div key={char.id} style={s.charCard} onClick={() => onSelect(char)}>
                  <div style={s.charIcon}>@</div>
                  <div>
                    <div style={s.charName}>{char.name}</div>
                    <div style={s.charMeta}>
                      Level {char.level} &nbsp;·&nbsp; {char.sprite_id}
                    </div>
                  </div>
                  <div style={s.enterBtn}>Enter &rarr;</div>
                </div>
              ))}
            </div>

            {showCreate ? (
              <form onSubmit={createCharacter} style={s.createForm}>
                <div style={s.formTitle}>New Character</div>
                <input
                  style={s.input}
                  type="text"
                  placeholder="Character name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  maxLength={24}
                  required
                  autoFocus
                />
                <select
                  style={s.input}
                  value={newSprite}
                  onChange={(e) => setNewSprite(e.target.value)}
                >
                  {SPRITE_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                {error && <div style={s.error}>{error}</div>}
                <div style={s.formButtons}>
                  <button style={s.cancelBtn} type="button" onClick={() => { setShowCreate(false); setError(null); }}>
                    Cancel
                  </button>
                  <button style={s.submitBtn} type="submit" disabled={creating}>
                    {creating ? "Creating..." : "Create"}
                  </button>
                </div>
              </form>
            ) : (
              characters.length < 3 && (
                <button style={s.newCharBtn} onClick={() => setShowCreate(true)}>
                  + New Character
                </button>
              )
            )}
          </>
        )}
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  root: {
    width: "100%",
    height: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#0d1117",
    fontFamily: "'Courier New', monospace",
  },
  card: {
    background: "#161b22",
    border: "1px solid #30363d",
    padding: "32px 40px",
    width: 440,
    display: "flex",
    flexDirection: "column",
    gap: 20,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    color: "#53d8fb",
    fontSize: 18,
    letterSpacing: 3,
    textTransform: "uppercase",
    margin: 0,
  },
  signOut: {
    background: "none",
    border: "1px solid #30363d",
    color: "#8b949e",
    cursor: "pointer",
    padding: "4px 10px",
    fontFamily: "'Courier New', monospace",
    fontSize: 11,
  },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  empty: {
    color: "#8b949e",
    fontSize: 13,
    textAlign: "center",
    padding: "20px 0",
  },
  charCard: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    background: "#0d1117",
    border: "1px solid #30363d",
    padding: "12px 16px",
    cursor: "pointer",
  },
  charIcon: {
    width: 40,
    height: 40,
    background: "#1f6feb22",
    border: "1px solid #1f6feb",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 20,
    color: "#53d8fb",
    flexShrink: 0,
  },
  charName: {
    color: "#e6edf3",
    fontSize: 15,
    fontWeight: "bold",
  },
  charMeta: {
    color: "#8b949e",
    fontSize: 11,
    marginTop: 3,
  },
  enterBtn: {
    marginLeft: "auto",
    color: "#53d8fb",
    fontSize: 13,
  },
  createForm: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    borderTop: "1px solid #30363d",
    paddingTop: 20,
  },
  formTitle: {
    color: "#53d8fb",
    fontSize: 12,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  input: {
    background: "#0d1117",
    border: "1px solid #30363d",
    color: "#e6edf3",
    padding: "9px 12px",
    fontFamily: "'Courier New', monospace",
    fontSize: 13,
    outline: "none",
  },
  error: {
    color: "#f85149",
    fontSize: 12,
  },
  formButtons: {
    display: "flex",
    gap: 8,
    justifyContent: "flex-end",
  },
  cancelBtn: {
    background: "none",
    border: "1px solid #30363d",
    color: "#8b949e",
    padding: "8px 16px",
    cursor: "pointer",
    fontFamily: "'Courier New', monospace",
    fontSize: 12,
  },
  submitBtn: {
    background: "#1f6feb",
    border: "none",
    color: "#fff",
    padding: "8px 16px",
    cursor: "pointer",
    fontFamily: "'Courier New', monospace",
    fontSize: 12,
  },
  newCharBtn: {
    background: "none",
    border: "1px dashed #30363d",
    color: "#8b949e",
    padding: "12px",
    cursor: "pointer",
    fontFamily: "'Courier New', monospace",
    fontSize: 12,
    letterSpacing: 1,
    width: "100%",
  },
};
