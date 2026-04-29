import { useState } from "react";
import { supabase } from "../../lib/supabase";

export function LoginScreen() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);

    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;

        if (data.user) {
          const { error: profileError } = await supabase.from("profiles").insert({
            id: data.user.id,
            display_name: displayName || email.split("@")[0],
          });
          if (profileError && profileError.code !== "23505") throw profileError;
        }

        setInfo("Check your email to confirm your account, then sign in.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={s.root}>
      <div style={s.card}>
        <h1 style={s.title}>Browser MMO</h1>
        <div style={s.tabs}>
          <button style={{ ...s.tab, ...(mode === "signin" ? s.tabActive : {}) }} onClick={() => setMode("signin")}>
            Sign In
          </button>
          <button style={{ ...s.tab, ...(mode === "signup" ? s.tabActive : {}) }} onClick={() => setMode("signup")}>
            Sign Up
          </button>
        </div>
        <form onSubmit={handleSubmit} style={s.form}>
          {mode === "signup" && (
            <input
              style={s.input}
              type="text"
              placeholder="Display name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          )}
          <input
            style={s.input}
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            style={s.input}
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
          {error && <div style={s.error}>{error}</div>}
          {info && <div style={s.info}>{info}</div>}
          <button style={s.submit} type="submit" disabled={loading}>
            {loading ? "..." : mode === "signin" ? "Enter World" : "Create Account"}
          </button>
        </form>
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
    padding: "40px 48px",
    width: 360,
    display: "flex",
    flexDirection: "column",
    gap: 0,
  },
  title: {
    color: "#53d8fb",
    fontSize: 22,
    letterSpacing: 4,
    textTransform: "uppercase",
    textAlign: "center",
    marginBottom: 24,
  },
  tabs: {
    display: "flex",
    borderBottom: "1px solid #30363d",
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    background: "none",
    border: "none",
    color: "#8b949e",
    cursor: "pointer",
    padding: "8px 0",
    fontFamily: "'Courier New', monospace",
    fontSize: 13,
    letterSpacing: 1,
  },
  tabActive: {
    color: "#53d8fb",
    borderBottom: "2px solid #53d8fb",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  input: {
    background: "#0d1117",
    border: "1px solid #30363d",
    color: "#e6edf3",
    padding: "10px 12px",
    fontFamily: "'Courier New', monospace",
    fontSize: 13,
    outline: "none",
  },
  error: {
    color: "#f85149",
    fontSize: 12,
    padding: "8px 0",
  },
  info: {
    color: "#3fb950",
    fontSize: 12,
    padding: "8px 0",
  },
  submit: {
    background: "#1f6feb",
    color: "#fff",
    border: "none",
    padding: "11px",
    cursor: "pointer",
    fontFamily: "'Courier New', monospace",
    fontSize: 13,
    letterSpacing: 1,
    marginTop: 4,
  },
};
