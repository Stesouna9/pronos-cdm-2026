/* App.jsx — coquille, navigation, état, connexion */
import { useState, useEffect } from "react";
import { WC } from "./lib/wc.js";
import { supabase, hasSupabase } from "./lib/supabase.js";
import { AuthScreen, Dashboard } from "./screens/screens1.jsx";
import { MatchesScreen, MatchDetail } from "./screens/screens2.jsx";
import { TableauScreen, Leaderboard, Profile, Rules } from "./screens/screens3.jsx";

const LS = "pronos2026:v1";
function loadState() {
  try { return JSON.parse(localStorage.getItem(LS)) || {}; } catch (e) { return {}; }
}

const NAV = [
  ["home", "Accueil", "🏠"],
  ["matches", "Matchs", "⚽"],
  ["tableau", "Tableau", "🏆"],
  ["leaderboard", "Classement", "📊"],
  ["profile", "Profil", "👤"],
  ["rules", "Règles", "📖"],
];

export default function App() {
  const persisted = loadState();
  const [authed, setAuthed] = useState(persisted.authed || false);
  const [screen, setScreen] = useState(persisted.screen || "home");
  const [params, setParams] = useState(persisted.params || {});
  const [predictions, setPredictions] = useState(persisted.predictions || WC.PREDICTIONS);
  const [profile, setProfile] = useState(persisted.profile || { pseudo: "Toi", avatar: "🎯", email: "", fav: "FRA" });

  // Si Supabase est branché, on suit la session réelle
  useEffect(() => {
    if (!hasSupabase) return;
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setAuthed(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setAuthed(Boolean(session));
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // persistance locale (démo + préférences)
  useEffect(() => {
    localStorage.setItem(LS, JSON.stringify({ authed: hasSupabase ? false : authed, screen, params, predictions, profile }));
  }, [authed, screen, params, predictions, profile]);

  function go(s, p = {}) { setScreen(s); setParams(p); window.scrollTo({ top: 0 }); }
  function setPred(id, val) { setPredictions((P) => ({ ...P, [id]: val })); }

  // Connexion : Supabase si dispo, sinon démo locale
  async function handleAuth(mode, { email, pwd, pseudo, avatar }) {
    if (!hasSupabase) { setAuthed(true); go("home"); return {}; }
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email, password: pwd,
          options: { data: { pseudo, avatar } },
        });
        if (error) return { error: traduire(error.message) };
        if (!data.session) return { info: "Compte créé ! Vérifie ta boîte mail pour confirmer, puis connecte-toi." };
        go("home"); return {};
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password: pwd });
        if (error) return { error: traduire(error.message) };
        go("home"); return {};
      }
    } catch (e) {
      return { error: "Problème de connexion au serveur. Réessaie." };
    }
  }

  async function logout() {
    if (hasSupabase) await supabase.auth.signOut();
    setAuthed(false);
  }

  const aPredire = WC.ALL_MATCHES.filter((m) => m.status !== "fini" && m.home && m.away && !predictions[m.id]).length;

  if (!authed) return <AuthScreen onAuth={handleAuth} profile={profile} setProfile={setProfile} demoMode={!hasSupabase} />;

  function render() {
    switch (screen) {
      case "home": return <Dashboard go={go} predictions={predictions} profile={profile} />;
      case "matches": return <MatchesScreen go={go} predictions={predictions} setPred={setPred} />;
      case "match": return <MatchDetail id={params.id} go={go} predictions={predictions} setPred={setPred} />;
      case "tableau": return <TableauScreen go={go} />;
      case "leaderboard": return <Leaderboard go={go} profile={profile} />;
      case "profile": return <Profile profile={profile} setProfile={setProfile} predictions={predictions} />;
      case "rules": return <Rules />;
      default: return <Dashboard go={go} predictions={predictions} profile={profile} />;
    }
  }

  const activeNav = screen === "match" ? "matches" : screen;

  return (
    <div className="app-root">
      <div className="shell">
        <aside className="sidebar">
          <div className="brand">
            <div className="mark">26</div>
            <div><div className="nm">GABRIEL</div><div className="sub">Coupe du Monde 2026</div></div>
          </div>
          {NAV.map(([k, l, ic]) => (
            <button key={k} className={"navitem" + (activeNav === k ? " active" : "")} onClick={() => go(k)}>
              <span className="ic">{ic}</span>{l}
              {k === "matches" && aPredire > 0 && <span className="badge">{aPredire}</span>}
            </button>
          ))}
          <div className="userchip">
            <div className="av">{profile.avatar}</div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{profile.pseudo}</div>
              <div className="mono muted" style={{ fontSize: 10 }}>#{WC.ME.position} · {WC.ME.pts} pts</div>
            </div>
            <button className="navitem" style={{ width: "auto", padding: 6, marginLeft: "auto" }} title="Déconnexion" onClick={logout}>⎋</button>
          </div>
        </aside>

        <main className="main">
          <header className="topbar">
            <div className="brand" style={{ padding: 0 }}>
              <div className="mark" style={{ width: 32, height: 32, fontSize: 15 }}>26</div>
              <div className="nm" style={{ fontSize: 15 }}>CDM DE GABRIEL</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span className="pill pill--accent" style={{ fontSize: 11 }}>{WC.ME.pts} pts · #{WC.ME.position}</span>
              <div style={{ width: 30, height: 30, borderRadius: "50%", background: "var(--bg-2)", display: "grid", placeItems: "center" }}>{profile.avatar}</div>
            </div>
          </header>
          {render()}
        </main>
      </div>

      <nav className="tabbar">
        {NAV.map(([k, l, ic]) => (
          <button key={k} className={"tab" + (activeNav === k ? " active" : "")} onClick={() => go(k)}>
            <span className="ic">{ic}</span>{l}
          </button>
        ))}
      </nav>
    </div>
  );
}

// petites traductions des erreurs Supabase courantes
function traduire(msg) {
  const m = (msg || "").toLowerCase();
  if (m.includes("already registered") || m.includes("already been registered")) return "Cet email a déjà un compte. Connecte-toi.";
  if (m.includes("invalid login")) return "Email ou mot de passe incorrect.";
  if (m.includes("email not confirmed")) return "Confirme d'abord ton email (regarde tes mails).";
  if (m.includes("password")) return "Mot de passe trop court (6 caractères minimum).";
  return msg;
}
