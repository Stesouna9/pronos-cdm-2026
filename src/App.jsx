/* App.jsx — coquille, navigation, état, connexion */
import { useState, useEffect } from "react";
import { WC } from "./lib/wc.js";
import { supabase, hasSupabase } from "./lib/supabase.js";
import { fetchMatches, fetchMyPredictions, savePrediction, fetchLeaderboard, fetchMe, toggleConfidence } from "./lib/league.js";
import { t, subscribeLang } from "./lib/i18n.js";
import { LangToggle, ThemeToggle, Confetti } from "./components/ui.jsx";

// applique le thème mémorisé avant le premier rendu
try { const th = localStorage.getItem("pronos2026:theme"); if (th) document.documentElement.dataset.theme = th; } catch (e) {}
import { AuthScreen, Dashboard } from "./screens/screens1.jsx";
import { MatchesScreen, MatchDetail } from "./screens/screens2.jsx";
import { TableauScreen, Leaderboard, Profile, Rules } from "./screens/screens3.jsx";
import { AdminScreen } from "./screens/admin.jsx";

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
  // true tant qu'on n'a pas vérifié si une session existe déjà (évite le
  // faux écran de connexion au démarrage — la session EST mémorisée).
  const [checkingSession, setCheckingSession] = useState(hasSupabase);
  const [screen, setScreen] = useState(persisted.screen || "home");
  const [params, setParams] = useState(persisted.params || {});
  const [predictions, setPredictions] = useState(hasSupabase ? {} : (persisted.predictions || WC.PREDICTIONS));
  const [profile, setProfile] = useState(persisted.profile || { pseudo: "Toi", avatar: "🎯", email: "", fav: "FRA" });

  // Données réelles (mode Supabase). En démo, on garde les données simulées.
  const [matches, setMatches] = useState(WC.ALL_MATCHES);
  const [users, setUsers] = useState(WC.USERS);

  // Re-render quand on change de langue (FR/JA).
  const [, forceLang] = useState(0);
  useEffect(() => subscribeLang(() => forceLang((x) => x + 1)), []);

  // Confettis quand mes points augmentent depuis la dernière visite.
  const [confetti, setConfetti] = useState(false);
  // Pronos de confiance (×2) : { matchId: true }
  const [confidences, setConfidences] = useState({});

  // Si Supabase est branché, on suit la session réelle
  useEffect(() => {
    if (!hasSupabase) return;
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setAuthed(true);
      setCheckingSession(false);
    }).catch(() => setCheckingSession(false));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setAuthed(Boolean(session));
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // Mode supporter : thème spécial France / Japon selon l'équipe de cœur.
  useEffect(() => {
    document.documentElement.dataset.fan =
      profile.fav === "FRA" ? "fra" : profile.fav === "JPN" ? "jpn" : "";
  }, [profile.fav]);

  // persistance locale (démo + préférences)
  useEffect(() => {
    localStorage.setItem(LS, JSON.stringify({ authed: hasSupabase ? false : authed, screen, params, profile }));
  }, [authed, screen, params, profile]);

  // Charger les vraies données (mode Supabase). Rappelable après une saisie admin.
  async function loadData() {
    if (!hasSupabase) return;
    try {
      const [ms, mine, lb, meRow] = await Promise.all([
        fetchMatches(), fetchMyPredictions(), fetchLeaderboard(), fetchMe(),
      ]);
      if (ms.length) setMatches(ms);
      setPredictions((mine && mine.preds) || {});
      setConfidences((mine && mine.conf) || {});
      if (lb.length) setUsers(lb);
      // points en hausse depuis la dernière visite → confettis 🎉
      if (meRow) {
        const mine = lb.find((u) => u.id === meRow.id);
        if (mine) {
          const key = "pronos2026:lastpts:" + meRow.id;
          const prev = Number(localStorage.getItem(key) || "0");
          if (mine.pts > prev) setConfetti(true);
          localStorage.setItem(key, String(mine.pts));
        }
      }
      if (meRow) setProfile((p) => ({ ...p, id: meRow.id, pseudo: meRow.pseudo || p.pseudo, avatar: meRow.avatar || p.avatar, email: meRow.email || p.email, fav: meRow.fav || p.fav, is_admin: meRow.is_admin }));
    } catch (e) { console.error("Chargement données:", e); }
  }
  useEffect(() => { if (hasSupabase && authed) loadData(); }, [authed]);

  // Resynchronisation : au retour au premier plan (app/onglet rouvert) et
  // toutes les 2 min. Évite les états périmés sur les téléphones où l'app
  // reste ouverte des jours (source du bug "prono fantôme").
  useEffect(() => {
    if (!hasSupabase || !authed) return;
    const onVisible = () => { if (!document.hidden) loadData(); };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    const id = setInterval(() => { if (!document.hidden) loadData(); }, 120000);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
      clearInterval(id);
    };
  }, [authed]);

  function go(s, p = {}) { setScreen(s); setParams(p); window.scrollTo({ top: 0 }); }
  function setPred(id, val) {
    // Verrou : dès le coup d'envoi, plus aucun pari (le serveur refuse aussi via RLS).
    const m = matches.find((x) => x.id === id);
    if (m && m.date <= new Date()) {
      alert(t("🔒 Pronos fermés (coup d'envoi passé)"));
      loadData(); // resynchronise l'écran (statuts verrouillés)
      return;
    }
    setPredictions((P) => ({ ...P, [id]: val }));
    if (hasSupabase) {
      savePrediction(id, val)
        .then((r) => {
          if (r && r.error) {
            alert(t("⚠️ Ton prono n'a PAS été enregistré (connexion ?). Réessaie !") + "\n" + r.error);
            loadData(); // remet l'écran en accord avec le serveur
          }
        })
        .catch(() => {
          alert(t("⚠️ Ton prono n'a PAS été enregistré (connexion ?). Réessaie !"));
          loadData();
        });
    }
  }

  // Pose/retire l'étoile de confiance (un seul match ×2 par jour).
  function setConf(id, on) {
    const m = matches.find((x) => x.id === id);
    if (!m || m.date <= new Date()) { alert(t("🔒 Pronos fermés (coup d'envoi passé)")); return; }
    const sameDay = matches.filter((x) => x.date.toDateString() === m.date.toDateString()).map((x) => x.id);
    setConfidences(() => (on ? { ...stripDay() , [id]: true } : stripDay()));
    function stripDay() {
      const c = { ...confidences };
      sameDay.forEach((mid) => delete c[mid]);
      return c;
    }
    if (hasSupabase) toggleConfidence(id, on, sameDay).then((r) => { if (r && r.error) { console.error("confiance:", r.error); loadData(); } });
  }

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
        if (!data.session) return { info: t("Compte créé ! Vérifie ta boîte mail pour confirmer, puis connecte-toi.") };
        go("home"); return {};
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password: pwd });
        if (error) return { error: traduire(error.message) };
        go("home"); return {};
      }
    } catch (e) {
      return { error: t("Problème de connexion au serveur. Réessaie.") };
    }
  }

  async function logout() {
    if (hasSupabase) await supabase.auth.signOut();
    setAuthed(false);
  }

  const me = (hasSupabase ? users.find((u) => u.id === profile.id) : users.find((u) => u.isMe))
    || { position: users.length || 1, pts: 0, exacts: 0, bons: 0, serie: 0 };
  const aPredire = matches.filter((m) => m.status !== "fini" && m.home && m.away && !predictions[m.id]).length;

  // Pendant la vérification de session : petit splash (pas d'écran de connexion trompeur).
  if (checkingSession && !authed) return (
    <div className="app-root" style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "var(--hero)" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 64, height: 64, borderRadius: 16, margin: "0 auto 14px", background: "linear-gradient(150deg, var(--gold-soft), var(--gold))", color: "#14120a", display: "grid", placeItems: "center", fontFamily: "var(--f-poster)", fontSize: 30 }} className="ball-bounce">26</div>
        <div className="mono" style={{ fontSize: 12, letterSpacing: ".14em", color: "var(--hero-ink)", opacity: .7 }}>…</div>
      </div>
    </div>
  );
  if (!authed) return <AuthScreen onAuth={handleAuth} profile={profile} setProfile={setProfile} demoMode={!hasSupabase} />;

  function render() {
    switch (screen) {
      case "home": return <Dashboard go={go} predictions={predictions} profile={profile} matches={matches} users={users} me={me} />;
      case "matches": return <MatchesScreen go={go} predictions={predictions} setPred={setPred} matches={matches} confidences={confidences} setConf={setConf} />;
      case "match": return <MatchDetail id={params.id} go={go} predictions={predictions} setPred={setPred} matches={matches} confidences={confidences} setConf={setConf} />;
      case "tableau": return <TableauScreen go={go} matches={matches} />;
      case "leaderboard": return <Leaderboard go={go} profile={profile} users={users} me={me} matches={matches} />;
      case "profile": return <Profile profile={profile} setProfile={setProfile} predictions={predictions} matches={matches} me={me} onLogout={logout} />;
      case "rules": return <Rules />;
      case "admin": return <AdminScreen matches={matches} reload={loadData} />;
      default: return <Dashboard go={go} predictions={predictions} profile={profile} matches={matches} users={users} me={me} />;
    }
  }

  const nav = profile.is_admin ? [...NAV, ["admin", "Admin", "🛠️"]] : NAV;
  const activeNav = screen === "match" ? "matches" : screen;

  return (
    <div className="app-root">
      {confetti && <Confetti onDone={() => setConfetti(false)} />}
      <div className="shell">
        <aside className="sidebar">
          <div className="brand">
            <div className="mark">26</div>
            <div><div className="nm">{t("GABRIEL")}</div><div className="sub">{t("Coupe du Monde 2026")}</div></div>
          </div>
          {nav.map(([k, l, ic]) => (
            <button key={k} className={"navitem" + (activeNav === k ? " active" : "")} onClick={() => go(k)}>
              <span className="ic">{ic}</span>{t(l)}
              {k === "matches" && aPredire > 0 && <span className="badge">{aPredire}</span>}
            </button>
          ))}
          {profile.fav === "FRA" && <div className="fanpill fra">🇫🇷 {t("Allez les Bleus !")}</div>}
          {profile.fav === "JPN" && <div className="fanpill jpn">🇯🇵 頑張れ日本！</div>}
          <div style={{ marginTop: "auto", padding: "8px 4px 4px", display: "flex", gap: 8 }}><LangToggle /><ThemeToggle /></div>
          <div className="userchip">
            <div className="av">{profile.avatar}</div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{profile.pseudo}</div>
              <div className="mono muted" style={{ fontSize: 10 }}>#{me.position} · {me.pts} pts</div>
            </div>
            <button className="navitem" style={{ width: "auto", padding: 6, marginLeft: "auto" }} title="Déconnexion" onClick={logout}>⎋</button>
          </div>
        </aside>

        <main className="main">
          <header className="topbar">
            <div className="brand" style={{ padding: 0 }}>
              <div className="mark" style={{ width: 32, height: 32, fontSize: 15 }}>26</div>
              <div className="nm" style={{ fontSize: 15 }}>{t("CDM DE GABRIEL")}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <LangToggle compact />
              <ThemeToggle compact />
              <span className="pill pill--accent" style={{ fontSize: 11 }}>{me.pts} pts · #{me.position}</span>
              <div style={{ width: 30, height: 30, borderRadius: "50%", background: "var(--bg-2)", display: "grid", placeItems: "center" }}>{profile.avatar}</div>
              <button onClick={logout} title={t("Déconnexion")} style={{ border: "1px solid var(--line)", background: "var(--surface-2)", color: "var(--ink)", borderRadius: 8, width: 30, height: 30, fontSize: 14, cursor: "pointer" }}>⎋</button>
            </div>
          </header>
          {render()}
        </main>
      </div>

      <nav className="tabbar">
        {nav.map(([k, l, ic]) => (
          <button key={k} className={"tab" + (activeNav === k ? " active" : "")} onClick={() => go(k)}>
            <span className="ic">{ic}</span>{t(l)}
          </button>
        ))}
      </nav>
    </div>
  );
}

// petites traductions des erreurs Supabase courantes (FR, puis t() vers JA)
function traduire(msg) {
  const m = (msg || "").toLowerCase();
  if (m.includes("already registered") || m.includes("already been registered")) return t("Cet email a déjà un compte. Connecte-toi.");
  if (m.includes("invalid login")) return t("Email ou mot de passe incorrect.");
  if (m.includes("email not confirmed")) return t("Confirme d'abord ton email (regarde tes mails).");
  if (m.includes("password")) return t("Mot de passe trop court (6 caractères minimum).");
  return msg;
}
