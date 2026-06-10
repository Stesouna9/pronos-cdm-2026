/* screens3.jsx — Tableau (groupes + bracket), Classement, Profil, Règles */
import { useState } from "react";
import { WC } from "../lib/wc.js";
import { Btn, Roundel, SectionTitle } from "../components/ui.jsx";
import { GroupTable } from "./screens2.jsx";

/* =================== TABLEAU : GROUPES + BRACKET =================== */
export function TableauScreen({ go, matches = WC.ALL_MATCHES }) {
  const [tab, setTab] = useState("groupes");
  const koMatches = matches.filter((m) => m.round === "ko" && (m.home || m.away));
  const real = matches !== WC.ALL_MATCHES;
  const letters = real ? Object.keys(WC.GROUPS) : WC.GROUP_LETTERS;
  return (
    <div className="content">
      <SectionTitle kicker="Phase de groupes → finale" title="Le tableau"
        right={<div className="seg">
          <button className={tab === "groupes" ? "on" : ""} onClick={() => setTab("groupes")}>12 groupes</button>
          <button className={tab === "bracket" ? "on" : ""} onClick={() => setTab("bracket")}>Phase finale</button>
        </div>} />

      {tab === "bracket" && (
        koMatches.length ? (
          <>
            <div className="card pad rise" style={{ marginBottom: 18, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              <span className="pill pill--accent"><span className="dot dot--pulse" /> Mise à jour auto</span>
              <span className="muted" style={{ fontSize: 13.5 }}>
                Dès qu'un résultat tombe, les classements de groupe se recalculent et le bracket place automatiquement les qualifiés.
              </span>
            </div>
            <Bracket go={go} />
          </>
        ) : (
          <div className="card pad-lg" style={{ textAlign: "center" }}>
            <div className="poster" style={{ fontSize: 24 }}>🏆 Phase finale à venir</div>
            <p className="muted" style={{ maxWidth: 460, margin: "8px auto 0" }}>
              Le tableau à élimination directe se remplira automatiquement une fois la phase de groupes terminée (à partir du 28 juin). En attendant, fais tes pronos sur les matchs de groupes !
            </p>
            <Btn variant="accent" onClick={() => go("matches")} style={{ marginTop: 14 }}>Voir les matchs →</Btn>
          </div>
        )
      )}

      {tab === "groupes" && (
        <div className="grid g-3">
          {letters.map((g) => <GroupTable key={g} g={g} matches={real ? matches : undefined} />)}
        </div>
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
export function Leaderboard({ go, profile, users: realUsers, me }) {
  const src = realUsers || WC.USERS;
  const meId = me && me.id;
  const users = src.map((u) => (u.isMe || (meId && u.id === meId))
    ? { ...u, isMe: true, pseudo: profile.pseudo, avatar: profile.avatar } : u);
  const [scope, setScope] = useState("general");
  const last = users[users.length - 1] || { pseudo: "—" };
  const podium = users.slice(0, 3);
  while (podium.length < 3) podium.push({ id: "ph" + podium.length, pseudo: "—", avatar: "·", pts: 0, exacts: 0 });

  return (
    <div className="content">
      <SectionTitle kicker={`${users.length} joueurs dans la ligue`} title="Classement"
        right={<div className="seg">
          <button className={scope === "general" ? "on" : ""} onClick={() => setScope("general")}>Général</button>
          <button className={scope === "semaine" ? "on" : ""} onClick={() => setScope("semaine")}>Cette semaine</button>
        </div>} />

      <div className="podium rise" style={{ marginBottom: 22 }}>
        {[podium[1], podium[0], podium[2]].map((u, i) => {
          const place = i === 1 ? 1 : i === 0 ? 2 : 3;
          const prize = WC.PRIZES.find((p) => p.rang === place);
          return (
            <div className={"pcol p" + place} key={u.id}>
              <div className="medal">{place === 1 ? "🏆 CHAMPION" : place === 2 ? "🥈 2E" : "🥉 3E"}</div>
              <div className="av">{u.avatar}</div>
              <div className="ps">{u.pseudo}</div>
              <div className="mono" style={{ fontSize: 12, opacity: .85 }}>{u.pts} pts · {u.exacts} exacts</div>
              <div style={{ marginTop: 8, fontSize: 12.5, fontWeight: 700 }}>{prize.lot}</div>
            </div>
          );
        })}
      </div>

      <div className="card pad">
        <table className="tbl">
          <thead><tr><th>#</th><th>Joueur</th><th>Exacts</th><th>Bons</th><th>Série</th><th style={{ textAlign: "right" }}>Points</th></tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className={u.isMe ? "me" : ""}>
                <td className="rank-n">{u.position}</td>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 30, height: 30, borderRadius: "50%", background: "var(--bg-2)", display: "grid", placeItems: "center", fontSize: 16 }}>{u.avatar}</div>
                    <b>{u.pseudo}</b>{u.isMe && <span className="pill pill--accent" style={{ fontSize: 10 }}>toi</span>}
                  </div>
                </td>
                <td className="mono">{u.exacts}</td>
                <td className="mono">{u.bons}</td>
                <td className="mono">{u.serie ? "🔥" + u.serie : "—"}</td>
                <td className="mono" style={{ textAlign: "right", fontWeight: 800, fontSize: 15 }}>{u.pts}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <hr className="divider" />
        <div className="mono muted" style={{ fontSize: 12, textAlign: "center" }}>🥄 Cuillère de bois pour <b style={{ color: "var(--ink)" }}>{last.pseudo}</b> — c'est lui qui paie la tournée pour l'instant !</div>
      </div>
    </div>
  );
}

/* =================== PROFIL =================== */
export function Profile({ profile, setProfile, predictions, me: meStats, matches = WC.ALL_MATCHES }) {
  const me = { ...(meStats || WC.ME), ...profile };
  const AV = ["⚽", "🦁", "🔥", "🚀", "👑", "🎯", "🐺", "🦅", "🧤", "🐉", "⭐", "🥅", "🏆", "💪", "🤩", "🐯", "🎩", "👻"];
  const [draft, setDraft] = useState({ pseudo: profile.pseudo, avatar: profile.avatar, email: profile.email || "toi@email.com", fav: profile.fav || "FRA" });
  const [saved, setSaved] = useState(false);

  const finis = matches.filter((m) => m.status === "fini" && predictions[m.id]);
  const exacts = finis.filter((m) => WC.points(predictions[m.id], m.score) === WC.BAREME.exact).length;

  function save() { setProfile((p) => ({ ...p, ...draft })); setSaved(true); setTimeout(() => setSaved(false), 1800); }

  const badges = [
    ["🎯", "Sniper", exacts + " scores exacts"],
    ["🔥", "En feu", "Série de " + me.serie],
    ["📅", "Assidu", finis.length + " pronos joués"],
    ["🌍", "Globe-trotter", "Pronos sur 6 confédérations"],
  ];

  return (
    <div className="content">
      <SectionTitle kicker="Ton compte" title="Profil" />
      <div className="grid g-2" style={{ gridTemplateColumns: "1fr 1.2fr", alignItems: "start" }}>
        <div className="card pad-lg rise" style={{ textAlign: "center" }}>
          <div style={{ width: 92, height: 92, borderRadius: "50%", background: "var(--bg-2)", display: "grid", placeItems: "center", fontSize: 46, margin: "0 auto 12px", border: "2px solid var(--line)" }}>{draft.avatar}</div>
          <div className="poster" style={{ fontSize: 26 }}>{draft.pseudo || "—"}</div>
          <div className="mono muted" style={{ fontSize: 12 }}>#{me.position} au classement · {me.pts} pts</div>
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8, marginTop: 8, whiteSpace: "nowrap" }}>
            <span className="muted" style={{ fontSize: 13 }}>Équipe de cœur</span><Roundel code={draft.fav} size={20} /><b style={{ fontSize: 13 }}>{WC.T[draft.fav].name}</b>
          </div>
          <hr className="divider" />
          <div className="grid g-2 keep" style={{ gap: 10 }}>
            {[[me.pts, "Points"], ["#" + me.position, "Rang"], [exacts, "Exacts"], [me.serie, "Série 🔥"]].map(([n, l], i) => (
              <div className="stat" key={i} style={{ padding: 12 }}><div className="n" style={{ fontSize: 26 }}>{n}</div><div className="l">{l}</div></div>
            ))}
          </div>
          <div className="eyebrow" style={{ margin: "18px 0 10px", textAlign: "left" }}>Badges</div>
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
          <div className="eyebrow" style={{ marginBottom: 14 }}>Personnaliser</div>
          <div className="field"><label>Pseudo</label><input className="input" maxLength={16} value={draft.pseudo} onChange={(e) => setDraft({ ...draft, pseudo: e.target.value })} /></div>
          <div className="field"><label>Email</label><input className="input" type="email" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} /></div>
          <div className="field">
            <label>Avatar</label>
            <div className="av-grid" style={{ gridTemplateColumns: "repeat(9,1fr)" }}>
              {AV.map((a) => <button key={a} className={draft.avatar === a ? "on" : ""} onClick={() => setDraft({ ...draft, avatar: a })}>{a}</button>)}
            </div>
          </div>
          <div className="field">
            <label>Équipe de cœur</label>
            <select className="input" value={draft.fav} onChange={(e) => setDraft({ ...draft, fav: e.target.value })}>
              {Object.keys(WC.T).map((c) => <option key={c} value={c}>{WC.T[c].name}</option>)}
            </select>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <Btn variant="accent" onClick={save} style={{ whiteSpace: "nowrap" }}>Enregistrer</Btn>
            {saved && <span className="pill pill--accent">✓ Profil mis à jour</span>}
          </div>
          <hr className="divider" />
          <div className="eyebrow" style={{ marginBottom: 8 }}>Préférences</div>
          {["Rappel email avant chaque coup d'envoi", "Notifs quand quelqu'un me dépasse", "Profil visible par toute la ligue"].map((p, i) => (
            <label key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", fontSize: 14 }}>
              <input type="checkbox" defaultChecked={i < 2} style={{ width: 18, height: 18, accentColor: "var(--accent)" }} />{p}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

/* =================== RÈGLES & BARÈME =================== */
export function Rules() {
  const B = WC.BAREME;
  const exemples = [
    ["Tu pronostiques 2–1, le match finit 2–1", "Score exact", B.exact, "exact"],
    ["Tu pronostiques 2–1, le match finit 3–2", "Bon vainqueur + bon écart (+1)", B.ecart, "good"],
    ["Tu pronostiques 2–1, le match finit 4–0", "Bon vainqueur, écart différent", B.issue, "good"],
    ["Tu pronostiques 1–1, le match finit 2–2", "Match nul bien vu", B.issue, "good"],
    ["Tu pronostiques 2–1, le match finit 0–2", "Mauvais résultat", B.rate, "zero"],
  ];
  return (
    <div className="content">
      <SectionTitle kicker="Comment on marque des points" title="Règles & barème" />

      <div className="grid g-2" style={{ alignItems: "start" }}>
        <div className="card pad-lg rise">
          <div className="eyebrow" style={{ marginBottom: 14 }}>Le barème</div>
          {[["Score exact", B.exact, "Le Graal : bon vainqueur ET bon score.", "exact"],
            ["Bon résultat + bon écart de buts", B.ecart, "Bon vainqueur et la bonne différence (2–1 → 3–2).", "good"],
            ["Bon résultat", B.issue, "Bon vainqueur (ou nul bien vu) mais pas le bon score.", "good"],
            ["Mauvais résultat", B.rate, "Pas le bon vainqueur. Zéro pointé.", "zero"]].map((r, i) => (
            <div key={i} style={{ display: "flex", gap: 14, alignItems: "center", padding: "14px 0", borderTop: i ? "1px solid var(--line)" : "none" }}>
              <span className={"pts " + (r[3] === "exact" ? "pts--exact" : r[3] === "good" ? "pts--good" : "pts--zero")} style={{ fontSize: 16, minWidth: 54, textAlign: "center" }}>+{r[1]}</span>
              <div><div style={{ fontWeight: 700 }}>{r[0]}</div><div className="muted" style={{ fontSize: 13 }}>{r[2]}</div></div>
            </div>
          ))}
          <div className="card pad" style={{ marginTop: 14, background: "var(--surface-2)" }}>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>🎁 Bonus</div>
            <div className="muted" style={{ fontSize: 13.5 }}>+{B.bonusSerie} pts par série de 3 bons pronos d'affilée · les matchs de phase finale rapportent davantage (l'enjeu monte à chaque tour).</div>
          </div>
        </div>

        <div>
          <div className="card pad-lg rise" style={{ marginBottom: 16 }}>
            <div className="eyebrow" style={{ marginBottom: 12 }}>Exemples concrets</div>
            {exemples.map((e, i) => (
              <div key={i} style={{ display: "flex", gap: 12, alignItems: "center", padding: "11px 0", borderTop: i ? "1px solid var(--line)" : "none" }}>
                <span className={"pts " + (e[3] === "exact" ? "pts--exact" : e[3] === "good" ? "pts--good" : "pts--zero")} style={{ minWidth: 40, textAlign: "center", flex: "0 0 auto" }}>+{e[2]}</span>
                <div style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 0 }}><div style={{ fontWeight: 600, fontSize: 14, lineHeight: 1.3 }}>{e[0]}</div><div className="muted" style={{ fontSize: 12, lineHeight: 1.2 }}>{e[1]}</div></div>
              </div>
            ))}
          </div>

          <div className="card pad-lg rise">
            <div className="eyebrow" style={{ marginBottom: 12 }}>Format du tournoi</div>
            <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7, fontSize: 14.5 }}>
              <li><b>48 équipes</b>, 12 groupes de 4 (A→L).</li>
              <li>Les <b>2 premiers</b> de chaque groupe + les <b>8 meilleurs 3es</b> filent en 32es.</li>
              <li>Puis élimination directe : 32es → 8es → quarts → demies → finale.</li>
              <li>Le <b>bracket se remplit automatiquement</b> à chaque résultat.</li>
              <li>Du 11 juin au 19 juillet 2026 · 104 matchs · USA · Canada · Mexique.</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="card pad-lg rise" style={{ marginTop: 16 }}>
        <div className="eyebrow" style={{ marginBottom: 12 }}>Les lots</div>
        <div className="grid g-4">
          {WC.PRIZES.map((p, i) => (
            <div key={i} className="card pad" style={{ background: "var(--surface-2)" }}>
              <div className="poster" style={{ fontSize: 20 }}>{typeof p.rang === "number" ? p.rang + (p.rang === 1 ? "er" : "e") : p.titre}</div>
              <div style={{ fontWeight: 700, margin: "6px 0 2px" }}>{p.lot}</div>
              <div className="muted" style={{ fontSize: 12.5 }}>{p.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
