/* screens2.jsx — Liste des matchs, saisie de prono, détail d'un match */
import { useState, useMemo, useEffect } from "react";
import { WC } from "../lib/wc.js";
import { fetchMatchPredictions, fetchReactions, setReaction, fetchCotes, fetchScoreDist } from "../lib/league.js";
import { supabase } from "../lib/supabase.js";
import { Btn, Roundel, TeamLine, StatusPill, PointsBadge, slotLabel, teamName } from "../components/ui.jsx";
import { t, tPhase } from "../lib/i18n.js";

/* ---------- Stepper de score ---------- */
export function Stepper({ value, onChange }) {
  return (
    <div className="stepper">
      <button type="button" onClick={() => onChange(Math.max(0, value - 1))}>–</button>
      <span className="val poster">{value}</span>
      <button type="button" onClick={() => onChange(Math.min(19, value + 1))}>+</button>
    </div>
  );
}

/* Saisie complète d'un prono (2 steppers) */
export function PredEditor({ pred, onChange, home, away }) {
  const v = pred || [null, null];
  const a = v[0] == null ? 0 : v[0], b = v[1] == null ? 0 : v[1];
  return (
    <div className="predbox">
      <div style={{ textAlign: "center" }}>
        <Roundel code={home} size={30} />
        <Stepper value={a} onChange={(x) => onChange([x, b])} />
      </div>
      <span className="pred-sep poster" style={{ fontSize: 22 }}>:</span>
      <div style={{ textAlign: "center" }}>
        <Roundel code={away} size={30} />
        <Stepper value={b} onChange={(x) => onChange([a, x])} />
      </div>
    </div>
  );
}

/* Barre "cote de la ligue" : répartition des pronos (victoire / nul / victoire) */
export function CoteBar({ m, cote, compact }) {
  if (!cote || !cote.tot) return null;
  // 1re couleur non blanche de l'équipe (sinon la barre est invisible)
  const teamCol = (code) => {
    const cs = code && WC.T[code] ? WC.T[code].colors : null;
    if (!cs) return "var(--win)";
    return cs.find((c) => c && c.toLowerCase() !== "#ffffff" && c.toLowerCase() !== "#fff") || cs[0];
  };
  const ch = teamCol(m.home), ca = teamCol(m.away);
  return (
    <div className="cotebar" style={compact ? { marginTop: 8 } : null}>
      <div className="cotebar-labels">
        <span style={{ fontWeight: 800 }}>{m.home} {cote.h}%</span>
        <span className="muted">{t("nul")} {cote.n}%</span>
        <span style={{ fontWeight: 800 }}>{cote.a}% {m.away}</span>
      </div>
      <div className="cotebar-track">
        <span style={{ width: cote.h + "%", background: ch }} />
        <span style={{ width: cote.n + "%", background: "color-mix(in oklab, var(--ink) 22%, transparent)" }} />
        <span style={{ width: cote.a + "%", background: ca }} />
      </div>
      {!compact && <div className="mono muted" style={{ fontSize: 10.5, marginTop: 5 }}>{cote.tot} {t("pronos de la ligue").toLowerCase()}</div>}
    </div>
  );
}

/* ---------- Carte match dans la liste ---------- */
/* Étoile "prono de confiance ×2" (1 par jour) */
function ConfStar({ on, onToggle, disabled }) {
  return (
    <button type="button" className={"confstar" + (on ? " on" : "")} disabled={disabled}
      title={on ? t("Confiance ×2 activée") : t("Jouer ma confiance ×2 sur ce match")}
      onClick={(e) => { e.stopPropagation(); onToggle(!on); }}>
      {on ? "⭐ ×2" : "☆ ×2"}
    </button>
  );
}

/* Choix du vainqueur aux tirs au but (phase finale, prono nul) */
export function PenPicker({ m, pick, onPick, compact }) {
  return (
    <div className="penpick" style={compact ? { marginTop: 8 } : null}>
      <span className="mono muted" style={{ fontSize: 12 }}>🥅 {t("Si tirs au but, qui gagne ?")} <b style={{ color: "var(--ink)" }}>(+2)</b></span>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {[m.home, m.away].map((c) => (
          <button key={c} type="button" className={"penbtn" + (pick === c ? " on" : "")}
            onClick={(e) => { e.stopPropagation(); onPick(c); }}>
            <Roundel code={c} size={18} /> {teamName(c, WC.T[c] ? WC.T[c].name : c)}
          </button>
        ))}
      </div>
    </div>
  );
}

