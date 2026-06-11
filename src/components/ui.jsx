/* ui.jsx — primitives partagées */
import { useState, useEffect } from "react";
import { WC } from "../lib/wc.js";
import { getLang, setLang, t, JA_TEAMS } from "../lib/i18n.js";

// Nom d'équipe traduit (japonais si dispo).
export function teamName(code, fr) {
  return getLang() === "ja" && JA_TEAMS[code] ? JA_TEAMS[code] : (fr != null ? fr : (WC.T[code] ? WC.T[code].name : "—"));
}

// Compte à rebours vivant jusqu'à une date (s'arrête à 0).
export function Countdown({ date }) {
  const [, tick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => tick((x) => x + 1), 1000);
    return () => clearInterval(id);
  }, []);
  const ms = date - new Date();
  if (ms <= 0) return <span className="cd-live"><span className="dot dot--pulse" /> {t("En cours")}</span>;
  const s = Math.floor(ms / 1000);
  const j = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  const pad = (n) => String(n).padStart(2, "0");
  return (
    <span className="cd mono">
      {j > 0 && <><b className="poster">{j}</b><small>{t("j")}</small> </>}
      <b className="poster">{pad(h)}</b><small>h</small> <b className="poster">{pad(m)}</b><small>m</small> <b className="poster">{pad(sec)}</b><small>s</small>
    </span>
  );
}

// Bouton jour/nuit (le thème "nuit" existe dans le design system).
export function ThemeToggle({ compact }) {
  const [thm, setThm] = useState(document.documentElement.dataset.theme || "stade");
  const toggle = () => {
    const n = thm === "nuit" ? "stade" : "nuit";
    document.documentElement.dataset.theme = n;
    try { localStorage.setItem("pronos2026:theme", n); } catch (e) {}
    setThm(n);
  };
  return (
    <button onClick={toggle} title={thm === "nuit" ? "Mode jour" : "Mode nuit"}
      style={{ border: "1px solid var(--line)", background: "var(--surface-2)", color: "var(--ink)",
        borderRadius: 999, padding: compact ? "4px 8px" : "6px 12px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
      {thm === "nuit" ? "☀️" : "🌙"}
    </button>
  );
}

// Pluie de confettis (score exact / points gagnés). S'auto-détruit.
export function Confetti({ onDone }) {
  useEffect(() => { const id = setTimeout(() => onDone && onDone(), 3800); return () => clearTimeout(id); }, []);
  const colors = ["#d4a533", "#e8c97a", "#1f8a4c", "#d52b1e", "#2a5bd7", "#ffffff"];
  const pieces = Array.from({ length: 90 }, (_, i) => ({
    left: (i * 37 % 100), delay: (i % 12) * 0.12, dur: 2.4 + (i % 7) * 0.25,
    color: colors[i % colors.length], rot: (i * 53) % 360, w: 6 + (i % 3) * 3,
  }));
  return (
    <div className="confetti" aria-hidden="true">
      {pieces.map((p, i) => (
        <span key={i} style={{ left: p.left + "%", animationDelay: p.delay + "s", animationDuration: p.dur + "s",
          background: p.color, width: p.w, height: p.w * 0.45, transform: `rotate(${p.rot}deg)` }} />
      ))}
    </div>
  );
}

// Bouton de bascule de langue FR / 日本語.
export function LangToggle({ compact }) {
  const ja = getLang() === "ja";
  return (
    <button
      onClick={() => setLang(ja ? "fr" : "ja")}
      title={ja ? "Français" : "日本語"}
      style={{ border: "1px solid var(--line)", background: "var(--surface-2)", color: "var(--ink)",
        borderRadius: 999, padding: compact ? "4px 8px" : "6px 12px", fontWeight: 700, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }}>
      {ja ? "🇯🇵 日本語" : "🇫🇷 FR"}
    </button>
  );
}

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
        <div className="nm" style={{ fontWeight: bold ? 800 : 700 }}>{t ? teamName(code, t.name) : "—"}</div>
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
  const label = p === WC.BAREME.exact ? t("SCORE EXACT") : p > 0 ? t("BON RÉSULTAT") : t("RATÉ");
  return <span className={"pts " + cls}>+{p} · {label}</span>;
}

/* statut d'un match en pastille */
export function StatusPill({ m }) {
  if (m.status === "fini") return <Pill>{t("Terminé")}</Pill>;
  const now = new Date();
  if (m.date <= now) return <Pill kind="live"><span className="dot dot--pulse" /> {t("En cours")}</Pill>;
  const soon = m.date - now < 36e5 * 6;
  if (soon) return <Pill kind="accent">{t("Bientôt")}</Pill>;
  return <Pill>{t("À venir")}</Pill>;
}

/* résolution d'un slot bracket : code équipe OU placeholder "Vainqueur Mxx" */
export function slotLabel(m, side) {
  const code = side === "home" ? m.home : m.away;
  if (code) return <TeamLine code={code} showCode={false} size={22} />;
  const fromId = side === "home" ? m.fromA : m.fromB;
  return <span className="muted" style={{ fontStyle: "italic", fontSize: 13 }}>{fromId ? t("Vainqueur") + " " + fromId : t("À déterminer")}</span>;
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
