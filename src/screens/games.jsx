/* games.jsx — Mini-jeux foot. 1 essai par jour et par jeu (verrou serveur),
   défi réussi = +1 au classement Jeux. Le 1er avant les quarts gagne +10
   au classement général. */
import { useState, useEffect, useRef } from "react";
import { WC } from "../lib/wc.js";
import { hasSupabase } from "../lib/supabase.js";
import { fetchMyGamesToday, saveGameScore, fetchGamesLeaderboard, fetchGameRecords, todayFR } from "../lib/league.js";
import { Btn, SectionTitle, teamName, Confetti } from "../components/ui.jsx";
import { t } from "../lib/i18n.js";
import { daySeed, seededShuffle, flagEmoji, FLAG_POOL, ARBITRE } from "../lib/gamesData.js";

const GAMES = [
  { id: "penalty", icon: "🥅", name: "Tirs au but", goal: "4 buts sur 5" },
  { id: "jongles", icon: "⚽", name: "Jongles", goal: "20 jongles" },
  { id: "arbitre", icon: "⏱️", name: "Réflexe arbitre", goal: "série de 10" },
  { id: "casse", icon: "🧱", name: "Casse-brique foot", goal: "40 maillots" },
  { id: "drapeau", icon: "🚩", name: "Devine le drapeau", goal: "8 sur 10" },
];

/* =================== JEUX =================== */

/* ---- 🥅 Tirs au but ----
   Le gardien apprend : plus tu marques, plus il lit tes tirs.
   La lucarne reste payante (75 %) mais elle est toute petite. */
function Penalty({ onEnd }) {
  const [hist, setHist] = useState([]);   // true = but, false = arrêt
  const [anim, setAnim] = useState(null);
  const busy = useRef(false);

  function shoot(e) {
    if (busy.current || hist.length >= 5) return;
    busy.current = true;
    const r = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    const goals = hist.filter(Boolean).length;
    const ballSide = x < 0.34 ? "g" : x > 0.66 ? "d" : "c";
    // le gardien lit le tir : 33 % de base, +8 % par but déjà marqué
    const reads = Math.random() < 0.33 + goals * 0.08;
    const keeper = reads ? ballSide : ["g", "c", "d"].filter((s) => s !== ballSide)[Math.floor(Math.random() * 2)];
    const lucarne = y < 0.28 && (x < 0.2 || x > 0.8);
    const corner = x < 0.12 || x > 0.88;
    let goal;
    if (keeper !== ballSide) goal = true;
    else goal = lucarne ? Math.random() < 0.75 : corner ? Math.random() < 0.45 : false;
    setAnim({ x, y, keeper, goal, lucarne });
    setTimeout(() => {
      const nh = [...hist, goal];
      setHist(nh); setAnim(null); busy.current = false;
      if (nh.length >= 5) { const b = nh.filter(Boolean).length; onEnd(b, b >= 4); }
    }, 950);
  }

  return (
    <div style={{ textAlign: "center" }}>
      <div className="mono muted" style={{ marginBottom: 8, fontSize: 13 }}>
        {t("Tir")} {Math.min(hist.length + 1, 5)}/5 — {t("tape où tu veux tirer (la lucarne paie, mais elle est petite !)")}
      </div>
      <div className="goalbox" onPointerDown={shoot}>
        <div className="goal-net" />
        <div className={"keeper" + (anim ? " dive-" + anim.keeper : "")}>🧤</div>
        {anim && <div className="shotball" style={{ left: anim.x * 100 + "%", top: anim.y * 100 + "%" }}>⚽</div>}
        {anim && <div className={"verdict " + (anim.goal ? "v-goal" : "v-save")}>
          {anim.goal ? (anim.lucarne ? t("LUCARNE !") + " 🎯" : t("BUT !")) : t("ARRÊT !")}
        </div>}
      </div>
      <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 10, fontSize: 22 }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <span key={i}>{i < hist.length ? (hist[i] ? "⚽" : "🧤") : i === hist.length ? "👟" : "·"}</span>
        ))}
      </div>
    </div>
  );
}

