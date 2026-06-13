/* screens3.jsx — Tableau (groupes + bracket), Classement, Profil, Règles */
import { useState } from "react";
import { WC } from "../lib/wc.js";
import { Btn, Roundel, SectionTitle, teamName } from "../components/ui.jsx";
import { t, tPhase } from "../lib/i18n.js";
import { updateProfile, fetchAllLockedPredictions, setNotifyResults } from "../lib/league.js";
import { enablePushOnThisDevice, pushSupported } from "../lib/push.js";

/* Courbe d'évolution des points (SVG maison, cumul par jour). */
const CHART_COLORS = ["#d4a533", "#2a5bd7", "#1f8a4c", "#d52b1e", "#7a5ae0", "#0ea5b7", "#e36414", "#666"];
function EvolutionChart({ matches }) {
  const [preds, setPreds] = useState(null);
  useEffect(() => {
    let alive = true;
    fetchAllLockedPredictions().then((p) => alive && setPreds(p)).catch(() => alive && setPreds([]));
    return () => { alive = false; };
  }, []);
  if (!preds) return <div className="card pad-lg" style={{ textAlign: "center" }}><p className="muted">…</p></div>;
  const byMatch = {};
  matches.forEach((m) => (byMatch[m.id] = m));
  const scored = preds.filter((p) => p.points != null && byMatch[p.match_id]);
  if (!scored.length) return (
    <div className="card pad-lg" style={{ textAlign: "center" }}>
      <div className="poster" style={{ fontSize: 22 }}>📈 {t("Pas encore de courbe")}</div>
      <p className="muted">{t("La courbe d'évolution se dessine dès les premiers matchs terminés.")}</p>
    </div>
  );
  // jours triés + cumuls par joueur
  const days = [...new Set(scored.map((p) => byMatch[p.match_id].date.toDateString()))]
    .sort((a, b) => new Date(a) - new Date(b));
  const players = {};
  scored.forEach((p) => {
    players[p.user_id] = players[p.user_id] || { pseudo: p.pseudo, avatar: p.avatar, byDay: {} };
    const d = byMatch[p.match_id].date.toDateString();
    players[p.user_id].byDay[d] = (players[p.user_id].byDay[d] || 0) + p.points;
  });
  const series = Object.values(players).map((pl, i) => {
    let cum = 0;
    return { ...pl, color: CHART_COLORS[i % CHART_COLORS.length], pts: days.map((d) => (cum += pl.byDay[d] || 0)) };
  });
  const maxY = Math.max(5, ...series.flatMap((s) => s.pts));
  const W = 640, H = 280, PX = 38, PY = 24;
  const x = (i) => PX + (days.length === 1 ? (W - 2 * PX) / 2 : (i * (W - 2 * PX)) / (days.length - 1));
  const y = (v) => H - PY - (v * (H - 2 * PY)) / maxY;
  return (
    <div className="card pad">
      <div className="eyebrow" style={{ marginBottom: 10 }}>📈 {t("Évolution des points (cumul)")}</div>
      <div className="tblwrap">
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", minWidth: 420 }}>
          {[0, 0.25, 0.5, 0.75, 1].map((f) => (
            <g key={f}>
              <line x1={PX} x2={W - PX} y1={y(maxY * f)} y2={y(maxY * f)} stroke="var(--line)" strokeWidth="1" />
              <text x={PX - 6} y={y(maxY * f) + 4} textAnchor="end" fontSize="10" fill="var(--ink-soft)" fontFamily="var(--f-mono)">{Math.round(maxY * f)}</text>
            </g>
          ))}
          {days.map((d, i) => (
            <text key={d} x={x(i)} y={H - 6} textAnchor="middle" fontSize="9" fill="var(--ink-soft)" fontFamily="var(--f-mono)">
              {new Date(d).getDate()}/{new Date(d).getMonth() + 1}
            </text>
          ))}
          {series.map((s, si) => (
            <g key={si}>
              <polyline fill="none" stroke={s.color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round"
                points={s.pts.map((v, i) => `${x(i)},${y(v)}`).join(" ")} />
              {s.pts.map((v, i) => <circle key={i} cx={x(i)} cy={y(v)} r="3.5" fill={s.color} />)}
            </g>
          ))}
        </svg>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 10 }}>
        {series.map((s, i) => (
          <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700 }}>
            <span style={{ width: 12, height: 12, borderRadius: 3, background: s.color, display: "inline-block" }} />
            {s.avatar} {s.pseudo} <span className="mono muted">({s.pts[s.pts.length - 1]})</span>
          </span>
        ))}
      </div>
    </div>
  );
}
import { useEffect } from "react";

