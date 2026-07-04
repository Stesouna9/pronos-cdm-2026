/* admin.jsx — écran réservé à l'admin (Gabriel) : scores + gestion des joueurs. */
import { useState, useEffect } from "react";
import { WC } from "../lib/wc.js";
import { saveScore, clearScore, fetchAllUsers, setBanned, fetchPredProgress, setMatchTeams } from "../lib/league.js";
import { Roundel, Btn, SectionTitle } from "../components/ui.jsx";
import { t, tPhase } from "../lib/i18n.js";

function nameOf(m, side) {
  const code = side === "home" ? m.home : m.away;
  return (WC.T[code] && WC.T[code].name) || (side === "home" ? m.homeName : m.awayName) || code || "—";
}

function AdminRow({ m, onSaved }) {
  const [a, setA] = useState(m.score ? m.score[0] : 0);
  const [b, setB] = useState(m.score ? m.score[1] : 0);
  const [w, setW] = useState(m.winner || "");                       // vainqueur t.a.b. (phase finale)
  const [pa, setPa] = useState(m.pens ? m.pens[0] : "");            // tirs marqués (optionnel)
  const [pb, setPb] = useState(m.pens ? m.pens[1] : "");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const fini = m.status === "fini";
  const isKo = m.round === "ko";
  const draw = Number(a) === Number(b);

  async function save() {
    setMsg("");
    const winner = Number(a) > Number(b) ? m.home : Number(b) > Number(a) ? m.away : (isKo ? w : null);
    if (isKo && draw && !winner) { setMsg("Erreur : " + t("choisis le vainqueur aux tirs au but")); return; }
    setBusy(true);
    const pens = isKo && draw && pa !== "" && pb !== "" ? [Number(pa), Number(pb)] : null;
    const r = await saveScore(m.id, Number(a), Number(b), winner, pens);
    setBusy(false);
    if (r.error) setMsg("Erreur : " + r.error);
    else { setMsg("✓ Score enregistré, points calculés"); onSaved && onSaved(); }
  }
  async function reopen() {
    setBusy(true); setMsg("");
    await clearScore(m.id);
    setBusy(false); setMsg("Match rouvert");
    onSaved && onSaved();
  }

  const num = { width: 56, textAlign: "center", padding: "8px 6px" };
  return (
    <div className="card pad admin-row" style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
      <div style={{ minWidth: 150, fontSize: 12 }} className="mono muted">
        <b style={{ color: "var(--ink)" }}>{tPhase(m.phase)}</b><br />{WC.fmtDate(m.date)} · {WC.fmtHeure(m.date)}
      </div>
      <div className="admin-teams" style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 220, justifyContent: "center" }}>
        <Roundel code={m.home} size={20} /><span style={{ fontWeight: 700, minWidth: 90, textAlign: "right" }}>{nameOf(m, "home")}</span>
        <input className="input" type="number" min="0" max="30" style={num} value={a} onChange={(e) => setA(e.target.value)} />
        <span className="poster">:</span>
        <input className="input" type="number" min="0" max="30" style={num} value={b} onChange={(e) => setB(e.target.value)} />
        <span style={{ fontWeight: 700, minWidth: 90 }}>{nameOf(m, "away")}</span><Roundel code={m.away} size={20} />
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center", minWidth: 180, justifyContent: "flex-end" }}>
        <Btn variant="accent" onClick={save} disabled={busy} style={{ padding: "8px 14px", fontSize: 13 }}>{fini ? t("Corriger") : t("Valider")}</Btn>
        {fini && <Btn variant="ghost" onClick={reopen} disabled={busy} style={{ padding: "8px 12px", fontSize: 12 }}>{t("Rouvrir")}</Btn>}
      </div>
      {isKo && draw && (
        <div style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", justifyContent: "center", paddingTop: 6, borderTop: "1px dashed var(--line)" }}>
          <span className="mono muted" style={{ fontSize: 12 }}>🥅 {t("Vainqueur aux tirs au but :")}</span>
          {[m.home, m.away].map((c) => (
            <button key={c} type="button" className={"penbtn" + (w === c ? " on" : "")} onClick={() => setW(c)}>
              <Roundel code={c} size={16} /> {nameOf(m, c === m.home ? "home" : "away")}
            </button>
          ))}
          <span className="mono muted" style={{ fontSize: 11 }}>{t("t.a.b. (option) :")}</span>
          <input className="input" type="number" min="0" max="30" style={{ width: 48, textAlign: "center", padding: "6px 4px" }} value={pa} onChange={(e) => setPa(e.target.value)} />
          <span>–</span>
          <input className="input" type="number" min="0" max="30" style={{ width: 48, textAlign: "center", padding: "6px 4px" }} value={pb} onChange={(e) => setPb(e.target.value)} />
        </div>
      )}
      {msg && <div className="mono" style={{ fontSize: 11, width: "100%", textAlign: "right", color: msg.startsWith("Erreur") ? "var(--lose)" : "var(--win)" }}>{msg}</div>}
    </div>
  );
}

