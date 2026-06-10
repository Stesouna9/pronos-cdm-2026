/* admin.jsx — écran réservé à l'admin (Gabriel) : scores + gestion des joueurs. */
import { useState, useEffect } from "react";
import { WC } from "../lib/wc.js";
import { saveScore, clearScore, fetchAllUsers, setBanned } from "../lib/league.js";
import { Roundel, Btn, SectionTitle } from "../components/ui.jsx";
import { t, tPhase } from "../lib/i18n.js";

function nameOf(m, side) {
  const code = side === "home" ? m.home : m.away;
  return (WC.T[code] && WC.T[code].name) || (side === "home" ? m.homeName : m.awayName) || code || "—";
}

function AdminRow({ m, onSaved }) {
  const [a, setA] = useState(m.score ? m.score[0] : 0);
  const [b, setB] = useState(m.score ? m.score[1] : 0);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const fini = m.status === "fini";

  async function save() {
    setBusy(true); setMsg("");
    const winner = a > b ? m.home : b > a ? m.away : null;
    const r = await saveScore(m.id, Number(a), Number(b), winner);
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
        <table className="tbl">
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
        </table>
      </div>
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
      <SectionTitle kicker={t("Réservé à toi (admin)")} title={section === "scores" ? t("Saisie des scores") : t("Joueurs")}
        right={<div className="seg">
          <button className={section === "scores" ? "on" : ""} onClick={() => setSection("scores")}>{t("Scores")}</button>
          <button className={section === "joueurs" ? "on" : ""} onClick={() => setSection("joueurs")}>{t("Joueurs")}</button>
        </div>} />

      {section === "joueurs" && <PlayersAdmin reload={reload} />}

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
