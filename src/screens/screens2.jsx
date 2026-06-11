/* screens2.jsx — Liste des matchs, saisie de prono, détail d'un match */
import { useState, useMemo, useEffect } from "react";
import { WC } from "../lib/wc.js";
import { fetchMatchPredictions } from "../lib/league.js";
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

/* ---------- Carte match dans la liste ---------- */
function MatchRow({ m, pred, setPred, go }) {
  const fini = m.status === "fini";
  const locked = m.locked; // verrouillé : coup d'envoi passé
  const [a, b] = pred || [null, null];
  const ch = m.home && WC.T[m.home] ? WC.T[m.home].colors[0] : "var(--line)";
  const ca = m.away && WC.T[m.away] ? WC.T[m.away].colors[0] : "var(--line)";
  return (
    <div className="card pad rise match">
      <div className="teamstripe" style={{ background: `linear-gradient(90deg, ${ch} 0 46%, ${ca} 54%)` }} />
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

      <hr className="divider" style={{ margin: "6px 0" }} />

      {!fini && m.home && m.away && !locked && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div className="mono muted" style={{ fontSize: 12 }}>{pred ? t("Ton prono :") : t("Ton prono ?")}</div>
          <PredEditor pred={pred} home={m.home} away={m.away} onChange={(p) => setPred(m.id, p)} />
          <div style={{ minWidth: 120, textAlign: "right" }}>
            {pred
              ? <span className="pill pill--accent">✓ {a}–{b}</span>
              : <span className="muted" style={{ fontSize: 12 }}>{t("Ajuste puis c'est sauvé")}</span>}
          </div>
        </div>
      )}
      {!fini && m.home && m.away && locked && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div className="mono muted" style={{ fontSize: 12 }}>{t("🔒 Pronos fermés (coup d'envoi passé)")}</div>
          <div className="mono" style={{ fontSize: 12 }}>{t("Ton prono :")} <b>{pred ? `${pred[0]}–${pred[1]}` : t("non joué")}</b></div>
        </div>
      )}
      {!fini && (!m.home || !m.away) && (
        <div className="mono muted" style={{ fontSize: 12, textAlign: "center" }}>{t("Pronostic ouvert dès que les qualifiés sont connus.")}</div>
      )}
      {fini && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div className="mono muted" style={{ fontSize: 12 }}>{t("Ton prono :")} <b style={{ color: "var(--ink)" }}>{pred ? `${pred[0]}–${pred[1]}` : t("non joué")}</b></div>
          {pred ? <PointsBadge pred={pred} real={m.score} /> : <span className="pts pts--zero">0 · {t("pas de prono")}</span>}
        </div>
      )}
    </div>
  );
}