/* ---- ⚽ Jongles ---- */
function Jongles({ onEnd, record }) {
  const [count, setCount] = useState(0);
  const [running, setRunning] = useState(false);
  const box = useRef(null), ball = useRef(null), st = useRef(null);

  function start() {
    setCount(0); setRunning(true);
    const W = box.current.clientWidth, H = box.current.clientHeight;
    st.current = { x: W / 2, y: H * 0.35, vx: 0, vy: 0, W, H, n: 0, dead: false };
    let last = performance.now();
    const loop = (now) => {
      const s = st.current;
      if (!s || s.dead) return;
      const dt = Math.min((now - last) / 16.7, 3); last = now;
      s.vy += 0.45 * dt * (1 + s.n * 0.015);   // gravité qui monte avec la série
      s.x += s.vx * dt; s.y += s.vy * dt;
      if (s.x < 22) { s.x = 22; s.vx = Math.abs(s.vx) * 0.85; }
      if (s.x > s.W - 22) { s.x = s.W - 22; s.vx = -Math.abs(s.vx) * 0.85; }
      if (s.y > s.H - 24) { s.dead = true; setRunning(false); onEnd(s.n, s.n >= 20); return; }
      if (s.y < 24) { s.y = 24; s.vy = Math.abs(s.vy) * 0.5; }
      if (ball.current) ball.current.style.transform = `translate(${s.x - 22}px, ${s.y - 22}px) rotate(${s.n * 40 + s.x}deg)`;
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  function tap(e) {
    const s = st.current;
    if (!s || s.dead || !running) return;
    const r = box.current.getBoundingClientRect();
    const cx = e.clientX - r.left, cy = e.clientY - r.top;
    if (Math.hypot(cx - s.x, cy - s.y) < 52) {
      s.vy = -(8.5 + Math.min(s.n * 0.08, 4));
      s.vx += (s.x - cx) * 0.22;             // tape sur le côté → le ballon part
      s.n++; setCount(s.n);
    }
  }

  useEffect(() => () => { if (st.current) st.current.dead = true; }, []);

  return (
    <div style={{ textAlign: "center" }}>
      <div className={"poster jcount" + (count > 0 && count % 10 === 0 ? " pop" : "")} key={count} style={{ fontSize: 44, marginBottom: 4, color: count >= 20 ? "var(--win)" : "var(--ink)" }}>{count}</div>
      <div className="mono muted" style={{ fontSize: 11.5, marginBottom: 6 }}>
        {t("Objectif")} : 20 {record ? ` · 🏅 ${t("Record")} : ${record.pseudo} (${record.score})` : ""}
      </div>
      <div ref={box} className="jugglebox" onPointerDown={tap}>
        {!running && <Btn variant="accent" onClick={(e) => { e.stopPropagation(); start(); }} style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)", zIndex: 2 }}>⚽ {t("Lancer le ballon")}</Btn>}
        <div ref={ball} className="juggleball">⚽</div>
        <div className="juggle-floor" />
      </div>
      <div className="mono muted" style={{ fontSize: 12, marginTop: 8 }}>{t("Tape le ballon pour le garder en l'air. 20 = défi réussi !")}</div>
    </div>
  );
}

/* ---- ⏱️ Réflexe arbitre ---- */
function Arbitre({ onEnd }) {
  const [deck] = useState(() => seededShuffle(ARBITRE, daySeed(todayFR()) ^ 99).concat(seededShuffle(ARBITRE, daySeed(todayFR()) ^ 7)));
  const [i, setI] = useState(0);
  const [serie, setSerie] = useState(0);
  const [fb, setFb] = useState(null);      // 'good' | 'bad' : flash de feedback
  const timer = useRef(null);
  const deadline = Math.max(1500 - serie * 55, 750);

  useEffect(() => {
    if (fb) return;
    timer.current = setTimeout(() => { setFb("bad"); setTimeout(() => onEnd(serie, serie >= 10), 450); }, deadline);
    return () => clearTimeout(timer.current);
  }, [i, fb]);

  function answer(a) {
    if (fb) return;
    clearTimeout(timer.current);
    const ok = a === deck[i][1];
    setFb(ok ? "good" : "bad");
    setTimeout(() => {
      if (ok) { setSerie(serie + 1); setI(i + 1); setFb(null); }
      else onEnd(serie, serie >= 10);
    }, ok ? 220 : 600);
  }

  return (
    <div style={{ textAlign: "center" }}>
      <div className="mono muted" style={{ fontSize: 13 }}>{t("Série")} : <b style={{ color: "var(--ink)" }}>{serie}</b> / 10 — {t("de plus en plus vite !")}</div>
      <div className="timerbar"><span key={i + (fb || "")} style={{ animationDuration: deadline + "ms", animationPlayState: fb ? "paused" : "running" }} /></div>
      <div className={"card pad-lg fbcard" + (fb ? " fb-" + fb : "")} style={{ margin: "10px 0 14px", minHeight: 84, display: "grid", placeItems: "center" }}>
        <div style={{ fontSize: 17, fontWeight: 700 }}>{deck[i][0]}</div>
        {fb === "bad" && <div className="mono" style={{ fontSize: 12, color: "var(--lose)" }}>
          {t("Bonne décision :")} {deck[i][1] === "ok" ? "✅" : deck[i][1] === "j" ? "🟨" : "🟥"}
        </div>}
      </div>
      <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
        <button className="refbtn" onClick={() => answer("ok")}>✅<br />{t("Laisser jouer")}</button>
        <button className="refbtn" onClick={() => answer("j")}>🟨<br />{t("Jaune")}</button>
        <button className="refbtn" onClick={() => answer("r")}>🟥<br />{t("Rouge")}</button>
      </div>
    </div>
  );
}

/* ---- 🧱 Casse-brique foot ----
   Brique dorée = ballon plus rapide · brique bleue (gourde) = banc élargi 8 s. */
function CasseBrique({ onEnd }) {
  const cv = useRef(null);
  const [info, setInfo] = useState({ broken: 0, lives: 3 });

  useEffect(() => {
    const c = cv.current, ctx = c.getContext("2d");
    const W = 340, H = 440;
    const COLS = 8, ROWS = 5, BW = 38, BH = 18, TOP = 40, GAP = 4;
    const bricks = [];
    for (let r = 0; r < ROWS; r++) for (let q = 0; q < COLS; q++) {
      const roll = Math.random();
      bricks.push({ x: 3 + q * (BW + GAP), y: TOP + r * (BH + GAP), kind: roll < 0.08 ? "gold" : roll < 0.16 ? "gourde" : "norm", row: r, on: true });
    }
    let paddleX = W / 2, paddleW = 68, wideUntil = 0;
    let ball = { x: W / 2, y: H - 34, vx: 0, vy: 0, stuck: true };
    let lives = 3, broken = 0, dead = false;
    const rowColors = ["#d52b1e", "#e36414", "#1f8a4c", "#2a5bd7", "#7a5ae0"];

    function move(e) {
      const r = c.getBoundingClientRect();
      paddleX = ((e.clientX - r.left) / r.width) * W;
    }
    function launch() {
      if (ball.stuck) { ball.stuck = false; ball.vx = (Math.random() - 0.5) * 3; ball.vy = -3.6; }
    }
    c.addEventListener("pointermove", move);
    c.addEventListener("pointerdown", (e) => { move(e); launch(); });

    function loop(now) {
      if (dead) return;
      const px = Math.max(paddleW / 2, Math.min(W - paddleW / 2, paddleX));
      paddleW = now < wideUntil ? 104 : 68;
      if (ball.stuck) { ball.x = px; ball.y = H - 34; }
      else {
        ball.x += ball.vx; ball.y += ball.vy;
        if (ball.x < 8 || ball.x > W - 8) ball.vx *= -1;
        if (ball.y < 8) ball.vy *= -1;
        if (ball.y > H - 26 && ball.y < H - 14 && Math.abs(ball.x - px) < paddleW / 2 + 4 && ball.vy > 0) {
          ball.vy = -Math.abs(ball.vy);
          ball.vx += (ball.x - px) * 0.07;
        }
        if (ball.y > H + 10) {
          lives--; setInfo({ broken, lives });
          if (lives <= 0) { dead = true; onEnd(broken, broken >= 40); return; }
          ball = { x: px, y: H - 34, vx: 0, vy: 0, stuck: true };
        }
        for (const b of bricks) {
          if (!b.on) continue;
          if (ball.x > b.x - 6 && ball.x < b.x + BW + 6 && ball.y > b.y - 6 && ball.y < b.y + BH + 6) {
            b.on = false; broken++; ball.vy *= -1;
            if (b.kind === "gold") { ball.vx = Math.max(-6.5, Math.min(6.5, ball.vx * 1.12)); ball.vy = Math.max(-6.5, Math.min(6.5, ball.vy * 1.12)); }
            if (b.kind === "gourde") wideUntil = now + 8000;
            setInfo({ broken, lives });
            break;
          }
        }
        if (broken >= COLS * ROWS) { dead = true; onEnd(broken, true); return; }
      }
      // dessin
      ctx.fillStyle = "#10301c"; ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = "rgba(255,255,255,.15)"; ctx.strokeRect(4, 4, W - 8, H - 8);
      for (const b of bricks) {
        if (!b.on) continue;
        ctx.fillStyle = b.kind === "gold" ? "#d4a533" : b.kind === "gourde" ? "#39b6d8" : rowColors[b.row];
        ctx.fillRect(b.x, b.y, BW, BH);
        ctx.font = "10px sans-serif";
        ctx.fillText(b.kind === "gourde" ? "🧴" : b.kind === "gold" ? "⚡" : "👕", b.x + BW / 2 - 6, b.y + BH - 5);
      }
      ctx.fillStyle = now < wideUntil ? "#39b6d8" : "#f3ede2";
      ctx.fillRect(px - paddleW / 2, H - 20, paddleW, 8);
      ctx.font = "16px sans-serif"; ctx.fillText("⚽", ball.x - 8, ball.y + 6);
      if (ball.stuck) { ctx.fillStyle = "rgba(255,255,255,.8)"; ctx.font = "13px sans-serif"; ctx.fillText(t("Tape pour lancer !"), W / 2 - 44, H / 2); }
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
    return () => { dead = true; c.removeEventListener("pointermove", move); };
  }, []);

  return (
    <div style={{ textAlign: "center" }}>
      <div className="mono muted" style={{ fontSize: 13, marginBottom: 8 }}>
        👕 {info.broken}/40 · {"❤️".repeat(Math.max(0, info.lives))} — ⚡ {t("= plus rapide")} · 🧴 {t("= banc élargi")}
      </div>
      <canvas ref={cv} width="340" height="440" className="brickcanvas" />
    </div>
  );
}

/* ---- 🚩 Devine le drapeau ---- */
function Drapeaux({ onEnd }) {
  const seed = daySeed(todayFR());
  const [rounds] = useState(() => {
    const pool = seededShuffle(FLAG_POOL, seed);
    return pool.slice(0, 10).map((code, i) => {
      const others = seededShuffle(pool.filter((c) => c !== code), seed + i * 13).slice(0, 3);
      return { code, choices: seededShuffle([code, ...others], seed + i * 31) };
    });
  });
  const [i, setI] = useState(0);
  const [bonnes, setBonnes] = useState(0);
  const [left, setLeft] = useState(30.0);
  const [fb, setFb] = useState(null); // { pick } : montre vert/rouge un instant
  const done = useRef(false);

  useEffect(() => {
    const id = setInterval(() => setLeft((l) => {
      if (l <= 0.1) { clearInterval(id); if (!done.current) { done.current = true; setTimeout(() => onEnd(bonnes, bonnes >= 8), 0); } return 0; }
      return +(l - 0.1).toFixed(1);
    }), 100);
    return () => clearInterval(id);
  }, [bonnes]);

  function pick(c) {
    if (done.current || fb) return;
    setFb({ pick: c });
    const ok = c === rounds[i].code;
    setTimeout(() => {
      const b = bonnes + (ok ? 1 : 0);
      setBonnes(b); setFb(null);
      if (i + 1 >= 10) { done.current = true; onEnd(b + Math.round(left), b >= 8); }
      else setI(i + 1);
    }, ok ? 180 : 550);
  }

  const nm = (c) => teamName(c, WC.T[c] ? WC.T[c].name : c);
  return (
    <div style={{ textAlign: "center" }}>
      <div className="mono muted" style={{ fontSize: 13 }}>{i + 1}/10 · ✅ {bonnes} · ⏱️ <b style={{ color: left < 8 ? "var(--lose)" : "var(--ink)" }}>{left.toFixed(0)}s</b></div>
      <div style={{ fontSize: 96, lineHeight: 1.2, margin: "10px 0" }}>{flagEmoji(rounds[i].code)}</div>
      <div className="choicegrid">
        {rounds[i].choices.map((c) => (
          <button key={c} onClick={() => pick(c)}
            className={"choicebtn" + (fb ? (c === rounds[i].code ? " good" : c === fb.pick ? " bad" : "") : "")}>
            {nm(c)}
          </button>
        ))}
      </div>
    </div>
  );
}

/* =================== HUB =================== */
const COMPONENTS = { penalty: Penalty, jongles: Jongles, arbitre: Arbitre, casse: CasseBrique, drapeau: Drapeaux };

function GameCard({ g, today, record, onPlay, isAdmin }) {
  const played = today[g.id];
  return (
    <div className="card pad gamecard rise">
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 34 }}>{g.icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800 }}>{t(g.name)}</div>
          <div className="mono muted" style={{ fontSize: 11 }}>{t("Défi")} : {t(g.goal)} = +1</div>
          {record && <div className="mono muted" style={{ fontSize: 11 }}>🏅 {t("Record")} : {record.pseudo} ({record.score})</div>}
        </div>
        {played
          ? <span style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
              <span className={"pill " + (played.won ? "pill--accent" : "")} style={{ fontSize: 12 }}>{played.won ? "✓ +1" : "✗"} · {played.score}</span>
              {isAdmin && <Btn variant="ghost" onClick={() => onPlay(g, true)} style={{ padding: "5px 10px", fontSize: 11.5 }}>🧪 {t("Tester")}</Btn>}
            </span>
          : <Btn variant="accent" onClick={() => onPlay(g, false)} style={{ padding: "8px 16px", whiteSpace: "nowrap" }}>{t("Jouer")}</Btn>}
      </div>
    </div>
  );
}