/* --- Gestion des joueurs : liste + bannir/débannir --- */
function PlayersAdmin({ reload }) {
  const [users, setUsers] = useState(null);
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");

  async function load() {
    try { setUsers(await fetchAllUsers()); } catch (e) { setErr(e.message); }
  }
  useEffect(() => { load(); }, []);

  async function toggle(u) {
    if (!u.banned && !window.confirm(`${t("Bannir")} ${u.pseudo} ? ${t("Il disparaîtra du classement et ne pourra plus pronostiquer.")}`)) return;
    setBusy(u.id); setErr("");
    const r = await setBanned(u.id, !u.banned);
    setBusy("");
    if (r.error) { setErr(r.error); return; }
    await load();
    reload && reload();
  }

  if (!users) return <div className="card pad-lg" style={{ textAlign: "center" }}><p className="muted">…</p></div>;
  return (
    <>
      <div className="card pad rise" style={{ marginBottom: 16 }}>
        <span className="muted" style={{ fontSize: 13.5 }}>
          {t("Un joueur banni disparaît du classement et ne peut plus saisir de pronos. Tu peux le débannir à tout moment.")}
        </span>
      </div>
      {err && <div className="alert alert--err" style={{ marginBottom: 12 }}>{err}</div>}
      <div className="card pad">
        <div className="tblwrap"><table className="tbl">
          <thead><tr><th>{t("Joueur")}</th><th>{t("Statut")}</th><th style={{ textAlign: "right" }}></th></tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} style={u.banned ? { opacity: .55 } : null}>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 30, height: 30, borderRadius: "50%", background: "var(--bg-2)", display: "grid", placeItems: "center", fontSize: 16 }}>{u.avatar}</div>
                    <b>{u.pseudo}</b>
                    {u.is_admin && <span className="pill pill--accent" style={{ fontSize: 10 }}>admin</span>}
                    {u.banned && <span className="pill pill--live" style={{ fontSize: 10 }}>{t("banni")}</span>}
                  </div>
                </td>
                <td className="mono muted" style={{ fontSize: 11.5 }}>
                  {u.created_at ? new Date(u.created_at).toLocaleDateString() : ""}
                </td>
                <td style={{ textAlign: "right" }}>
                  {!u.is_admin && (
                    <Btn variant={u.banned ? "accent" : "ghost"} disabled={busy === u.id}
                      onClick={() => toggle(u)} style={{ padding: "7px 14px", fontSize: 12.5 }}>
                      {u.banned ? t("Débannir") : "🚫 " + t("Bannir")}
                    </Btn>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table></div>
      </div>
    </>
  );
}