function MatchRow({ m, pred, setPred, go, conf, setConf, pick, setPredPen, cote, next, live }) {
  const fini = m.status === "fini";
  const locked = m.locked; // verrouillé : coup d'envoi passé
  const past = (locked || fini) && !live; // passé (grisé) — un match EN COURS n'est pas grisé
  const [a, b] = pred || [null, null];
  const ch = m.home && WC.T[m.home] ? WC.T[m.home].colors[0] : "var(--line)";
  const ca = m.away && WC.T[m.away] ? WC.T[m.away].colors[0] : "var(--line)";
  return (
    <div className={"card pad rise match" + (past ? " match--past" : "") + (next && !live ? " match--next" : "") + (live ? " match--live" : "")}>
      <div className="teamstripe" style={{ background: `linear-gradient(90deg, ${ch} 0 46%, ${ca} 54%)` }} />
      {live && <div className="matchflag is-live"><span className="livedot" /> {t("En direct")}</div>}
      {next && !live && <div className="matchflag is-next">⏰ {t("Prochain match")}</div>}
      <div className="meta" style={{ justifyContent: "space-between" }}>
        <span><b style={{ color: "var(--ink)" }}>{tPhase(m.phase)}</b> · {WC.fmtDate(m.date)} · {WC.fmtHeure(m.date)}</span>
        <span style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span className="muted" style={{ fontSize: 12 }}>{m.venue.city}</span>
          <StatusPill m={m} />
        </span>
      </div>

      <div className="row" style={{ cursor: "pointer" }} onClick={() => go("match", { id: m.id })}>
        {slotLabel(m, "home")}
        <div className="sc">{fini ? (m.score ? `${m.score[0]}–${m.score[1]}` : "–") : <span className="vs">VS</span>}</div>
        {slotLabel(m, "away")}
      </div>
      {fini && m.pens && <div className="mono muted" style={{ fontSize: 11, textAlign: "center", marginTop: -4 }}>t.a.b. {m.pens[0]}–{m.pens[1]}</div>}

      <CoteBar m={m} cote={cote} compact />

      <hr className="divider" style={{ margin: "6px 0" }} />

      {!fini && m.home && m.away && !locked && (
        <>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
            <div className="mono muted" style={{ fontSize: 12 }}>{pred ? t("Ton prono :") : t("Ton prono ?")}</div>
            <PredEditor pred={pred} home={m.home} away={m.away} onChange={(p) => setPred(m.id, p)} />
            <div style={{ minWidth: 120, textAlign: "right", display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-end" }}>
              {pred
                ? <>
                    <ConfStar on={!!conf} onToggle={(on) => setConf(m.id, on)} />
                    <span className="pill pill--accent">✓ {a}–{b}</span>
                  </>
                : <span className="muted" style={{ fontSize: 12 }}>{t("Ajuste puis c'est sauvé")}</span>}
            </div>
          </div>
          {m.round === "ko" && pred && a === b && (
            <PenPicker m={m} pick={pick} onPick={(c) => setPredPen(m.id, c)} compact />
          )}
        </>
      )}
      {!fini && m.home && m.away && locked && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div className="mono" style={{ fontSize: 12 }}>{t("Ton prono :")} <b>{pred ? `${pred[0]}–${pred[1]}` : t("non joué")}</b>{pick ? <span className="muted"> · 🥅 {pick}</span> : null}</div>
          <Btn variant="ghost" onClick={() => go("match", { id: m.id })} style={{ padding: "7px 12px", fontSize: 12.5 }}>👀 {t("Les pronos de la ligue")} →</Btn>
        </div>
      )}
      {!fini && (!m.home || !m.away) && (
        <div className="mono muted" style={{ fontSize: 12, textAlign: "center" }}>{t("Pronostic ouvert dès que les qualifiés sont connus.")}</div>
      )}
      {fini && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div className="mono muted" style={{ fontSize: 12 }}>{t("Ton prono :")} <b style={{ color: "var(--ink)" }}>{pred ? `${pred[0]}–${pred[1]}` : t("non joué")}</b>{pick ? <span> · 🥅 {pick}</span> : null}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {pred ? <PointsBadge pred={pred} real={m.score} /> : <span className="pts pts--zero">0 · {t("pas de prono")}</span>}
            <Btn variant="ghost" onClick={() => go("match", { id: m.id })} style={{ padding: "7px 12px", fontSize: 12.5 }}>👀 {t("Les pronos de la ligue")} →</Btn>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- Écran liste des matchs ---------- */
export function MatchesScreen({ go, predictions, setPred, matches = WC.ALL_MATCHES, confidences = {}, setConf = () => {}, penPicks = {}, setPredPen = () => {} }) {
  const [phase, setPhase] = useState("tous");
  const [filtre, setFiltre] = useState("tous"); // tous | apredire | termines
  const [showPast, setShowPast] = useState(false); // matchs passés repliés par défaut

  // Cotes de la ligue : 1 seul chargement, visibles AVANT les matchs (choix de Gabriel).
  const [cotes, setCotes] = useState({});
  useEffect(() => { fetchCotes().then(setCotes).catch(() => {}); }, [matches]);

  const phases = [
    ["tous", "Tous"], ["group", "Groupes"], ["16es de finale", "16es"], ["8es de finale", "8es"],
    ["Quarts de finale", "Quarts"], ["Demi-finales", "Demies"], ["Finale", "Finale"],
  ];

  const list = useMemo(() => {
    let L = matches.filter((m) => {
      if (phase === "tous") return true;
      if (phase === "group") return m.round === "group";
      return m.phase === phase;
    });
    if (filtre === "apredire") L = L.filter((m) => m.status !== "fini" && m.home && m.away && !predictions[m.id]);
    if (filtre === "termines") L = L.filter((m) => m.status === "fini");
    return [...L].sort((a, b) => a.date - b.date);
  }, [phase, filtre, predictions, matches]);

  const aFaire = matches.filter((m) => m.status !== "fini" && m.home && m.away && !predictions[m.id]).length;

  // Prochain match (le plus proche pas encore commencé) → mis en avant.
  const nextId = useMemo(() => {
    const now = new Date();
    const up = matches.filter((m) => m.date > now && m.status !== "fini").sort((a, b) => a.date - b.date);
    return up.length ? up[0].id : null;
  }, [matches]);

  // Un match est "en cours" : coup d'envoi passé, pas encore fini, dans la fenêtre ~2h30.
  const now = new Date();
  const isLive = (m) => m.status !== "fini" && m.date <= now && (now - m.date) < 2.5 * 3600e3;

  const row = (m) => <MatchRow key={m.id} m={m} pred={predictions[m.id]} setPred={setPred} go={go}
    conf={confidences[m.id]} setConf={setConf} pick={penPicks[m.id]} setPredPen={setPredPen}
    cote={cotes[m.id]} next={m.id === nextId} live={isLive(m)} />;

  // On atterrit sur : matchs en cours (en avant) + prochains. Les passés sont repliés.
  const enCours = list.filter(isLive);
  const passes = list.filter((m) => m.date <= now && !isLive(m));
  const aVenir = list.filter((m) => m.date > now);

  return (
    <div className="content">
      <div className="page-head">
        <div>
          <div className="eyebrow" style={{ marginBottom: 6 }}>{`104 ${t("matchs")} · ${aFaire} ${t("en attente de ton prono")}`}</div>
          <h1 className="page-title poster">{t("Les matchs")} <span className="ball-bounce" style={{ fontSize: "0.65em" }}>⚽</span></h1>
        </div>
        <div className="seg">{[["tous", "Tous"], ["apredire", "À pronostiquer"], ["termines", "Terminés"]].map(([k, l]) => (
          <button key={k} className={filtre === k ? "on" : ""} onClick={() => setFiltre(k)}>{t(l)}</button>))}</div>
      </div>

      <div className="seg scrollx" style={{ marginBottom: 18, display: "flex" }}>
        {phases.map(([k, l]) => <button key={k} className={phase === k ? "on" : ""} onClick={() => setPhase(k)}>{t(l)}</button>)}
      </div>

      {phase === "group" ? (
        Object.keys(WC.GROUPS).map((g) => {
          const gm = list.filter((m) => m.group === g);
          if (!gm.length) return null;
          return (
            <div key={g} style={{ marginBottom: 28 }}>
              <h3 className="poster" style={{ fontSize: 22, margin: "0 0 12px" }}>{t("Groupe")} {g}</h3>
              <div className="grid g-2">{gm.map(row)}</div>
            </div>
          );
        })
      ) : (
        <>
          {/* Matchs passés repliés : un bouton les déroule (grisés) au-dessus des prochains. */}
          {filtre !== "termines" && passes.length > 0 && (
            <button className="pastToggle" onClick={() => setShowPast((v) => !v)}>
              {showPast ? "▴ " + t("Masquer les matchs passés") : "▾ " + `${passes.length} ${t("matchs passés")}`}
            </button>
          )}
          {filtre !== "termines" && showPast && <div className="grid g-2" style={{ marginBottom: 18 }}>{passes.map(row)}</div>}

          {/* Matchs EN COURS, mis en avant tout en haut. */}
          {filtre !== "termines" && enCours.length > 0 && (
            <>
              <div className="eyebrow" style={{ margin: "6px 0 12px" }}>🔴 {t("En direct")}</div>
              <div className="grid g-2" style={{ marginBottom: 18 }}>{enCours.map(row)}</div>
            </>
          )}

          {/* Prochains matchs (mis en avant), ou la liste filtrée telle quelle pour "Terminés". */}
          {filtre !== "termines" && aVenir.length > 0 && (
            <div className="eyebrow" style={{ margin: "6px 0 12px" }}>⚽ {t("Prochains matchs")}</div>
          )}
          <div className="grid g-2">{(filtre === "termines" ? list : aVenir).map(row)}</div>
        </>
      )}
      {list.length === 0 && <div className="card pad-lg" style={{ textAlign: "center" }}><div className="poster" style={{ fontSize: 22 }}>{t("Rien par ici 🎉")}</div><p className="muted">{t("Aucun match dans ce filtre. Les matchs deviennent saisissables une fois le coup d'envoi passé.")}</p></div>}
    </div>
  );
}

/* =================== DÉTAIL D'UN MATCH =================== */
const NOMS_POS = ["GB", "DD", "DC", "DC", "DG", "MDC", "MC", "MC", "AID", "BU", "AIG"];
function pitchPositions() {
  return [
    [50, 8], [82, 24], [62, 20], [38, 20], [18, 24], [50, 38], [68, 46], [32, 46], [80, 64], [50, 72], [20, 64],
  ];
}
function seedNum(code, i) { let s = 0; for (const c of code + i) s = (s * 31 + c.charCodeAt(0)) % 97; return (s % 23) + 1; }

/* ---- Vraies stats, calculées sur les matchs JOUÉS du tournoi ---- */
function teamFinished(code, matches) {
  return (matches || [])
    .filter((x) => x.status === "fini" && x.score && (x.home === code || x.away === code))
    .sort((a, b) => a.date - b.date);
}
function resFor(code, m) {
  const gf = m.home === code ? m.score[0] : m.score[1];
  const ga = m.home === code ? m.score[1] : m.score[0];
  if (gf > ga) return "W";
  if (gf < ga) return "L";
  // nul en phase finale : le vainqueur aux tirs au but compte comme victoire
  if (m.round === "ko" && m.winner) return m.winner === code ? "W" : "L";
  return "N";
}
function teamStats(code, matches) {
  const ms = teamFinished(code, matches);
  let gf = 0, cs = 0, streak = 0;
  ms.forEach((m) => {
    const f = m.home === code ? m.score[0] : m.score[1];
    const a = m.home === code ? m.score[1] : m.score[0];
    gf += f; if (a === 0) cs++;
  });
  for (let i = ms.length - 1; i >= 0; i--) { if (resFor(code, ms[i]) === "W") streak++; else break; }
  return { joues: ms.length, gf, cs, streak };
}

function FormDots({ code, matches }) {
  const seq = teamFinished(code, matches).slice(-5).map((m) => resFor(code, m));
  if (!seq.length) return <span className="mono muted" style={{ fontSize: 11 }}>{t("aucun match joué")}</span>;
  const col = { W: "var(--win)", N: "var(--warn)", L: "var(--lose)" };
  return <div style={{ display: "flex", gap: 4 }}>{seq.map((r, i) => (
    <span key={i} title={r} style={{ width: 18, height: 18, borderRadius: 5, display: "grid", placeItems: "center", fontSize: 10, fontWeight: 800, color: "#fff", background: col[r] }}>{r === "W" ? "V" : r === "N" ? "N" : "D"}</span>
  ))}</div>;
}

function Pitch({ code }) {
  const pos = pitchPositions();
  const t = WC.T[code];
  return (
    <div style={{ position: "relative", aspectRatio: "3/4", background: "color-mix(in oklab, var(--accent) 10%, var(--surface-2))", borderRadius: "var(--r-md)", border: "1px solid var(--line)", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(0deg, transparent 0 11.1%, color-mix(in oklab, var(--ink) 4%, transparent) 11.1% 22.2%)" }} />
      <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: 1, background: "color-mix(in oklab, var(--ink) 10%, transparent)" }} />
      {pos.map(([x, y], i) => (
        <div key={i} style={{ position: "absolute", left: x + "%", bottom: y + "%", transform: "translate(-50%,50%)", textAlign: "center" }}>
          <div style={{ width: 26, height: 26, borderRadius: "50%", background: t.colors[0], color: "#fff", display: "grid", placeItems: "center", fontSize: 11, fontWeight: 800, boxShadow: "0 2px 6px rgba(0,0,0,.25)", border: "1.5px solid rgba(255,255,255,.6)" }}>{seedNum(code, i)}</div>
          <div className="mono" style={{ fontSize: 8.5, marginTop: 2, color: "var(--ink-soft)" }}>{NOMS_POS[i]}</div>
        </div>
      ))}
    </div>
  );
}

/* Les pronos de toute la ligue (après coup d'envoi) + réactions emoji. */
const EMOJIS = ["🔥", "😂", "🤡", "👏", "😱"];
function LeaguePredictions({ m }) {
  const [list, setList] = useState(null);
  const [reactions, setReactions] = useState([]);
  const [meId, setMeId] = useState(null);
  const [pickerFor, setPickerFor] = useState(null);

  async function load() {
    const [l, r, u] = await Promise.all([
      fetchMatchPredictions(m.id).catch(() => []),
      fetchReactions(m.id).catch(() => []),
      supabase.auth.getUser(),
    ]);
    setList(l); setReactions(r); setMeId(u.data.user ? u.data.user.id : null);
  }
  useEffect(() => { let alive = true; load().then(() => {}); return () => { alive = false; }; }, [m.id]);

  if (!list) return null;
  const reactFor = (uid) => reactions.filter((r) => r.target_user === uid);
  const myReact = (uid) => (reactions.find((r) => r.target_user === uid && r.author === meId) || {}).emoji;

  async function react(uid, emoji) {
    setPickerFor(null);
    const cur = myReact(uid);
    await setReaction(m.id, uid, cur === emoji ? null : emoji);
    const r = await fetchReactions(m.id).catch(() => reactions);
    setReactions(r);
  }

  return (
    <div className="card pad rise" style={{ marginBottom: 18 }}>
      <div className="eyebrow" style={{ marginBottom: 12 }}>👀 {t("Les pronos de la ligue")}</div>
      {list.length === 0 && <p className="muted" style={{ margin: 0, fontSize: 13.5 }}>{t("Personne n'a pronostiqué ce match.")}</p>}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
        {list.map((p) => {
          const rs = reactFor(p.user_id);
          const counts = {};
          rs.forEach((r) => (counts[r.emoji] = (counts[r.emoji] || 0) + 1));
          return (
            <div key={p.user_id} className="stat" style={{ padding: "10px 14px", position: "relative" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 20 }}>{p.avatar}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{p.pseudo}{p.confidence ? " ⭐" : ""}</div>
                  <div className="poster" style={{ fontSize: 20 }}>{p.pred_home}–{p.pred_away}{p.pred_pen_winner ? <span className="mono muted" style={{ fontSize: 11, fontFamily: "var(--f-mono)" }}> 🥅{p.pred_pen_winner}</span> : null}</div>
                </div>
                {p.points != null && <span className={"pts " + (p.points >= 5 ? "pts--exact" : p.points > 0 ? "pts--good" : "pts--zero")}>+{p.points}</span>}
              </div>
              <div style={{ display: "flex", gap: 6, marginTop: 6, alignItems: "center", flexWrap: "wrap" }}>
                {Object.entries(counts).map(([e, n]) => (
                  <span key={e} className="pill" style={{ fontSize: 11, padding: "2px 7px" }}>{e} {n > 1 ? n : ""}</span>
                ))}
                {meId && meId !== p.user_id && (
                  <button className="reactbtn" onClick={() => setPickerFor(pickerFor === p.user_id ? null : p.user_id)}>{myReact(p.user_id) || "＋"}</button>
                )}
              </div>
              {pickerFor === p.user_id && (
                <div className="reactpicker">
                  {EMOJIS.map((e) => <button key={e} onClick={() => react(p.user_id, e)}>{e}</button>)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function MatchDetail({ id, go, predictions, setPred, matches = WC.ALL_MATCHES, confidences = {}, setConf = () => {}, penPicks = {}, setPredPen = () => {} }) {
  const m = matches.find((x) => x.id === id);
  const [tab, setTab] = useState("apercu");
  // Cote de la ligue : répartition des pronos (visible AVANT le match, choix de Gabriel)
  const [cote, setCote] = useState(null);
  const [dist, setDist] = useState([]); // scores pronostiqués, anonymes
  useEffect(() => {
    setCote(null); setDist([]);
    fetchCotes().then((map) => setCote(map[id] || null)).catch(() => {});
    fetchScoreDist(id).then(setDist).catch(() => {});
  }, [id]);
  if (!m) return <div className="content"><p>{t("Match introuvable.")}</p></div>;
  const fini = m.status === "fini";
  const open = !fini && m.home && m.away && !m.locked;
  const th = m.home ? WC.T[m.home] : null, ta = m.away ? WC.T[m.away] : null;

  const tabs = [["apercu", "Aperçu"], ["compos", "Compos probables"], ["forme", "Forme & face-à-face"], ["classement", "Contexte groupe"]];

  return (
    <div className="content">
      <button className="btn btn--ghost" style={{ marginBottom: 16, padding: "8px 14px", fontSize: 13 }} onClick={() => go("matches")}>{t("← Tous les matchs")}</button>

      <div className="hero rise" style={{ marginBottom: 18, padding: 26 }}>
        <div className="stripes" />
        <div style={{ position: "relative" }}>
          <div className="mono" style={{ fontSize: 11, letterSpacing: ".14em", opacity: .75, marginBottom: 16 }}>
            {tPhase(m.phase).toUpperCase()} · {WC.fmtDate(m.date).toUpperCase()} · {WC.fmtHeure(m.date)} · {m.venue.stade.toUpperCase()}, {m.venue.city.toUpperCase()}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: 12 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              <Roundel code={m.home} size={62} />
              <div className="poster" style={{ fontSize: 20, textAlign: "center" }}>{th ? teamName(m.home, th.name) : t("Vainqueur") + " " + (m.fromA || "?")}</div>
              {th && <div className="mono" style={{ opacity: .6, fontSize: 11 }}>FIFA #{th.rank}</div>}
            </div>
            <div style={{ textAlign: "center" }}>
              {fini ? <div className="poster" style={{ fontSize: 54 }}>{m.score[0]}–{m.score[1]}</div>
                : <div className="poster" style={{ fontSize: 34, color: "var(--gold-soft)" }}>VS</div>}
              {fini && m.pens && <div className="mono" style={{ fontSize: 11, opacity: .7 }}>t.a.b. {m.pens[0]}–{m.pens[1]}</div>}
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              <Roundel code={m.away} size={62} />
              <div className="poster" style={{ fontSize: 20, textAlign: "center" }}>{ta ? teamName(m.away, ta.name) : t("Vainqueur") + " " + (m.fromB || "?")}</div>
              {ta && <div className="mono" style={{ opacity: .6, fontSize: 11 }}>FIFA #{ta.rank}</div>}
            </div>
          </div>
        </div>
      </div>

      {open && (
        <div className="card pad-lg rise" style={{ marginBottom: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14 }}>
            <div>
              <div className="eyebrow" style={{ marginBottom: 4 }}>{t("Ton pronostic")}</div>
              <div className="muted" style={{ fontSize: 13 }}>{t("Score exact")} = {WC.BAREME.exact} pts · {t("Bon résultat").toLowerCase()} = {WC.BAREME.issue} pts · {t("bon écart")} = {WC.BAREME.ecart} pts</div>
            </div>
            <PredEditor pred={predictions[m.id]} home={m.home} away={m.away} onChange={(p) => setPred(m.id, p)} />
            <div style={{ minWidth: 130, textAlign: "right", display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-end" }}>
              {predictions[m.id]
                ? <>
                    <ConfStar on={!!confidences[m.id]} onToggle={(on) => setConf(m.id, on)} />
                    <span className="pill pill--accent">✓ {predictions[m.id][0]}–{predictions[m.id][1]}</span>
                  </>
                : <span className="muted">{t("Règle les compteurs")}</span>}
            </div>
          </div>
          {m.round === "ko" && predictions[m.id] && predictions[m.id][0] === predictions[m.id][1] && (
            <PenPicker m={m} pick={penPicks[m.id]} onPick={(c) => setPredPen(m.id, c)} />
          )}
        </div>
      )}
      {!fini && m.home && m.away && m.locked && (
        <div className="card pad rise" style={{ marginBottom: 18 }}>
          <div className="mono" style={{ fontSize: 13 }}>{t("🔒 Pronos fermés (coup d'envoi passé)")} — <b>{predictions[m.id] ? `${predictions[m.id][0]}–${predictions[m.id][1]}` : t("non joué")}</b>{penPicks[m.id] ? <span className="muted"> · 🥅 {penPicks[m.id]}</span> : null}</div>
        </div>
      )}
      {fini && (
        <div className="card pad rise" style={{ marginBottom: 18, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div className="mono" style={{ fontSize: 13 }}>{t("TON PRONO :")} <b>{predictions[m.id] ? `${predictions[m.id][0]}–${predictions[m.id][1]}` : t("non joué")}</b>{penPicks[m.id] ? <span className="muted"> · 🥅 {penPicks[m.id]}</span> : null} · {t("RÉSULTAT :")} <b>{m.score[0]}–{m.score[1]}</b>{m.winner && m.score[0] === m.score[1] ? <span className="muted"> · 🥅 {m.winner}</span> : null}</div>
          {predictions[m.id] ? <PointsBadge pred={predictions[m.id]} real={m.score} /> : <span className="pts pts--zero">0 pt</span>}
        </div>
      )}

      {cote && cote.tot > 0 && (
        <div className="card pad rise" style={{ marginBottom: 18 }}>
          <div className="eyebrow" style={{ marginBottom: 10 }}>📊 {t("Cote de la ligue")}</div>
          <CoteBar m={m} cote={cote} />
          {dist.length > 0 && (
            <>
              <div className="mono muted" style={{ fontSize: 11, margin: "12px 0 6px" }}>
                {t("Scores pronostiqués")}{!m.locked && !fini ? " · " + t("anonymes jusqu'au coup d'envoi") : ""}
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {dist.map((d, i) => (
                  <span key={i} className="pill" style={{ fontSize: 13, fontWeight: 800 }}>
                    {d.pred_home}–{d.pred_away}{Number(d.nb) > 1 ? <span className="muted" style={{ fontWeight: 600 }}> ×{d.nb}</span> : null}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {(m.locked || fini) && <LeaguePredictions m={m} />}

      <div className="seg scrollx" style={{ marginBottom: 16, display: "flex" }}>
        {tabs.map(([k, l]) => <button key={k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>{t(l)}</button>)}
      </div>

      {tab === "apercu" && th && ta && (
        <div className="grid g-2">
          <div className="card pad">
            <div className="eyebrow" style={{ marginBottom: 12 }}>{t("Confrontation")}</div>
            {[[t("Classement FIFA"), `#${th.rank}`, `#${ta.rank}`], [t("Confédération"), th.conf, ta.conf],
              [t("Forme (5 derniers)"), "form-h", "form-a"],
              [t("Cote de la ligue"), cote ? `${cote.h}%` : "—", cote ? `${cote.a}%` : "—"]].map((r, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: 10, padding: "10px 0", borderTop: i ? "1px solid var(--line)" : "none" }}>
                <div style={{ fontWeight: 700 }}>{r[1] === "form-h" ? <FormDots code={m.home} matches={matches} /> : r[1]}</div>
                <div className="mono muted" style={{ fontSize: 11, textAlign: "center" }}>{r[0]}</div>
                <div style={{ fontWeight: 700, textAlign: "right", display: "flex", justifyContent: "flex-end" }}>{r[2] === "form-a" ? <FormDots code={m.away} matches={matches} /> : r[2]}</div>
              </div>
            ))}
            <p className="mono muted" style={{ fontSize: 10.5, margin: "8px 0 0" }}>{t("Forme = matchs de ce tournoi · cote = % des pronos de la ligue (vainqueur seulement, jamais les scores).")}</p>
          </div>
          <div className="card pad">
            <div className="eyebrow" style={{ marginBottom: 12 }}>{t("Infos match")}</div>
            <div className="grid g-2 keep" style={{ gap: 10 }}>
              {[[t("📍 Stade"), m.venue.stade], [t("🏙️ Ville"), m.venue.city], [t("📅 Date"), WC.fmtDate(m.date)], [t("⏰ Coup d'envoi"), WC.fmtHeure(m.date)], [t("🏆 Phase"), tPhase(m.phase)], [t("📆 Jour du tournoi"), t("Jour") + " " + (Math.floor((m.date - new Date(2026, 5, 11)) / 86400e3) + 1)]].map(([l, v], i) => (
                <div key={i} className="stat" style={{ padding: 12 }}><div className="l" style={{ marginBottom: 2 }}>{l}</div><div style={{ fontWeight: 700, fontSize: 15 }}>{v}</div></div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "compos" && th && ta && (
        <div className="grid g-2">
          {[m.home, m.away].map((c) => (
            <div className="card pad" key={c}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <TeamLine code={c} bold showCode={false} size={28} />
                <span className="pill">4-3-3</span>
              </div>
              <Pitch code={c} />
              <p className="mono muted" style={{ fontSize: 11, marginTop: 10 }}>{t("Compo probable (illustration).")}</p>
            </div>
          ))}
        </div>
      )}

      {tab === "forme" && th && ta && (
        <div className="grid g-2">
          {[m.home, m.away].map((c) => {
            const st = teamStats(c, matches);
            return (
              <div className="card pad" key={c}>
                <TeamLine code={c} bold showCode={false} size={28} />
                <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "14px 0" }}><span className="muted" style={{ fontSize: 13 }}>{t("5 derniers :")}</span><FormDots code={c} matches={matches} /></div>
                <div className="grid g-3 keep2" style={{ gap: 10 }}>
                  {[[t("Buts marqués"), st.gf], [t("Clean sheets"), st.cs], [t("Série"), st.streak ? st.streak + " V" : "—"]].map(([l, v], i) => (
                    <div className="stat" key={i} style={{ padding: 12 }}><div className="n" style={{ fontSize: 24 }}>{v}</div><div className="l">{l}</div></div>
                  ))}
                </div>
                <p className="mono muted" style={{ fontSize: 10.5, margin: "10px 0 0" }}>{st.joues} {t("match(s) joué(s) dans ce tournoi")}</p>
              </div>
            );
          })}
          {(() => {
            const h2h = matches.filter((x) => x.id !== m.id && x.status === "fini" && x.score
              && ((x.home === m.home && x.away === m.away) || (x.home === m.away && x.away === m.home)));
            if (!h2h.length) return (
              <div className="card pad" style={{ gridColumn: "1 / -1", textAlign: "center" }}>
                <div className="eyebrow" style={{ marginBottom: 6 }}>{t("Face-à-face (dans ce tournoi)")}</div>
                <p className="muted" style={{ margin: 0, fontSize: 13.5 }}>🤝 {t("Premier duel entre ces deux équipes dans ce tournoi.")}</p>
              </div>
            );
            const wH = h2h.filter((x) => resFor(m.home, x) === "W").length;
            const wA = h2h.filter((x) => resFor(m.away, x) === "W").length;
            return (
              <div className="card pad" style={{ gridColumn: "1 / -1" }}>
                <div className="eyebrow" style={{ marginBottom: 10 }}>{t("Face-à-face (dans ce tournoi)")}</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", textAlign: "center", alignItems: "center" }}>
                  <div><div className="poster" style={{ fontSize: 30 }}>{wH}</div><TeamLine code={m.home} showCode={false} size={20} /></div>
                  <div><div className="poster" style={{ fontSize: 30 }}>{h2h.length - wH - wA}</div><div className="mono muted" style={{ fontSize: 11 }}>{t("NULS")}</div></div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}><div className="poster" style={{ fontSize: 30 }}>{wA}</div><TeamLine code={m.away} reverse showCode={false} size={20} /></div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {tab === "classement" && (
        m.round === "group" ? <GroupTable g={m.group} matches={matches} /> :
          <div className="card pad-lg" style={{ textAlign: "center" }}><div className="poster" style={{ fontSize: 22 }}>{t("Phase finale")}</div><p className="muted">{t("Pas de classement de groupe ici.")}</p><Btn variant="ghost" onClick={() => go("tableau")}>{t("Voir le tableau →")}</Btn></div>
      )}
    </div>
  );
}

/* tableau d'un groupe (réutilisé) */
export function GroupTable({ g, matches }) {
  const s = matches
    ? WC.computeGroupStandings(matches.filter((m) => m.group === g), WC.GROUPS[g])
    : WC.STANDINGS[g];
  return (
    <div className="card pad">
      <div className="eyebrow" style={{ marginBottom: 10 }}>{t("Groupe")} {g} — {t("classement")}</div>
      <div className="tblwrap"><table className="tbl tbl-group">
        <thead><tr><th></th><th>{t("Équipe")}</th><th>{t("J")}</th><th>{t("Diff")}</th><th>Pts</th></tr></thead>
        <tbody>
          {s.map((r, i) => (
            <tr key={r.code} style={i < 2 ? { fontWeight: 700 } : i === 2 ? {} : { opacity: .6 }}>
              <td className={"rank-n " + (i < 2 ? "rk-q" : i === 2 ? "rk-r" : "")}>{i + 1}</td>
              <td>
                <div className="teamcell">
                  <Roundel code={r.code} size={20} />
                  <span className="tname" title={teamName(r.code, WC.T[r.code].name)}>{teamName(r.code, WC.T[r.code].name)}</span>
                </div>
              </td>
              <td className="mono">{r.j}</td><td className="mono">{r.diff > 0 ? "+" + r.diff : r.diff}</td>
              <td className="mono" style={{ fontWeight: 800 }}>{r.pts}</td>
            </tr>
          ))}
        </tbody>
      </table></div>
    </div>
  );
}