export function GamesScreen({ profile }) {
  const [section, setSection] = useState("jeux"); // jeux | classement
  const [today, setToday] = useState({});
  const [records, setRecords] = useState({});
  const [board, setBoard] = useState(null);
  const [active, setActive] = useState(null);     // { g, test } : jeu en cours
  const [result, setResult] = useState(null);     // { g, score, won, saveErr, test }

  async function load() {
    if (!hasSupabase) return;
    try {
      const [td, rec, lb] = await Promise.all([fetchMyGamesToday(), fetchGameRecords(), fetchGamesLeaderboard()]);
      setToday(td); setRecords(rec); setBoard(lb);
    } catch (e) { console.error("jeux:", e); }
  }
  useEffect(() => { load(); }, []);

  async function finish(g, score, won, test) {
    let saveErr = null;
    if (hasSupabase && !test) {
      const r = await saveGameScore(g.id, score, won);
      saveErr = r.error;
    }
    setActive(null);
    setResult({ g, score, won, saveErr, test });
    if (!test) load();
  }

  /* --- partie en cours --- */
  if (active) {
    const g = active.g;
    const Comp = COMPONENTS[g.id];
    return (
      <div className="content">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <h2 className="poster" style={{ margin: 0, fontSize: 24 }}>{g.icon} {t(g.name)}{active.test ? " 🧪" : ""}</h2>
          <Btn variant="ghost" onClick={() => setActive(null)} style={{ padding: "7px 12px", fontSize: 12.5 }}>{t("Abandonner")}</Btn>
        </div>
        {active.test && <div className="mono muted" style={{ fontSize: 11.5, marginBottom: 10 }}>🧪 {t("Partie test (admin) — non comptée au classement.")}</div>}
        <div className="card pad-lg">
          <Comp onEnd={(score, won) => finish(g, score, won, active.test)} record={records[g.id]} />
        </div>
      </div>
    );
  }

  return (
    <div className="content">
      {result && result.won && <Confetti onDone={() => {}} />}
      <SectionTitle kicker={t("Un essai par jour et par jeu")} title={t("Mini-jeux") + " 🎮"}
        right={<div className="seg">
          <button className={section === "jeux" ? "on" : ""} onClick={() => setSection("jeux")}>{t("Jeux")}</button>
          <button className={section === "classement" ? "on" : ""} onClick={() => setSection("classement")}>🏅 {t("Classement Jeux")}</button>
        </div>} />

      {result && (
        <div className={"card pad-lg rise"} style={{ marginBottom: 16, textAlign: "center", borderColor: result.won ? "var(--win)" : "var(--line)" }}>
          <div style={{ fontSize: 40 }}>{result.test ? "🧪" : result.won ? "🎉" : "😅"}</div>
          <div className="poster" style={{ fontSize: 22 }}>
            {result.g.icon} {t(result.g.name)} — {t("score")} {result.score}
          </div>
          <div style={{ fontWeight: 700, color: result.won ? "var(--win)" : "var(--ink-soft)", margin: "4px 0 10px" }}>
            {result.test
              ? t("Partie test (admin) — non comptée au classement.")
              : result.won ? t("Défi réussi : +1 au classement Jeux !") : t("Raté pour aujourd'hui… retente demain !")}
          </div>
          {result.saveErr && <div className="mono" style={{ fontSize: 11.5, color: "var(--lose)" }}>⚠️ {result.saveErr}</div>}
          <Btn variant="ghost" onClick={() => setResult(null)} style={{ padding: "7px 14px", fontSize: 12.5 }}>OK</Btn>
        </div>
      )}

      {section === "jeux" && (
        <>
          <div className="card pad rise" style={{ marginBottom: 16 }}>
            <span className="muted" style={{ fontSize: 13.5 }}>
              🏅 {t("Chaque défi réussi = +1 au classement Jeux. Juste avant les quarts de finale, le 1er du classement Jeux gagne +10 points au classement général !")}
            </span>
          </div>
          <div className="grid g-2">
            {GAMES.map((g) => <GameCard key={g.id} g={g} today={today} record={records[g.id]} isAdmin={!!profile.is_admin}
              onPlay={(game, test) => setActive({ g: game, test })} />)}
          </div>
        </>
      )}

      {section === "classement" && (
        <div className="card pad">
          <div className="eyebrow" style={{ marginBottom: 10 }}>🏅 {t("Classement Jeux")} — {t("le 1er avant les quarts gagne +10 au général")}</div>
          {!board && <p className="muted">…</p>}
          {board && <div className="tblwrap"><table className="tbl">
            <thead><tr><th>#</th><th>{t("Joueur")}</th><th>{t("Parties")}</th><th>{t("Points")}</th></tr></thead>
            <tbody>
              {board.map((u, i, arr) => {
                // Ex æquo : mêmes points = même rang (1, 2, 2, 4…). Le "=" signale l'égalité.
                const rank = arr.findIndex((x) => x.pts === u.pts) + 1;
                const tie = arr.filter((x) => x.pts === u.pts).length > 1;
                return (
                  <tr key={u.user_id} style={u.user_id === profile.id ? { fontWeight: 800 } : null}>
                    <td className="mono">{rank}{tie ? "=" : ""}</td>
                    <td><span style={{ marginRight: 8 }}>{u.avatar}</span>{u.pseudo}</td>
                    <td className="mono">{u.parties}</td>
                    <td className="mono" style={{ fontWeight: 800 }}>{u.pts}</td>
                  </tr>
                );
              })}
            </tbody>
          </table></div>}
        </div>
      )}
    </div>
  );
}