/* --- Suivi : qui n'a pas pronostiqué + état du robot scores --- */
function AdminMonitor({ matches }) {
  const [rows, setRows] = useState(null);
  useEffect(() => { fetchPredProgress().then(setRows).catch(() => setRows([])); }, []);
  const lastUpdate = matches.filter((m) => m.status === "fini").length
    ? null : null; // placeholder simple
  const todayTotal = rows && rows.length ? rows[0].today_total : 0;
  return (
    <>
      <div className="card pad rise" style={{ marginBottom: 16, display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
        <span className="muted" style={{ fontSize: 13.5 }}>
          🤖 {t("Le robot des scores passe chaque heure et met à jour les matchs finis (kickoff +3h). Pour le relancer à la main :")}
        </span>
        <a className="btn btn--ghost" style={{ padding: "8px 14px", fontSize: 13, textDecoration: "none" }}
          href="https://github.com/Stesouna9/pronos-cdm-2026/actions/workflows/scores-apify.yml" target="_blank" rel="noreferrer">
          ⚙️ {t("Ouvrir le robot (GitHub)")}
        </a>
      </div>
      <div className="card pad">
        <div className="eyebrow" style={{ marginBottom: 10 }}>
          {t("Pronos saisis pour les matchs d'aujourd'hui")} {todayTotal ? `(${todayTotal} ${t("matchs")})` : ""}
        </div>
        {!rows && <p className="muted">…</p>}
        {rows && rows.map((r) => {
          const done = Number(r.today_done), total = Number(r.today_total);
          const ok = total === 0 || done >= total;
          return (
            <div key={r.user_id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderTop: "1px solid var(--line)" }}>
              <span style={{ fontSize: 18 }}>{r.avatar}</span>
              <b style={{ flex: 1 }}>{r.pseudo}</b>
              <span className="mono muted" style={{ fontSize: 12 }}>{t("total")} {r.total_done}</span>
              <span className={"pill " + (ok ? "pill--accent" : "pill--live")} style={{ fontSize: 11 }}>
                {total === 0 ? t("rien à faire") : `${done}/${total} ${t("aujourd'hui")}`}{!ok && " 😴"}
              </span>
            </div>
          );
        })}
      </div>
    </>
  );
}

/* --- Équipes : définir soi-même les équipes des matchs (phase finale) --- */
const TEAMS = Object.entries(WC.T).map(([code, tm]) => ({ code, name: tm.name })).sort((a, b) => a.name.localeCompare(b.name));

function TeamsRow({ m, onSaved }) {
  const [h, setH] = useState(m.home || "");
  const [a, setA] = useState(m.away || "");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const dirty = h !== (m.home || "") || a !== (m.away || "");

  async function save() {
    setBusy(true); setMsg("");
    const nameOf = (c) => (WC.T[c] ? WC.T[c].name : "");
    const r = await setMatchTeams(m.id, h, nameOf(h), a, nameOf(a));
    setBusy(false);
    if (r.error) setMsg("Erreur : " + r.error);
    else { setMsg("✓ " + t("Équipes enregistrées")); onSaved && onSaved(); }
  }
  const sel = (val, set) => (
    <select className="input" value={val} onChange={(e) => set(e.target.value)} style={{ minWidth: 130, padding: "8px 6px" }}>
      <option value="">— {t("à déterminer")} —</option>
      {TEAMS.map((tm) => <option key={tm.code} value={tm.code}>{tm.name}</option>)}
    </select>
  );
  return (
    <div className="card pad admin-row" style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
      <div style={{ minWidth: 150, fontSize: 12 }} className="mono muted">
        <b style={{ color: "var(--ink)" }}>{tPhase(m.phase)}</b><br />{WC.fmtDate(m.date)} · {WC.fmtHeure(m.date)}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, justifyContent: "center", flexWrap: "wrap" }}>
        {h ? <Roundel code={h} size={20} /> : null}{sel(h, setH)}
        <span className="poster">vs</span>
        {sel(a, setA)}{a ? <Roundel code={a} size={20} /> : null}
      </div>
      <div style={{ minWidth: 110, textAlign: "right" }}>
        <Btn variant="accent" onClick={save} disabled={busy || !dirty} style={{ padding: "8px 14px", fontSize: 13 }}>{t("Enregistrer")}</Btn>
      </div>
      {msg && <div className="mono" style={{ fontSize: 11, width: "100%", textAlign: "right", color: msg.startsWith("Erreur") ? "var(--lose)" : "var(--win)" }}>{msg}</div>}
    </div>
  );
}

