/* screens1.jsx — Auth + Dashboard */
import { useState } from "react";
import { WC } from "../lib/wc.js";
import { Btn, StatusPill, slotLabel, LangToggle, Countdown } from "../components/ui.jsx";
import { t, tPhase } from "../lib/i18n.js";

// Lots affichés en podium sur l'écran d'accueil.
const PODIUM_LOTS = [
  { place: 1, medal: "🥇", emoji: "🍽️", lot: "Une journée + resto avec Gabriel" },
  { place: 2, medal: "🥈", emoji: "🍔", lot: "Un McDo offert par Gabriel" },
  { place: 3, medal: "🥉", emoji: "🎁", lot: "Un cadeau mystère" },
];

/* ============================= AUTH ============================= */
/* onAuth(mode, { email, pwd, pseudo, avatar }) -> Promise. Renvoie une
   erreur (string) en cas d'échec, sinon connecte. demoMode affiche un bandeau. */
export function AuthScreen({ onAuth, profile, setProfile, demoMode }) {
  const [mode, setMode] = useState("signup"); // signup | login
  const AV = ["⚽", "🦁", "🔥", "🚀", "👑", "🎯", "🐺", "🦅", "🧤", "🐉", "⭐", "🥅"];
  const [email, setEmail] = useState("");
  const [pseudo, setPseudo] = useState(profile.pseudo === "Toi" ? "" : profile.pseudo);
  const [pwd, setPwd] = useState("");
  const [av, setAv] = useState(profile.avatar || "🎯");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");

  const valid = mode === "login"
    ? email.includes("@") && pwd.length >= 4
    : email.includes("@") && pwd.length >= 6 && pseudo.trim().length >= 2;

  async function submit(e) {
    e.preventDefault();
    if (!valid || busy) return;
    setBusy(true); setErr(""); setInfo("");
    setProfile((p) => ({ ...p, pseudo: pseudo.trim() || "Toi", avatar: av, email }));
    const res = await onAuth(mode, { email, pwd, pseudo: pseudo.trim(), avatar: av });
    setBusy(false);
    if (res && res.error) setErr(res.error);
    else if (res && res.info) setInfo(res.info);
  }

  return (
    <div className="app-root auth-grid">
      {/* Panneau visuel */}
      <div className="auth-visual" style={{ background: "var(--hero)", color: "var(--hero-ink)", position: "relative", overflow: "hidden", padding: "48px", display: "flex", flexDirection: "column", justifyContent: "flex-start", gap: 28 }}>
        <div className="stripes" style={{ position: "absolute", inset: 0, opacity: .1, background: "repeating-linear-gradient(115deg, transparent 0 26px, var(--gold) 26px 28px)" }} />
        <div className="bunting" />
        <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "linear-gradient(150deg, var(--gold-soft), var(--gold))", color: "#14120a", display: "grid", placeItems: "center", fontFamily: "var(--f-poster)", fontSize: 20 }}>26</div>
          <div>
            <div className="poster" style={{ fontSize: 20, lineHeight: .9, whiteSpace: "nowrap" }}>{t("LA CDM DE GABRIEL")}</div>
            <div className="mono" style={{ fontSize: 10, letterSpacing: ".16em", opacity: .7, whiteSpace: "nowrap" }}>{t("ENTRE POTES")} · USA · CANADA · MEXIQUE</div>
          </div>
        </div>
        <div style={{ position: "relative", width: "100%" }}>
          <div className="mono" style={{ fontSize: 12, letterSpacing: ".14em", opacity: .7, marginBottom: 10 }}>{t("LA LIGUE PRIVÉE DE GABRIEL & SES POTES")}</div>
          <div className="poster" style={{ fontSize: "clamp(30px,3.8vw,52px)", lineHeight: .92 }}>{t("PRONOSTIQUE.")}</div>
          <div className="poster" style={{ fontSize: "clamp(30px,3.8vw,52px)", lineHeight: .92, color: "var(--gold-soft)" }}>{t("RAFLE LE PODIUM. 🏆")}</div>

          {/* PODIUM DES LOTS */}
          <div className="mono" style={{ fontSize: 11, letterSpacing: ".16em", opacity: .6, margin: "26px 0 12px" }}>{t("CE QUE TU PEUX GAGNER")}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.18fr 1fr", gap: 12, alignItems: "end", maxWidth: 460 }}>
            {[PODIUM_LOTS[1], PODIUM_LOTS[0], PODIUM_LOTS[2]].map((s) => {
              const first = s.place === 1;
              return (
                <div key={s.place} style={{
                  borderRadius: 18,
                  padding: first ? "22px 12px 18px" : "16px 10px 14px",
                  textAlign: "center",
                  background: first ? "linear-gradient(165deg, var(--gold-soft), var(--gold))" : "rgba(255,255,255,.06)",
                  color: first ? "#1a1607" : "var(--hero-ink)",
                  border: first ? "none" : "1px solid rgba(255,255,255,.14)",
                  boxShadow: first ? "0 18px 44px rgba(212,165,51,.4)" : "none",
                  transform: first ? "translateY(-6px)" : "none",
                }}>
                  <div style={{ fontSize: first ? 38 : 28, lineHeight: 1 }}>{s.emoji}</div>
                  <div className="poster" style={{ fontSize: first ? 14 : 12, marginTop: 8, opacity: first ? 1 : .75 }}>{s.medal} {s.place === 1 ? "1ER" : s.place + "E"}</div>
                  <div style={{ fontWeight: 800, fontSize: first ? 13.5 : 12, marginTop: 7, lineHeight: 1.25 }}>{t(s.lot)}</div>
                </div>
              );
            })}
          </div>
          <div className="mono" style={{ fontSize: 11, opacity: .65, marginTop: 14, maxWidth: 460 }}>
            {t("🥄 Et le dernier du classement… paie le McDo de Gabriel.")}
          </div>
        </div>
        <div style={{ position: "relative", display: "flex", gap: 26, flexWrap: "wrap", marginTop: "auto", paddingTop: 24 }}>
          {[["48", "équipes"], ["104", "matchs"], ["39", "jours"]].map(([n, l]) => (
            <div key={l}><div className="poster" style={{ fontSize: 34, color: "var(--gold-soft)" }}>{n}</div><div className="mono" style={{ fontSize: 11, opacity: .7 }}>{t(l)}</div></div>
          ))}
        </div>
      </div>

      {/* Formulaire */}
      <div style={{ display: "grid", placeItems: "center", padding: "32px", background: "var(--bg)" }}>
        <form onSubmit={submit} style={{ width: "100%", maxWidth: 380 }} className="rise">
          {demoMode && (
            <div className="alert" style={{ background: "var(--chip)", color: "var(--ink-soft)", marginBottom: 16, fontSize: 12.5 }}>
              🧪 Mode démo — Supabase pas encore branché. Tu peux explorer, mais les comptes ne sont pas (encore) partagés.
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}><LangToggle /></div>
          <div className="seg" style={{ marginBottom: 22 }}>
            <button type="button" className={mode === "signup" ? "on" : ""} onClick={() => { setMode("signup"); setErr(""); setInfo(""); }}>{t("Créer un compte")}</button>
            <button type="button" className={mode === "login" ? "on" : ""} onClick={() => { setMode("login"); setErr(""); setInfo(""); }}>{t("Se connecter")}</button>
          </div>

          <h2 className="disp" style={{ fontSize: 26, margin: "0 0 4px" }}>{mode === "signup" ? t("Rejoins la ligue") : t("Content de te revoir")}</h2>
          <p className="muted" style={{ marginTop: 0, fontSize: 14 }}>{mode === "signup" ? t("Inscription par email — 30 secondes.") : t("Reprends tes pronos là où tu les as laissés.")}</p>

          <div className="field" style={{ marginTop: 18 }}>
            <label>{t("Adresse email")}</label>
            <input className="input" type="email" placeholder="toi@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          {mode === "signup" && (
            <div className="field">
              <label>{t("Pseudo (visible au classement)")}</label>
              <input className="input" placeholder="ex. GégéLaFrappe" value={pseudo} maxLength={16} onChange={(e) => setPseudo(e.target.value)} />
            </div>
          )}

          <div className="field">
            <label>{t("Mot de passe")} {mode === "signup" && <span className="muted" style={{ fontWeight: 400 }}>(6+)</span>}</label>
            <input className="input" type="password" placeholder="••••••••" value={pwd} onChange={(e) => setPwd(e.target.value)} />
          </div>

          {mode === "signup" && (
            <div className="field">
              <label>{t("Choisis ton avatar")}</label>
              <div className="av-grid">
                {AV.map((a) => (
                  <button type="button" key={a} className={av === a ? "on" : ""} onClick={() => setAv(a)}>{a}</button>
                ))}
              </div>
            </div>
          )}

          {err && <div className="alert alert--err" style={{ marginBottom: 12 }}>{err}</div>}
          {info && <div className="alert alert--ok" style={{ marginBottom: 12 }}>{info}</div>}

          <Btn variant="accent block lg" type="submit" disabled={!valid || busy} style={{ marginTop: 8 }}>
            {busy ? "…" : mode === "signup" ? t("Créer mon compte →") : t("Se connecter →")}
          </Btn>
          <p className="muted" style={{ fontSize: 12, textAlign: "center", marginTop: 14 }}>
            {mode === "signup" ? t("En t'inscrivant tu acceptes de chambrer dans le respect.") : t("Mot de passe oublié ? Demande à l'admin de la ligue.")}
          </p>
        </form>
      </div>
    </div>
  );
}

