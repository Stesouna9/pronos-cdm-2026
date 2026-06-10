/* ui.jsx — primitives partagées */
import { WC } from "../lib/wc.js";

/* Roundel : identité visuelle d'une équipe (bandes CSS, pas un vrai drapeau) */
export function Roundel({ code, size = 26 }) {
  const t = WC.T[code];
  if (!t) return <div className="roundel" style={{ width: size, height: size }} />;
  const c = t.colors;
  const bg = `linear-gradient(120deg, ${c[0]} 0 38%, ${c[1]} 38% 64%, ${c[2] || c[0]} 64% 100%)`;
  return <div className="roundel" style={{ width: size, height: size }}><span style={{ background: bg }} /></div>;
}

/* Ligne équipe : roundel + nom (+ code) */
export function TeamLine({ code, reverse, showCode = true, size = 26, bold }) {
  const t = WC.T[code];
  return (
    <div className={"team-line" + (reverse ? " away" : "")} style={reverse ? { flexDirection: "row-reverse" } : null}>
      <Roundel code={code} size={size} />
      <div style={{ minWidth: 0, textAlign: reverse ? "right" : "left" }}>
        <div className="nm" style={{ fontWeight: bold ? 800 : 700 }}>{t ? t.name : "—"}</div>
        {showCode && <div className="code">{code}</div>}
      </div>
    </div>
  );
}

export function Btn({ variant = "", className = "", children, ...rest }) {
  const v = variant ? variant.split(" ").map((x) => "btn--" + x).join(" ") : "";
  return <button className={`btn ${v} ${className}`} {...rest}>{children}</button>;
}

export function Pill({ kind = "", children }) {
  return <span className={"pill" + (kind ? " pill--" + kind : "")}>{children}</span>;
}

/* badge de points obtenus pour un prono */
export function PointsBadge({ pred, real }) {
  const p = WC.points(pred, real);
  if (p === null || p === undefined) return null;
  const cls = p === WC.BAREME.exact ? "pts--exact" : p > 0 ? "pts--good" : "pts--zero";
  const label = p === WC.BAREME.exact ? "SCORE EXACT" : p > 0 ? "BON RÉSULTAT" : "RATÉ";
  return <span className={"pts " + cls}>+{p} · {label}</span>;
}

/* statut d'un match en pastille */
export function StatusPill({ m }) {
  if (m.status === "fini") return <Pill>Terminé</Pill>;
  const soon = m.date - WC.NOW < 36e5 * 6 && m.date > WC.NOW;
  if (soon) return <Pill kind="accent">Bientôt</Pill>;
  return <Pill>À venir</Pill>;
}

/* résolution d'un slot bracket : code équipe OU placeholder "Vainqueur Mxx" */
export function slotLabel(m, side) {
  const code = side === "home" ? m.home : m.away;
  if (code) return <TeamLine code={code} showCode={false} size={22} />;
  const fromId = side === "home" ? m.fromA : m.fromB;
  return <span className="muted" style={{ fontStyle: "italic", fontSize: 13 }}>Vainqueur {fromId}</span>;
}

/* score affiché (avec t.a.b. si pens) */
export function scoreText(m) {
  if (!m.score) return "–";
  let s = `${m.score[0]} – ${m.score[1]}`;
  if (m.pens) s += ` (${m.pens[0]}–${m.pens[1]} t.a.b.)`;
  return s;
}

/* Avatar rond */
export function Avatar({ user, size = 34 }) {
  return <div className="userchip-av" style={{ width: size, height: size, borderRadius: "50%", display: "grid", placeItems: "center", fontSize: size * 0.5, background: "var(--bg-2)" }}>{user.avatar}</div>;
}

/* Section title */
export function SectionTitle({ kicker, title, right }) {
  return (
    <div className="page-head">
      <div>
        {kicker && <div className="eyebrow" style={{ marginBottom: 6 }}>{kicker}</div>}
        <h1 className="page-title poster">{title}</h1>
      </div>
      {right}
    </div>
  );
}