function TeamsAdmin({ matches, reload }) {
  const ko = matches.filter((m) => m.round === "ko").sort((a, b) => a.date - b.date);
  return (
    <>
      <div className="card pad rise" style={{ marginBottom: 16 }}>
        <span className="muted" style={{ fontSize: 13.5 }}>
          {t("Choisis les deux équipes de chaque match de phase finale, puis Enregistrer. ⚠️ Changer les équipes remet le score à zéro.")}
        </span>
      </div>
      <div className="grid" style={{ gap: 12 }}>
        {ko.map((m) => <TeamsRow key={m.id} m={m} onSaved={reload} />)}
      </div>
      {ko.length === 0 && <div className="card pad-lg" style={{ textAlign: "center" }}><p className="muted">{t("Aucun match de phase finale.")}</p></div>}
    </>
  );
}

export function AdminScreen({ matches = [], reload }) {
  const [section, setSection] = useState("scores"); // scores | joueurs
  const [filtre, setFiltre] = useState("jouables"); // jouables | tous | finis
  const now = new Date();
  let list = [...matches].sort((x, y) => y.date - x.date);
  if (filtre === "jouables") list = list.filter((m) => m.home && m.away && m.date <= now);
  if (filtre === "finis") list = list.filter((m) => m.status === "fini");

  return (
    <div className="content">
      <SectionTitle kicker={t("Réservé à toi (admin)")} title={section === "scores" ? t("Saisie des scores") : section === "equipes" ? t("Équipes") : section === "joueurs" ? t("Joueurs") : t("Suivi")}
        right={<div className="seg">
          <button className={section === "scores" ? "on" : ""} onClick={() => setSection("scores")}>{t("Scores")}</button>
          <button className={section === "equipes" ? "on" : ""} onClick={() => setSection("equipes")}>{t("Équipes")}</button>
          <button className={section === "joueurs" ? "on" : ""} onClick={() => setSection("joueurs")}>{t("Joueurs")}</button>
          <button className={section === "suivi" ? "on" : ""} onClick={() => setSection("suivi")}>{t("Suivi")}</button>
        </div>} />

      {section === "equipes" && <TeamsAdmin matches={matches} reload={reload} />}
      {section === "joueurs" && <PlayersAdmin reload={reload} />}
      {section === "suivi" && <AdminMonitor matches={matches} />}

      {section === "scores" && (
        <>
          <div className="seg" style={{ marginBottom: 16 }}>
            {[["jouables", "À saisir"], ["finis", "Terminés"], ["tous", "Tous"]].map(([k, l]) => (
              <button key={k} className={filtre === k ? "on" : ""} onClick={() => setFiltre(k)}>{t(l)}</button>
            ))}
          </div>
          <div className="card pad rise" style={{ marginBottom: 16 }}>
            <span className="muted" style={{ fontSize: 13.5 }}>
              {t("Tape le score final d'un match et clique Valider : les points se calculent automatiquement. Tu peux corriger ou rouvrir un match à tout moment.")}
            </span>
          </div>
          <div className="grid" style={{ gap: 12 }}>
            {list.map((m) => <AdminRow key={m.id} m={m} onSaved={reload} />)}
          </div>
          {list.length === 0 && <div className="card pad-lg" style={{ textAlign: "center" }}><p className="muted">{t("Aucun match dans ce filtre. Les matchs deviennent saisissables une fois le coup d'envoi passé.")}</p></div>}
        </>
      )}
    </div>
  );
}