/* ---------- Écran liste des matchs ---------- */
export function MatchesScreen({ go, predictions, setPred, matches = WC.ALL_MATCHES }) {
  const [phase, setPhase] = useState("tous");
  const [filtre, setFiltre] = useState("tous"); // tous | apredire | termines

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
              <div className="grid g-2">
                {gm.map((m) => <MatchRow key={m.id} m={m} pred={predictions[m.id]} setPred={setPred} go={go} />)}
              </div>
            </div>
          );
        })
      ) : (
        <div className="grid g-2">
          {list.map((m) => <MatchRow key={m.id} m={m} pred={predictions[m.id]} setPred={setPred} go={go} />)}
        </div>
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

function FormDots({ code }) {
  let s = 0; for (const c of code) s += c.charCodeAt(0);
  const seq = [0, 1, 2, 3, 4].map((i) => ["W", "W", "N", "L", "W"][(s + i * 3) % 5]);
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

/* Les pronos de toute la ligue (après coup d'envoi uniquement). */
function LeaguePredictions({ m }) {
  const [list, setList] = useState(null);
  useEffect(() => {
    let alive = true;
    fetchMatchPredictions(m.id).then((l) => alive && setList(l)).catch(() => alive && setList([]));
    return () => { alive = false; };
  }, [m.id]);
  if (!list) return null;
  return (
    <div className="card pad rise" style={{ marginBottom: 18 }}>
      <div className="eyebrow" style={{ marginBottom: 12 }}>👀 {t("Les pronos de la ligue")}</div>
      {list.length === 0 && <p className="muted" style={{ margin: 0, fontSize: 13.5 }}>{t("Personne n'a pronostiqué ce match.")}</p>}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
        {list.map((p) => (
          <div key={p.user_id} className="stat" style={{ padding: "10px 14px", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 20 }}>{p.avatar}</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13 }}>{p.pseudo}</div>
              <div className="poster" style={{ fontSize: 20 }}>{p.pred_home}–{p.pred_away}</div>
            </div>
            {p.points != null && <span className={"pts " + (p.points === 5 ? "pts--exact" : p.points > 0 ? "pts--good" : "pts--zero")}>+{p.points}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

export function MatchDetail({ id, go, predictions, setPred, matches = WC.ALL_MATCHES }) {
  const m = matches.find((x) => x.id === id);
  const [tab, setTab] = useState("apercu");
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
            <div style={{ minWidth: 130, textAlign: "right" }}>
              {predictions[m.id] ? <span className="pill pill--accent">✓ {predictions[m.id][0]}–{predictions[m.id][1]}</span> : <span className="muted">{t("Règle les compteurs")}</span>}
            </div>
          </div>
        </div>
      )}
      {!fini && m.home && m.away && m.locked && (
        <div className="card pad rise" style={{ marginBottom: 18 }}>
          <div className="mono" style={{ fontSize: 13 }}>{t("🔒 Pronos fermés (coup d'envoi passé)")} — <b>{predictions[m.id] ? `${predictions[m.id][0]}–${predictions[m.id][1]}` : t("non joué")}</b></div>
        </div>
      )}
      {fini && (
        <div className="card pad rise" style={{ marginBottom: 18, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div className="mono" style={{ fontSize: 13 }}>{t("TON PRONO :")} <b>{predictions[m.id] ? `${predictions[m.id][0]}–${predictions[m.id][1]}` : t("non joué")}</b> · {t("RÉSULTAT :")} <b>{m.score[0]}–{m.score[1]}</b></div>
          {predictions[m.id] ? <PointsBadge pred={predictions[m.id]} real={m.score} /> : <span className="pts pts--zero">0 pt</span>}
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
              [t("Forme (5 derniers)"), "form-h", "form-a"], [t("Cote pronostiqueurs"), "58%", "42%"]].map((r, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: 10, padding: "10px 0", borderTop: i ? "1px solid var(--line)" : "none" }}>
                <div style={{ fontWeight: 700 }}>{r[1] === "form-h" ? <FormDots code={m.home} /> : r[1]}</div>
                <div className="mono muted" style={{ fontSize: 11, textAlign: "center" }}>{r[0]}</div>
                <div style={{ fontWeight: 700, textAlign: "right", display: "flex", justifyContent: "flex-end" }}>{r[2] === "form-a" ? <FormDots code={m.away} /> : r[2]}</div>
              </div>
            ))}
          </div>
          <div className="card pad">
            <div className="eyebrow" style={{ marginBottom: 12 }}>{t("Infos match")}</div>
            <div className="grid g-2 keep" style={{ gap: 10 }}>
              {[[t("📍 Stade"), m.venue.stade], [t("🏙️ Ville"), m.venue.city], [t("📅 Date"), WC.fmtDate(m.date)], [t("⏰ Coup d'envoi"), WC.fmtHeure(m.date)], [t("🏆 Phase"), tPhase(m.phase)], [t("🎟️ Affluence"), "~" + (40 + (th.rank % 30)) + " 000"]].map(([l, v], i) => (
                <div key={i} className="stat" style={{ padding: 12 }}><div className="l" style={{ marginBottom: 2 }}>{l}</div><div style={{ fontWeight: 700, fontSize: 15 }}>{v}</div></div>
              ))}
            </div>
            <p className="mono muted" style={{ fontSize: 11, marginTop: 12 }}>{t("Données d'illustration.")}</p>
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
          {[m.home, m.away].map((c) => (
            <div className="card pad" key={c}>
              <TeamLine code={c} bold showCode={false} size={28} />
              <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "14px 0" }}><span className="muted" style={{ fontSize: 13 }}>{t("5 derniers :")}</span><FormDots code={c} /></div>
              <div className="grid g-3 keep2" style={{ gap: 10 }}>
                {[[t("Buts marqués"), 7 + (WC.T[c].rank % 5)], [t("Clean sheets"), 1 + (WC.T[c].rank % 3)], [t("Série"), "3 V"]].map(([l, v], i) => (
                  <div className="stat" key={i} style={{ padding: 12 }}><div className="n" style={{ fontSize: 24 }}>{v}</div><div className="l">{l}</div></div>
                ))}
              </div>
            </div>
          ))}
          <div className="card pad" style={{ gridColumn: "1 / -1" }}>
            <div className="eyebrow" style={{ marginBottom: 10 }}>{t("Face-à-face (historique)")}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", textAlign: "center", alignItems: "center" }}>
              <div><div className="poster" style={{ fontSize: 30 }}>{2 + (th.rank % 3)}</div><TeamLine code={m.home} showCode={false} size={20} /></div>
              <div><div className="poster" style={{ fontSize: 30 }}>{1 + (th.rank % 2)}</div><div className="mono muted" style={{ fontSize: 11 }}>{t("NULS")}</div></div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}><div className="poster" style={{ fontSize: 30 }}>{1 + (ta.rank % 3)}</div><TeamLine code={m.away} reverse showCode={false} size={20} /></div>
            </div>
          </div>
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