/* Stats fun de la ligue, calculées sur les pronos verrouillés (visibles). */
function FunStats() {
  const [preds, setPreds] = useState(null);
  useEffect(() => {
    let alive = true;
    fetchAllLockedPredictions().then((p) => alive && setPreds(p)).catch(() => alive && setPreds([]));
    return () => { alive = false; };
  }, []);
  if (!preds) return <div className="card pad-lg" style={{ textAlign: "center" }}><p className="muted">…</p></div>;
  if (!preds.length) return (
    <div className="card pad-lg" style={{ textAlign: "center" }}>
      <div className="poster" style={{ fontSize: 22 }}>📊 {t("Pas encore de stats")}</div>
      <p className="muted">{t("Les stats fun apparaissent dès que les premiers matchs sont verrouillés (les pronos deviennent publics au coup d'envoi).")}</p>
    </div>
  );
  const per = {};
  preds.forEach((p) => {
    const k = p.user_id;
    per[k] = per[k] || { pseudo: p.pseudo, avatar: p.avatar, n: 0, buts: 0, nuls: 0, petits: 0, cartons: 0 };
    const s = per[k]; s.n++;
    const tot = p.pred_home + p.pred_away;
    s.buts += tot;
    if (p.pred_home === p.pred_away) s.nuls++;
    if (tot <= 2) s.petits++;
    if (Math.abs(p.pred_home - p.pred_away) >= 3) s.cartons++;
  });
  const players = Object.values(per);
  const top = (key, fmt) => [...players].sort((a, b) => b[key] - a[key]).slice(0, 3)
    .filter((p) => p[key] > 0).map((p) => ({ ...p, val: fmt(p) }));
  const cats = [
    ["🌋", t("L'Optimiste"), t("le plus de buts pronostiqués"), top("buts", (p) => p.buts + " " + t("buts"))],
    ["🤝", t("Le Diplomate"), t("le plus de matchs nuls pronostiqués"), top("nuls", (p) => p.nuls + " " + t("nuls"))],
    ["🧊", t("Le Frileux"), t("le plus de petits scores (≤ 2 buts)"), top("petits", (p) => p.petits)],
    ["🚀", t("Le Bourrin"), t("le plus de cartons pronostiqués (écart ≥ 3)"), top("cartons", (p) => p.cartons)],
  ];
  return (
    <div className="grid g-2">
      {cats.map(([emo, titre, desc, lst], i) => (
        <div className="card pad rise" key={i}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <span style={{ fontSize: 26 }}>{emo}</span>
            <div><div className="poster" style={{ fontSize: 18 }}>{titre}</div><div className="muted" style={{ fontSize: 12 }}>{desc}</div></div>
          </div>
          {lst.length === 0 && <p className="muted" style={{ fontSize: 13, margin: 0 }}>—</p>}
          {lst.map((p, j) => (
            <div key={j} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0", borderTop: j ? "1px solid var(--line)" : "none" }}>
              <span>{["🥇", "🥈", "🥉"][j]}</span>
              <span style={{ fontSize: 18 }}>{p.avatar}</span>
              <b style={{ flex: 1 }}>{p.pseudo}</b>
              <span className="mono muted" style={{ fontSize: 12.5 }}>{p.val}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
import { GroupTable } from "./screens2.jsx";

/* Tableau des résultats des matchs, rangé PAR GROUPE (+ phase finale). */
function ResultsBoard({ matches, go }) {
  const nm = (m, side) => {
    const c = side === "home" ? m.home : m.away;
    return c ? teamName(c, WC.T[c] ? WC.T[c].name : c) : t("À déterminer");
  };
  const Row = ({ m, withPhase }) => {
    const fini = m.status === "fini" && m.score;
    return (
      <tr style={{ cursor: "pointer" }} onClick={() => go("match", { id: m.id })}>
        <td className="mono" style={{ whiteSpace: "nowrap", fontSize: 11.5, color: "var(--ink-soft)" }}>
          {WC.fmtDate(m.date)} · {WC.fmtHeure(m.date)}{withPhase && <><br /><span style={{ fontSize: 10 }}>{tPhase(m.phase)}</span></>}
        </td>
        <td>
          <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap", fontWeight: 600 }}>
            <Roundel code={m.home} size={16} /><span>{nm(m, "home")}</span>
            <span className="muted" style={{ fontWeight: 400 }}>—</span>
            <span>{nm(m, "away")}</span><Roundel code={m.away} size={16} />
          </div>
        </td>
        <td style={{ textAlign: "center", whiteSpace: "nowrap" }}>
          {fini
            ? <b className="poster" style={{ fontSize: 18 }}>{m.score[0]}–{m.score[1]}{m.pens ? <span className="mono muted" style={{ fontSize: 9, display: "block" }}>t.a.b. {m.pens[0]}–{m.pens[1]}</span> : null}</b>
            : <span className="muted" style={{ fontSize: 12 }}>{t("à venir")}</span>}
        </td>
      </tr>
    );
  };
  const Table = ({ list, withPhase }) => (
    <div className="tblwrap"><table className="tbl">
      <thead><tr><th>{t("Date")}</th><th>{t("Match")}</th><th style={{ textAlign: "center" }}>{t("Score")}</th></tr></thead>
      <tbody>{list.map((m) => <Row key={m.id} m={m} withPhase={withPhase} />)}</tbody>
    </table></div>
  );
  const groups = Object.keys(WC.GROUPS);
  const ko = matches.filter((m) => m.round === "ko").sort((a, b) => a.date - b.date);
  return (
    <div className="grid g-2" style={{ alignItems: "start" }}>
      {groups.map((g) => {
        const gm = matches.filter((m) => m.group === g).sort((a, b) => a.date - b.date);
        if (!gm.length) return null;
        return (
          <div className="card pad" key={g}>
            <div className="eyebrow" style={{ marginBottom: 8 }}>{t("Groupe")} {g}</div>
            <Table list={gm} />
          </div>
        );
      })}
      {ko.length > 0 && (
        <div className="card pad" style={{ gridColumn: "1 / -1" }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>{t("Phase finale")}</div>
          <Table list={ko} withPhase />
        </div>
      )}
    </div>
  );
}

/* =================== TABLEAU : GROUPES + BRACKET =================== */
export function TableauScreen({ go, matches = WC.ALL_MATCHES }) {
  const [tab, setTab] = useState("groupes");
  const koMatches = matches.filter((m) => m.round === "ko" && (m.home || m.away));
  const real = matches !== WC.ALL_MATCHES;
  const letters = real ? Object.keys(WC.GROUPS) : WC.GROUP_LETTERS;
  return (
    <div className="content">
      <SectionTitle kicker={t("🕗 Mise à jour automatique dans l'heure qui suit chaque fin de match")} title={t("Le tableau")}
        right={<div className="seg">
          <button className={tab === "groupes" ? "on" : ""} onClick={() => setTab("groupes")}>{t("12 groupes")}</button>
          <button className={tab === "resultats" ? "on" : ""} onClick={() => setTab("resultats")}>{t("Résultats")}</button>
          <button className={tab === "bracket" ? "on" : ""} onClick={() => setTab("bracket")}>{t("Phase finale")}</button>
        </div>} />

      {tab === "resultats" && <ResultsBoard matches={matches} go={go} />}

      {tab === "bracket" && (
        koMatches.length ? (
          <>
            <div className="card pad rise" style={{ marginBottom: 18, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              <span className="pill pill--accent"><span className="dot dot--pulse" /> {t("Mise à jour auto")}</span>
              <span className="muted" style={{ fontSize: 13.5 }}>
                {t("Les tableaux se mettent à jour automatiquement dans l'heure qui suit chaque fin de match.")}
              </span>
            </div>
            <Bracket go={go} />
          </>
        ) : (
          <div className="card pad-lg" style={{ textAlign: "center" }}>
            <div className="poster" style={{ fontSize: 24 }}>{t("🏆 Phase finale à venir")}</div>
            <p className="muted" style={{ maxWidth: 460, margin: "8px auto 0" }}>
              {t("Le tableau à élimination directe se remplira automatiquement après la phase de groupes (à partir du 28 juin). En attendant, fais tes pronos !")}
            </p>
            <Btn variant="accent" onClick={() => go("matches")} style={{ marginTop: 14 }}>{t("Voir les matchs →")}</Btn>
          </div>
        )
      )}

      {tab === "groupes" && (
        <>
          <div className="mono muted" style={{ fontSize: 12, marginBottom: 14 }}>
            <span style={{ color: "var(--win)", fontWeight: 800 }}>● 1–2</span> {t("qualifiés")} ·{" "}
            <span style={{ color: "var(--warn)", fontWeight: 800 }}>● 3</span> {t("repêchable (8 meilleurs 3es)")}
          </div>
          <div className="grid g-3">
            {letters.map((g) => <GroupTable key={g} g={g} matches={real ? matches : undefined} />)}
          </div>
        </>
      )}
    </div>
  );
}

function BTie({ m, go }) {
  const sideRow = (side) => {
    const code = side === "home" ? m.home : m.away;
    const win = m.status === "fini" && m.winner === code;
    const out = m.status === "fini" && m.winner && m.winner !== code;
    if (!code) return <div className="t tbd"><span style={{ fontSize: 12 }}>Vainqueur {side === "home" ? m.fromA : m.fromB}</span></div>;
    return (
      <div className={"t" + (win ? " win" : "") + (out ? " out" : "")}>
        <Roundel code={code} size={18} />
        <span style={{ fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{WC.T[code].name}</span>
        {m.status === "fini" && <span className="s">{side === "home" ? m.score[0] : m.score[1]}</span>}
      </div>
    );
  };
  return (
    <div className="btie" style={{ cursor: "pointer" }} onClick={() => go("match", { id: m.id })} title="Voir le match">
      {sideRow("home")}
      {sideRow("away")}
      {m.pens && <div className="mono muted" style={{ fontSize: 9.5, textAlign: "right" }}>t.a.b. {m.pens[0]}–{m.pens[1]}</div>}
    </div>
  );
}

export function Bracket({ go }) {
  const cols = [
    ["32es de finale", WC.KO.r32],
    ["8es de finale", WC.KO.r16],
    ["Quarts", WC.KO.qf],
    ["Demies", WC.KO.sf],
    ["Finale", [WC.KO.final]],
  ];
  return (
    <div className="bracket-scroll">
      <div className="bracket">
        {cols.map(([title, ms], ci) => (
          <div className="bcol" key={ci} style={ci === 4 ? { justifyContent: "center" } : null}>
            <h4>{title}</h4>
            {ms.map((m) => <BTie key={m.id} m={m} go={go} />)}
            {ci === 4 && (
              <div style={{ marginTop: 14, textAlign: "center" }}>
                <div className="poster" style={{ fontSize: 13, color: "var(--ink-soft)" }}>🥉 3e place</div>
                <div style={{ marginTop: 6 }}><BTie m={WC.KO.third} go={go} /></div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* =================== CLASSEMENT =================== */
export function Leaderboard({ go, profile, users: realUsers, me, matches: lbMatches = [] }) {
  const src = realUsers || WC.USERS;
  const meId = me && me.id;
  const users = src.map((u) => (u.isMe || (meId && u.id === meId))
    ? { ...u, isMe: true, pseudo: profile.pseudo, avatar: profile.avatar } : u);
  const [scope, setScope] = useState("general");
  const last = users[users.length - 1] || { pseudo: "—" };
  // Marches du podium par GROUPES de rang (les ex æquo partagent la marche).
  const rankGroups = [];
  users.forEach((u) => {
    const g = rankGroups[rankGroups.length - 1];
    if (g && g[0].position === u.position) g.push(u); else rankGroups.push([u]);
  });
  while (rankGroups.length < 3) rankGroups.push([{ id: "ph" + rankGroups.length, pseudo: "—", avatar: "·", pts: 0, exacts: 0 }]);
  const podium = rankGroups.slice(0, 3);

  return (
    <div className="content">
      <SectionTitle kicker="" title={t("Classement")}
        right={<div className="seg">
          <button className={scope === "general" ? "on" : ""} onClick={() => setScope("general")}>{t("Général")}</button>
          <button className={scope === "stats" ? "on" : ""} onClick={() => setScope("stats")}>📊 {t("Stats fun")}</button>
          <button className={scope === "evo" ? "on" : ""} onClick={() => setScope("evo")}>📈 {t("Évolution")}</button>
        </div>} />

      {scope === "stats" && <FunStats />}
      {scope === "evo" && <EvolutionChart matches={lbMatches} />}
      {scope !== "stats" && scope !== "evo" && <>
      <div className="podium rise" style={{ marginBottom: 22 }}>
        {[podium[1], podium[0], podium[2]].map((grp, i) => {
          const place = i === 1 ? 1 : i === 0 ? 2 : 3;
          const prize = WC.PRIZES.find((p) => p.rang === place);
          const tie = grp.length > 1;
          const realRank = grp[0].position || place;   // vrai rang (suit les ex æquo au-dessus)
          return (
            <div className={"pcol p" + place} key={grp[0].id}>
              <div className="medal">{place === 1 ? "🏆 " + t("Champion").toUpperCase() : (place === 2 ? "🥈 " : "🥉 ") + realRank + "E"}{tie && " · " + t("ex æquo")}</div>
              <div style={{ display: "flex", justifyContent: "center", gap: 6 }}>
                {grp.slice(0, 3).map((u) => <div className="av" key={u.id} style={tie ? { width: 46, height: 46, fontSize: 22 } : null}>{u.avatar}</div>)}
              </div>
              <div className="ps" style={tie ? { fontSize: "clamp(16px,3vw,22px)" } : null}>{grp.map((u) => u.pseudo).join(" & ")}</div>
              <div className="mono" style={{ fontSize: 12, opacity: .85 }}>{grp[0].pts} {t("pts")}</div>
              <div style={{ marginTop: 8, fontSize: 12.5, fontWeight: 700 }}>{t(prize.lot)}</div>
            </div>
          );
        })}
      </div>

      <div className="card pad">
        <div className="tblwrap"><table className="tbl">
          <thead><tr><th>#</th><th>{t("Joueur")}</th><th>{t("Exacts")}</th><th>{t("Bons")}</th><th>{t("Série")}</th><th style={{ textAlign: "right" }}>{t("Points")}</th></tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className={u.isMe ? "me" : ""}>
                <td className="rank-n">{u.position}{u.tie ? <span className="mono muted" style={{ fontSize: 11 }}>=</span> : ""}</td>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 30, height: 30, borderRadius: "50%", background: "var(--bg-2)", display: "grid", placeItems: "center", fontSize: 16 }}>{u.avatar}</div>
                    <b>{u.pseudo}</b>{u.isMe && <span className="pill pill--accent" style={{ fontSize: 10 }}>{t("toi")}</span>}
                  </div>
                </td>
                <td className="mono">{u.exacts}</td>
                <td className="mono">{u.bons}</td>
                <td className="mono">{u.serie ? "🔥" + u.serie : "—"}</td>
                <td className="mono" style={{ textAlign: "right", fontWeight: 800, fontSize: 15 }}>{u.pts}</td>
              </tr>
            ))}
          </tbody>
        </table></div>
        <hr className="divider" />
        <div className="mono muted" style={{ fontSize: 12, textAlign: "center" }}>🥄 <b style={{ color: "var(--ink)" }}>{last.pseudo}</b> — {t("pour l'instant, le McDo de Gabriel est pour toi !")}</div>
      </div>
      </>}
    </div>
  );
}

/* =================== PROFIL =================== */
export function Profile({ profile, setProfile, predictions, me: meStats, matches = WC.ALL_MATCHES, onLogout }) {
  const me = { ...(meStats || WC.ME), ...profile };
  const AV = ["⚽", "🦁", "🔥", "🚀", "👑", "🎯", "🐺", "🦅", "🧤", "🐉", "⭐", "🥅", "🏆", "💪", "🤩", "🐯", "🎩", "👻"];
  const [draft, setDraft] = useState({ pseudo: profile.pseudo, avatar: profile.avatar, email: profile.email || "toi@email.com", fav: profile.fav || "FRA" });
  const [saved, setSaved] = useState(false);

  const finis = matches.filter((m) => m.status === "fini" && predictions[m.id]);
  const exacts = finis.filter((m) => WC.points(predictions[m.id], m.score) === WC.BAREME.exact).length;

  function save() {
    setProfile((p) => ({ ...p, ...draft }));
    // persiste en base (pseudo/avatar/équipe de cœur) pour survivre à la reconnexion
    updateProfile({ pseudo: draft.pseudo, avatar: draft.avatar, fav: draft.fav })
      .then((r) => { if (r && r.error) console.error("save profil:", r.error); });
    setSaved(true); setTimeout(() => setSaved(false), 1800);
  }

  // Notifications : active (permission + abonnement de CET appareil) ou coupe.
  const [notifBusy, setNotifBusy] = useState(false);
  const [notifMsg, setNotifMsg] = useState("");
  async function toggleNotif(on) {
    setNotifBusy(true); setNotifMsg("");
    if (on) {
      const r = await enablePushOnThisDevice();
      if (r.ok) {
        await setNotifyResults(true);
        setProfile((p) => ({ ...p, notify_results: true }));
        setNotifMsg("✓ " + t("Notifications activées sur cet appareil"));
      } else if (r.error === "denied") {
        setNotifMsg(t("Refusées dans le navigateur — autorise les notifications pour ce site dans les réglages."));
      } else {
        setNotifMsg(t("Pas possible sur cet appareil. Sur iPhone : installe d'abord l'app (écran d'accueil)."));
      }
    } else {
      await setNotifyResults(false);
      setProfile((p) => ({ ...p, notify_results: false }));
      setNotifMsg("✓ " + t("Notifications coupées"));
    }
    setNotifBusy(false);
  }

  const badges = [
    ["🎯", t("Sniper"), exacts + " " + t("scores exacts")],
    ["🔥", t("En feu"), t("Série de") + " " + me.serie],
    ["📅", t("Assidu"), finis.length + " " + t("pronos joués")],
    ["🌍", t("Globe-trotter"), t("Pronos sur 6 confédérations")],
  ];

  return (
    <div className="content">
      <SectionTitle kicker={t("Ton compte")} title={t("Profil")} />
      <div className="grid profile-grid" style={{ alignItems: "start" }}>
        <div className="card pad-lg rise" style={{ textAlign: "center" }}>
          <div style={{ width: 92, height: 92, borderRadius: "50%", background: "var(--bg-2)", display: "grid", placeItems: "center", fontSize: 46, margin: "0 auto 12px", border: "2px solid var(--line)" }}>{draft.avatar}</div>
          <div className="poster" style={{ fontSize: 26 }}>{draft.pseudo || "—"}</div>
          <div className="mono muted" style={{ fontSize: 12 }}>#{me.position} · {me.pts} {t("pts")}</div>
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8, marginTop: 8, whiteSpace: "nowrap" }}>
            <span className="muted" style={{ fontSize: 13 }}>{t("Équipe de cœur")}</span><Roundel code={draft.fav} size={20} /><b style={{ fontSize: 13 }}>{teamName(draft.fav, WC.T[draft.fav].name)}</b>
          </div>
          <hr className="divider" />
          <div className="grid g-2 keep" style={{ gap: 10 }}>
            {[[me.pts, t("Points")], ["#" + me.position, t("Rang")], [exacts, t("Exacts")], [me.serie, t("Série") + " 🔥"]].map(([n, l], i) => (
              <div className="stat" key={i} style={{ padding: 12 }}><div className="n" style={{ fontSize: 26 }}>{n}</div><div className="l">{l}</div></div>
            ))}
          </div>
          <div className="eyebrow" style={{ margin: "18px 0 10px", textAlign: "left" }}>{t("Badges")}</div>
          <div className="grid g-2 keep" style={{ gap: 10 }}>
            {badges.map((b, i) => (
              <div key={i} className="card pad" style={{ display: "flex", gap: 10, alignItems: "center", textAlign: "left" }}>
                <span style={{ fontSize: 24 }}>{b[0]}</span>
                <div><div style={{ fontWeight: 700, fontSize: 13 }}>{b[1]}</div><div className="muted" style={{ fontSize: 11 }}>{b[2]}</div></div>
              </div>
            ))}
          </div>
        </div>

        <div className="card pad-lg rise">
          <div className="eyebrow" style={{ marginBottom: 14 }}>{t("Personnaliser")}</div>
          <div className="field"><label>{t("Pseudo")}</label><input className="input" maxLength={16} value={draft.pseudo} onChange={(e) => setDraft({ ...draft, pseudo: e.target.value })} /></div>
          <div className="field"><label>{t("Email")}</label><input className="input" type="email" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} /></div>
          <div className="field">
            <label>{t("Avatar")}</label>
            <div className="av-grid" style={{ gridTemplateColumns: "repeat(9,1fr)" }}>
              {AV.map((a) => <button key={a} className={draft.avatar === a ? "on" : ""} onClick={() => setDraft({ ...draft, avatar: a })}>{a}</button>)}
            </div>
          </div>
          <div className="field">
            <label>{t("Équipe de cœur")}</label>
            <select className="input" value={draft.fav} onChange={(e) => setDraft({ ...draft, fav: e.target.value })}>
              {Object.keys(WC.T).map((c) => <option key={c} value={c}>{teamName(c, WC.T[c].name)}</option>)}
            </select>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <Btn variant="accent" onClick={save} style={{ whiteSpace: "nowrap" }}>{t("Enregistrer")}</Btn>
            {saved && <span className="pill pill--accent">✓ {t("Profil mis à jour")}</span>}
          </div>
          <hr className="divider" />
          <div className="eyebrow" style={{ marginBottom: 8 }}>🔔 {t("Notifications")}</div>
          <label style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", fontSize: 14 }}>
            <input type="checkbox" checked={profile.notify_results === true} disabled={notifBusy}
              onChange={(e) => toggleNotif(e.target.checked)}
              style={{ width: 18, height: 18, accentColor: "var(--accent)" }} />
            {t("Une notification après le résultat de chaque match")}
          </label>
          {notifMsg && <div className="mono" style={{ fontSize: 11.5, color: notifMsg.startsWith("✓") ? "var(--win)" : "var(--lose)" }}>{notifMsg}</div>}
          {!pushSupported() && <div className="mono muted" style={{ fontSize: 11.5 }}>{t("📱 Sur iPhone : installe d'abord l'app (Partager → Sur l'écran d'accueil) pour que ça marche.")}</div>}
          {profile.is_admin && <div className="mono muted" style={{ fontSize: 11.5, marginTop: 4 }}>👑 {t("Admin : cet appareil reçoit aussi les alertes « score à saisir / tirs au but à valider ».")}</div>}
          <hr className="divider" />
          <Btn variant="ghost block" onClick={onLogout}>⎋ {t("Déconnexion")}</Btn>
        </div>
      </div>
    </div>
  );
}

/* =================== RÈGLES & BARÈME =================== */
export function Rules() {
  const B = WC.BAREME;
  const exemples = [
    [t("Tu pronostiques 2–1, le match finit 2–1"), t("Score exact"), B.exact, "exact"],
    [t("Tu pronostiques 2–1, le match finit 3–2"), t("Bon vainqueur + bon écart (+1)"), B.ecart, "good"],
    [t("Tu pronostiques 2–1, le match finit 4–0"), t("Bon vainqueur, écart différent"), B.issue, "good"],
    [t("Tu pronostiques 1–1, le match finit 2–2"), t("Match nul bien vu"), B.issue, "good"],
    [t("Tu pronostiques 2–1, le match finit 0–2"), t("Mauvais résultat"), B.rate, "zero"],
  ];
  return (
    <div className="content">
      <SectionTitle kicker={t("Comment on marque des points")} title={t("Règles & barème")} />

      <div className="grid g-2" style={{ alignItems: "start" }}>
        <div className="card pad-lg rise">
          <div className="eyebrow" style={{ marginBottom: 14 }}>{t("Le barème")}</div>
          {[[t("Score exact"), B.exact, t("Le Graal : bon vainqueur ET bon score."), "exact"],
            [t("Bon résultat + bon écart de buts"), B.ecart, t("Bon vainqueur et la bonne différence (2–1 → 3–2)."), "good"],
            [t("Bon résultat"), B.issue, t("Bon vainqueur (ou nul bien vu) mais pas le bon score."), "good"],
            [t("Mauvais résultat"), B.rate, t("Pas le bon vainqueur. Zéro pointé."), "zero"]].map((r, i) => (
            <div key={i} style={{ display: "flex", gap: 14, alignItems: "center", padding: "14px 0", borderTop: i ? "1px solid var(--line)" : "none" }}>
              <span className={"pts " + (r[3] === "exact" ? "pts--exact" : r[3] === "good" ? "pts--good" : "pts--zero")} style={{ fontSize: 16, minWidth: 54, textAlign: "center" }}>+{r[1]}</span>
              <div><div style={{ fontWeight: 700 }}>{r[0]}</div><div className="muted" style={{ fontSize: 13 }}>{r[2]}</div></div>
            </div>
          ))}
          <div className="card pad" style={{ marginTop: 14, background: "var(--surface-2)" }}>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>{t("🎁 Bonus")}</div>
            <div className="muted" style={{ fontSize: 13.5 }}>+{B.bonusSerie} {t("pts par série de 3 bons pronos d'affilée · les matchs de phase finale rapportent davantage.")}</div>
          </div>
          <div className="card pad" style={{ marginTop: 14, background: "var(--surface-2)" }}>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>⭐ {t("Prono de confiance")}</div>
            <div className="muted" style={{ fontSize: 13.5 }}>{t("Chaque jour, choisis UN match avec l'étoile ⭐ : tes points y comptent double. À poser avant le coup d'envoi — choisis bien !")}</div>
          </div>
          <div className="card pad" style={{ marginTop: 14, background: "var(--surface-2)" }}>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>🥅 {t("Tirs au but (phase finale)")}</div>
            <div className="muted" style={{ fontSize: 13.5 }}>{t("Dès les 16es de finale, si tu pronostiques un match nul, choisis aussi qui gagne aux tirs au but : +2 points bonus si tu as vu juste. Le score se juge à la fin du match (hors tirs au but), comme d'habitude.")}</div>
          </div>
          <div className="card pad" style={{ marginTop: 14, background: "var(--surface-2)" }}>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>🎮 {t("Mini-jeux")}</div>
            <div className="muted" style={{ fontSize: 13.5 }}>{t("Onglet Jeux : un essai par jour et par jeu, défi réussi = +1 au classement Jeux (séparé). Juste avant les quarts de finale, le 1er du classement Jeux gagne +10 points au classement général.")}</div>
          </div>
          <div className="card pad" style={{ marginTop: 14, background: "var(--surface-2)" }}>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>⚖️ {t("En cas d'égalité")}</div>
            <div className="muted" style={{ fontSize: 13.5 }}>{t("Pendant le tournoi, à points égaux les joueurs sont ex æquo (même place). Le départage (scores exacts, puis ancienneté d'inscription) ne sert qu'à attribuer les lots à la toute fin.")}</div>
          </div>
        </div>

        <div>
          <div className="card pad-lg rise" style={{ marginBottom: 16 }}>
            <div className="eyebrow" style={{ marginBottom: 12 }}>{t("Exemples concrets")}</div>
            {exemples.map((e, i) => (
              <div key={i} style={{ display: "flex", gap: 12, alignItems: "center", padding: "11px 0", borderTop: i ? "1px solid var(--line)" : "none" }}>
                <span className={"pts " + (e[3] === "exact" ? "pts--exact" : e[3] === "good" ? "pts--good" : "pts--zero")} style={{ minWidth: 40, textAlign: "center", flex: "0 0 auto" }}>+{e[2]}</span>
                <div style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 0 }}><div style={{ fontWeight: 600, fontSize: 14, lineHeight: 1.3 }}>{e[0]}</div><div className="muted" style={{ fontSize: 12, lineHeight: 1.2 }}>{e[1]}</div></div>
              </div>
            ))}
          </div>

          <div className="card pad-lg rise">
            <div className="eyebrow" style={{ marginBottom: 12 }}>{t("Format du tournoi")}</div>
            <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7, fontSize: 14.5 }}>
              <li>{t("48 équipes, 12 groupes de 4 (A→L).")}</li>
              <li>{t("Les 2 premiers de chaque groupe + les 8 meilleurs 3es se qualifient.")}</li>
              <li>{t("Puis élimination directe : 16es → 8es → quarts → demies → finale (+ petite finale).")}</li>
              <li>{t("Le tableau se remplit automatiquement à chaque résultat.")}</li>
              <li>{t("Du 11 juin au 19 juillet 2026 · 104 matchs · USA · Canada · Mexique.")}</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="card pad-lg rise" style={{ marginTop: 16 }}>
        <div className="eyebrow" style={{ marginBottom: 12 }}>{t("Les lots")}</div>
        <div className="grid g-4">
          {WC.PRIZES.map((p, i) => (
            <div key={i} className="card pad" style={{ background: "var(--surface-2)" }}>
              <div className="poster" style={{ fontSize: 20 }}>{typeof p.rang === "number" ? p.rang + (p.rang === 1 ? "er" : "e") : t(p.titre)}</div>
              <div style={{ fontWeight: 700, margin: "6px 0 2px" }}>{t(p.lot)}</div>
              <div className="muted" style={{ fontSize: 12.5 }}>{t(p.desc)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