/* ============================= DASHBOARD ============================= */
export function Dashboard({ go, predictions, profile, matches = WC.ALL_MATCHES, users = WC.USERS, me: meStats }) {
  const me = { ...(meStats || WC.ME), pseudo: profile.pseudo, avatar: profile.avatar };
  const top3 = users.slice(0, 3);
  while (top3.length < 3) top3.push({ id: "ph" + top3.length, pseudo: "—", avatar: "·", pts: 0 });

  const aPredire = matches
    .filter((m) => m.status !== "fini" && m.home && m.away && !predictions[m.id])
    .sort((a, b) => a.date - b.date).slice(0, 4);
  const totalAvenir = matches.filter((m) => m.status !== "fini" && m.home && m.away).length;
  const faits = matches.filter((m) => m.status !== "fini" && m.home && m.away && predictions[m.id]).length;

  const prochain = matches.filter((m) => m.status !== "fini" && m.home && m.away).sort((a, b) => a.date - b.date)[0];

  // matchs du jour (pour la bannière festive)
  const now = new Date();
  const today = matches.filter((m) => m.home && m.away && m.date.toDateString() === now.toDateString());

  return (
    <div className="content">
      {today.length > 0 && (
        <div className="matchday rise">
          <span className="ball-bounce" style={{ fontSize: 22 }}>⚽</span>
          <span>{t("JOUR DE MATCH !")} {today.length} {today.length > 1 ? t("matchs aujourd'hui") : t("match aujourd'hui")} — {t("fais tes pronos avant le coup d'envoi !")}</span>
        </div>
      )}
      <div className="hero rise" style={{ marginBottom: 22 }}>
        <div className="stripes" />
        <div className="bunting" />
        <div className="spot" />
        <div style={{ position: "relative", display: "flex", justifyContent: "space-between", gap: 24, flexWrap: "wrap", alignItems: "flex-end", paddingTop: 14 }}>
          <div>
            <div className="mono" style={{ fontSize: 12, letterSpacing: ".14em", opacity: .7 }}>{t("SALUT")} {me.pseudo.toUpperCase()} 👋 · {t("TA POSITION")}</div>
            <div className="big">#{me.position}</div>
            <div style={{ display: "flex", gap: 22, marginTop: 6, flexWrap: "wrap" }}>
              <div><b className="poster" style={{ fontSize: 26 }}>{me.pts}</b> <span className="mono" style={{ fontSize: 11, opacity: .7 }}>{t("PTS")}</span></div>
              <div><b className="poster" style={{ fontSize: 26 }}>{me.exacts}</b> <span className="mono" style={{ fontSize: 11, opacity: .7 }}>{t("SCORES EXACTS")}</span></div>
              <div><b className="poster" style={{ fontSize: 26 }}>🔥 {me.serie}</b> <span className="mono" style={{ fontSize: 11, opacity: .7 }}>{t("SÉRIE EN COURS")}</span></div>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div className="mono" style={{ fontSize: 11, opacity: .7, marginBottom: 4 }}>{faits}/{totalAvenir} {t("PRONOS À VENIR SAISIS")}</div>
            <Btn variant="gold lg" onClick={() => go("matches")} style={{ whiteSpace: "nowrap" }}>{t("⚡ Faire mes pronos")}</Btn>
          </div>
        </div>
      </div>

      <div className="grid dash-top" style={{ marginBottom: 22 }}>
        <div className="card pad rise">
          <div className="eyebrow" style={{ marginBottom: 12 }}>{t("Prochain coup d'envoi")}</div>
          {prochain && (
            <div className="match">
              <div className="cd-banner">⏱️ <Countdown date={prochain.date} /></div>
              <div className="row">
                {slotLabel(prochain, "home")}
                <div style={{ textAlign: "center" }}>
                  <div className="poster" style={{ fontSize: 16 }}>{WC.fmtHeure(prochain.date)}</div>
                  <div className="mono muted" style={{ fontSize: 11 }}>{WC.fmtDate(prochain.date)}</div>
                </div>
                {slotLabel(prochain, "away")}
              </div>
              <div className="meta" style={{ justifyContent: "space-between" }}>
                <span>{tPhase(prochain.phase)} · {prochain.venue.stade}, {prochain.venue.city}</span>
                <Btn variant="ghost" onClick={() => go("match", { id: prochain.id })} style={{ padding: "8px 14px", fontSize: 13 }}>{t("Pronostiquer →")}</Btn>
              </div>
            </div>
          )}
        </div>
        <div className="grid g-2 keep" style={{ gap: 12 }}>
          {[["#" + me.position, "Classement"], [me.pts + " pts", "Total"], [me.exacts, "Scores exacts"], [me.bons, "Bons résultats"]].map(([n, l], i) => (
            <div className="stat rise" key={i}><div className="n">{n}</div><div className="l">{t(l)}</div></div>
          ))}
        </div>
      </div>

      <div className="card pad-lg rise" style={{ marginBottom: 22 }}>
        <div className="page-head" style={{ marginBottom: 18 }}>
          <div><div className="eyebrow" style={{ marginBottom: 6 }}>{t("À la fin du tournoi")}</div><h2 className="poster" style={{ fontSize: 28, margin: 0 }}>{t("Le podium & les lots")}</h2></div>
          <Btn variant="ghost" onClick={() => go("leaderboard")}>{t("Voir le classement →")}</Btn>
        </div>
        <div className="podium">
          {[top3[1], top3[0], top3[2]].map((u, i) => {
            const place = i === 1 ? 1 : i === 0 ? 2 : 3;
            const prize = WC.PRIZES.find((p) => p.rang === place);
            return (
              <div className={"pcol p" + place} key={u.id}>
                <div className="medal">{place === 1 ? "🏆 1ER" : place === 2 ? "🥈 2E" : "🥉 3E"}</div>
                <div className="av">{u.avatar}</div>
                <div className="ps">{u.pseudo}</div>
                <div className="mono" style={{ fontSize: 12, opacity: .8, marginTop: 2 }}>{u.pts} pts</div>
                <div style={{ marginTop: 10, fontSize: 13, fontWeight: 700 }}>{t(prize.lot)}</div>
                <div style={{ fontSize: 11.5, opacity: .8 }}>{t(prize.titre)}</div>
              </div>
            );
          })}
        </div>
        <div className="mono muted" style={{ fontSize: 11.5, marginTop: 14, textAlign: "center" }}>
          {t("🥄 Et le dernier du classement… paie le McDo de Gabriel.")}
        </div>
      </div>

      <div className="page-head" style={{ marginBottom: 14 }}>
        <h2 className="poster" style={{ fontSize: 24, margin: 0 }}>{t("À pronostiquer maintenant")}</h2>
        <Btn variant="ghost" onClick={() => go("matches")}>{t("Tout voir →")}</Btn>
      </div>
      <div className="grid g-2">
        {aPredire.map((m) => (
          <button key={m.id} className="card pad rise" style={{ textAlign: "left", cursor: "pointer", border: "1px solid var(--line)" }} onClick={() => go("match", { id: m.id })}>
            <div className="match">
              <div className="meta" style={{ justifyContent: "space-between" }}>
                <span>{tPhase(m.phase)}</span><StatusPill m={m} />
              </div>
              <div className="row">
                {slotLabel(m, "home")}
                <span className="vs">{t("VS")}</span>
                {slotLabel(m, "away")}
              </div>
              <div className="mono muted" style={{ fontSize: 11.5 }}>{WC.fmtDate(m.date)} · {WC.fmtHeure(m.date)} · {m.venue.city}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
