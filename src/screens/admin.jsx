/* admin.jsx — écran réservé à l'admin (Gabriel) : saisie des scores finaux. */
import { useState } from "react";
import { WC } from "../lib/wc.js";
import { saveScore, clearScore } from "../lib/league.js";
import { Roundel, Btn, SectionTitle } from "../components/ui.jsx";

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
        <b style={{ color: "var(--ink)" }}>{m.phase}</b><br />{WC.fmtDate(m.date)} · {WC.fmtHeure(m.date)}
      </div>
      <div className="admin-teams" style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 220, justifyContent: "center" }}>
        <Roundel code={m.home} size={20} /><span style={{ fontWeight: 700, minWidth: 90, textAlign: "right" }}>{nameOf(m, "home")}</span>
        <input className="input" type="number" min="0" max="30" style={num} value={a} onChange={(e) => setA(e.target.value)} />
        <span className="poster">:</span>
        <input className="input" type="number" min="0" max="30" style={num} value={b} onChange={(e) => setB(e.target.value)} />
        <span style={{ fontWeight: 700, minWidth: 90 }}>{nameOf(m, "away")}</span><Roundel code={m.away} size={20} />
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center", minWidth: 180, justifyContent: "flex-end" }}>
        <Btn variant="accent" onClick={save} disabled={busy} style={{ padding: "8px 14px", fontSize: 13 }}>{fini ? "Corriger" : "Valider"}</Btn>
        {fini && <Btn variant="ghost" onClick={reopen} disabled={busy} style={{ padding: "8px 12px", fontSize: 12 }}>Rouvrir</Btn>}
      </div>
      {msg && <div className="mono" style={{ fontSize: 11, width: "100%", textAlign: "right", color: msg.startsWith("Erreur") ? "var(--lose)" : "var(--win)" }}>{msg}</div>}
    </div>
  );
}

export function AdminScreen({ matches = [], reload }) {
  const [filtre, setFiltre] = useState("jouables"); // jouables | tous | finis
  const now = new Date();
  let list = [...matches].sort((x, y) => y.date - x.date);
  if (filtre === "jouables") list = list.filter((m) => m.home && m.away && m.date <= now);
  if (filtre === "finis") list = list.filter((m) => m.status === "fini");

  return (
    <div className="content">
      <SectionTitle kicker="Réservé à toi (admin)" title="Saisie des scores"
        right={<div className="seg">
          {[["jouables", "À saisir"], ["finis", "Terminés"], ["tous", "Tous"]].map(([k, l]) => (
            <button key={k} className={filtre === k ? "on" : ""} onClick={() => setFiltre(k)}>{l}</button>
          ))}
        </div>} />
      <div className="card pad rise" style={{ marginBottom: 16 }}>
        <span className="muted" style={{ fontSize: 13.5 }}>
          Tape le score final d'un match et clique <b>Valider</b> : les points de tous les joueurs se calculent automatiquement et le classement se met à jour. Tu peux corriger ou rouvrir un match à tout moment.
        </span>
      </div>
      <div className="grid" style={{ gap: 12 }}>
        {list.map((m) => <AdminRow key={m.id} m={m} onSaved={reload} />)}
      </div>
      {list.length === 0 && <div className="card pad-lg" style={{ textAlign: "center" }}><p className="muted">Aucun match dans ce filtre. Les matchs deviennent saisissables une fois le coup d'envoi passé.</p></div>}
    </div>
  );
}
